from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime
import base64
from google import genai
from google.genai import types
from PIL import Image
import io
import json
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'test_database')]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Google Gemini API Key
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
# Fallback to Emergent key if Google key is missing (for backward compatibility in dev)
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Configure Gemini Client
# Prioritize GOOGLE_API_KEY
client_genai = None
if GOOGLE_API_KEY:
    client_genai = genai.Client(api_key=GOOGLE_API_KEY)
elif EMERGENT_LLM_KEY:
    logging.warning("Using EMERGENT_LLM_KEY. This may fail on cloud deployment. Please set GOOGLE_API_KEY.")
    client_genai = genai.Client(api_key=EMERGENT_LLM_KEY)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ Models ============

class DiagnosisRequest(BaseModel):
    image_base64: str
    description: Optional[str] = ""

class MaterialTool(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # "material" or "tool"
    estimated_cost: Optional[str] = None
    already_owned: bool = False

class InstructionStep(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    step_number: int
    title: str
    description: str
    warning: Optional[str] = None
    image_hint: Optional[str] = None
    generated_images: List[str] = []  # Base64 encoded AI-generated images
    images_generating: bool = False   # Flag to show loading state

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    skill_level: int  # 1-4
    skill_level_name: str  # "Novice", "Beginner", "Intermediate", "Expert"
    estimated_time: str
    image_base64: str
    thumbnail_base64: Optional[str] = "" # For list view
    hardware_identified: str
    issue_type: str
    steps: List[InstructionStep]
    materials: List[MaterialTool]
    tools: List[MaterialTool]
    safety_warnings: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectResponse(BaseModel):
    project: Project

class ProjectListResponse(BaseModel):
    projects: List[Project]

class ToggleItemRequest(BaseModel):
    item_id: str
    owned: bool

# ============ AI Helper Functions ============

def get_skill_level_name(level: int) -> str:
    """Convert skill level number to name"""
    mapping = {
        1: "Novice",
        2: "Beginner",
        3: "Intermediate",
        4: "Expert"
    }
    return mapping.get(level, "Beginner")

async def analyze_repair_with_ai(image_base64: str, description: str) -> Dict:
    """Use Google Gemini 2.5 Flash to analyze the repair need"""
    try:
        if "base64," in image_base64:
            image_base64 = image_base64.split("base64,")[1]
        
        try:
            image_bytes = base64.b64decode(image_base64)
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as img_err:
            logger.error(f"Image processing error: {img_err}")
            raise HTTPException(status_code=400, detail="Invalid image data")
            
        return await analyze_common(image, description)
    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        # Fallback error handling
        if "404" in str(e):
             raise HTTPException(status_code=404, detail=f"AI Model not found or not compatible. {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

async def analyze_repair_with_upload(content_part: types.Part, description: str) -> Dict:
    """Analyze repair using a file part (video or image)"""
    return await analyze_common(content_part, description)

async def analyze_common(content, description: str) -> Dict:
    """Common analysis logic"""
    try:
        if not client_genai:
             raise ValueError("Google GenAI client not initialized. Check API keys.")

        system_context = """You are an expert DIY home repair consultant.
Analyze the provided video or image to give detailed, actionable repair guidance.
If provided a video, pay attention to sound and movement to diagnose the issue.

Analyze the provided media and description to give detailed, actionable repair guidance."""

        analysis_prompt = f"""{system_context}

User description: {description if description else 'No description provided.'}

Analyze this media for a DIY home repair assessment.
Provide a comprehensive analysis in the following JSON format:
{{
  "title": "Brief descriptive title of the repair (e.g., 'Fix Leaky Moen Kitchen Faucet')",
  "hardware_identified": "Specific hardware/material identified (brand, model if visible)",
  "issue_type": "Type of damage or issue identified",
  "description": "Detailed description of the problem and what needs to be fixed",
  "skill_level": 1-4 (1=Novice: no power tools, <30min | 2=Beginner: basic tools, 1-2hrs | 3=Intermediate: power tools, potential risks | 4=Expert: permits/specialized knowledge),
  "estimated_time": "Time estimate (e.g., '30 minutes', '2-3 hours')",
  "safety_warnings": ["List of important safety warnings"],
  "steps": [
    {{
      "step_number": 1,
      "title": "Step title",
      "description": "Detailed step description with micro-steps. Include conditional logic like 'If X, then do Y, otherwise do Z'",
      "warning": "Optional safety warning for this specific step",
      "image_hint": "Brief description of what to look for or how to position (for AR overlay)"
    }}
  ],
  "materials": [
    {{
      "name": "Material name",
      "estimated_cost": "$X-Y or 'included' or 'varies'"
    }}
  ],
  "tools": [
    {{
      "name": "Tool name",
      "estimated_cost": "$X-Y or 'common household item'"
    }}
  ]
}}

IMPORTANT:
- Be specific about hardware (brands, models, types)
- Include conditional logic in steps (if/then scenarios)
- Rate difficulty honestly based on the criteria
- Include at least 5-10 detailed steps
- List all materials and tools needed
- Provide safety warnings for any risky steps
- RETURN ONLY RAW JSON. Do not include markdown formatting like ```json ... ```"""

        response = client_genai.models.generate_content(
            model='gemini-3-flash-preview', 
            contents=[analysis_prompt, content],
            config=types.GenerateContentConfig(
                temperature=0.2,
            )
        )
        
        response_text = response.text
        logger.info(f"AI Response received")

        # Clean up response if it contains markdown
        response_text = response_text.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        
        analysis = json.loads(response_text)
        return analysis

    except Exception as e:
        logger.error(f"AI analysis error: {str(e)}")
        # Fallback error handling
        if "404" in str(e):
             raise HTTPException(status_code=404, detail=f"AI Model not found or not compatible. {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


# ============ API Routes ============

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@api_router.get("/")
async def root():
    return {"message": "DIY Home Repair API", "status": "running"}

@api_router.post("/diagnose", response_model=ProjectResponse)
async def diagnose_repair(request: DiagnosisRequest):
    """Analyze an image and create a repair project"""
    try:
        # Validate base64 image
        if not request.image_base64:
            raise HTTPException(status_code=400, detail="Image is required")

        # Get AI analysis
        analysis = await analyze_repair_with_ai(request.image_base64, request.description or "")

        # Create materials and tools lists with IDs
        materials = [
            MaterialTool(
                name=m["name"],
                category="material",
                estimated_cost=m.get("estimated_cost", "varies")
            )
            for m in analysis.get("materials", [])
        ]

        tools = [
            MaterialTool(
                name=t["name"],
                category="tool",
                estimated_cost=t.get("estimated_cost", "varies")
            )
            for t in analysis.get("tools", [])
        ]

        # Create instruction steps with IDs
        steps = [
            InstructionStep(
                step_number=s["step_number"],
                title=s["title"],
                description=s["description"],
                warning=s.get("warning"),
                image_hint=s.get("image_hint")
            )
            for s in analysis.get("steps", [])
        ]

        # Create thumbnail from image
        try:
            img_data = request.image_base64.split("base64,")[1] if "base64," in request.image_base64 else request.image_base64
            img_bytes = base64.b64decode(img_data)
            img = Image.open(io.BytesIO(img_bytes))
            img.thumbnail((300, 300)) # Resize to max 300x300
            buffered = io.BytesIO()
            img.save(buffered, format="JPEG", quality=70)
            thumb_base64_data = base64.b64encode(buffered.getvalue()).decode('utf-8')
            real_thumbnail = f"data:image/jpeg;base64,{thumb_base64_data}"
        except Exception as e:
            logger.warning(f"Failed to generate thumbnail: {e}")
            real_thumbnail = request.image_base64 # Fallback

        # Create project
        skill_level = analysis.get("skill_level", 2)
        project = Project(
            title=analysis.get("title", "Repair Project"),
            description=analysis.get("description", ""),
            skill_level=skill_level,
            skill_level_name=get_skill_level_name(skill_level),
            estimated_time=analysis.get("estimated_time", "1-2 hours"),
            image_base64=request.image_base64,
            thumbnail_base64=real_thumbnail, 
            hardware_identified=analysis.get("hardware_identified", "Unknown"),
            issue_type=analysis.get("issue_type", "General repair"),
            steps=steps,
            materials=materials,
            tools=tools,
            safety_warnings=analysis.get("safety_warnings", [])
        )

        # Save to database
        project_dict = project.dict()
        await db.projects.insert_one(project_dict)

        logger.info(f"Project created: {project.id}")
        return ProjectResponse(project=project)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Diagnosis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to diagnose: {str(e)}")

@api_router.post("/diagnose-upload", response_model=ProjectResponse)
async def diagnose_upload(
    file: UploadFile = File(...),
    description: str = Form(default=""),
    thumbnail_base64: str = Form(default="")
):
    """Analyze an uploaded file (video/image) and create a repair project.
    
    This endpoint processes videos and images in-memory without saving to disk,
    making it compatible with stateless deployments like Render.com.
    """
    try:
        logger.info(f"Received upload: filename={file.filename}, content_type={file.content_type}, description_length={len(description)}, thumbnail_provided={bool(thumbnail_base64)}")
        
        # Read file content
        content_bytes = await file.read()
        mime_type = file.content_type or "application/octet-stream"
        
        logger.info(f"File read: {len(content_bytes)} bytes, mime_type={mime_type}")
        
        # Determine if video or image
        is_video = mime_type.startswith("video")
        
        # Create GenAI part for AI analysis
        content_part = types.Part.from_bytes(data=content_bytes, mime_type=mime_type)
        
        # Analyze with AI
        logger.info("Starting AI analysis...")
        analysis = await analyze_repair_with_upload(content_part, description)
        logger.info(f"AI analysis complete: {analysis.get('title', 'No title')}")
        
        # Helper function to normalize base64 data (ensure single prefix)
        def normalize_base64(data: str) -> str:
            if not data:
                return ""
            # Strip existing prefix if present
            if "base64," in data:
                data = data.split("base64,")[1]
            # Add proper prefix
            return f"data:image/jpeg;base64,{data}"
        
        # Handle image/thumbnail storage
        stored_image_base64 = ""
        stored_thumbnail_base64 = ""
        
        if is_video:
            # For videos, use the provided thumbnail
            stored_image_base64 = normalize_base64(thumbnail_base64)
            stored_thumbnail_base64 = stored_image_base64
        else:
            # For images, use thumbnail if provided, otherwise encode the uploaded image
            if thumbnail_base64:
                stored_image_base64 = normalize_base64(thumbnail_base64)
            else:
                img_b64 = base64.b64encode(content_bytes).decode('utf-8')
                stored_image_base64 = f"data:image/jpeg;base64,{img_b64}"
            stored_thumbnail_base64 = stored_image_base64

        # Create materials/tools/steps
        materials = [
            MaterialTool(name=m["name"], category="material", estimated_cost=m.get("estimated_cost", "varies"))
            for m in analysis.get("materials", [])
        ]
        tools = [
            MaterialTool(name=t["name"], category="tool", estimated_cost=t.get("estimated_cost", "varies"))
            for t in analysis.get("tools", [])
        ]
        steps = [
            InstructionStep(
                step_number=s["step_number"],
                title=s["title"],
                description=s["description"],
                warning=s.get("warning"),
                image_hint=s.get("image_hint")
            )
            for s in analysis.get("steps", [])
        ]

        skill_level = analysis.get("skill_level", 2)
        project = Project(
            title=analysis.get("title", "Repair Project"),
            description=analysis.get("description", ""),
            skill_level=skill_level,
            skill_level_name=get_skill_level_name(skill_level),
            estimated_time=analysis.get("estimated_time", "1-2 hours"),
            image_base64=stored_image_base64,
            thumbnail_base64=stored_thumbnail_base64,
            hardware_identified=analysis.get("hardware_identified", "Unknown"),
            issue_type=analysis.get("issue_type", "General repair"),
            steps=steps,
            materials=materials,
            tools=tools,
            safety_warnings=analysis.get("safety_warnings", [])
        )
        
        await db.projects.insert_one(project.dict())
        logger.info(f"Project created via upload: {project.id}")
        return ProjectResponse(project=project)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Diagnosis upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to diagnose: {str(e)}")

@api_router.get("/projects", response_model=ProjectListResponse)
async def get_projects():
    """Get all saved projects"""
    try:
        # Optimize: exclude large base64 images from list view
        # Include thumbnail_base64
        projection = {
            "image_base64": 0  # Exclude base64 to reduce payload
        }
        projects_data = await db.projects.find({}, projection).sort("created_at", -1).to_list(100)
        
        # Add placeholder for image_base64 to satisfy model
        for proj in projects_data:
            proj["image_base64"] = ""
            if "thumbnail_base64" not in proj:
                 proj["thumbnail_base64"] = ""
        
        projects = [Project(**proj) for proj in projects_data]
        return ProjectListResponse(projects=projects)
    except Exception as e:
        logger.error(f"Failed to fetch projects: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch projects: {str(e)}")

@api_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get a specific project by ID"""
    try:
        project_data = await db.projects.find_one({"id": project_id})
        if not project_data:
            raise HTTPException(status_code=404, detail="Project not found")
        project = Project(**project_data)
        return ProjectResponse(project=project)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch project: {str(e)}")

@api_router.post("/projects/{project_id}/toggle-item")
async def toggle_item_ownership(project_id: str, request: ToggleItemRequest):
    """Toggle whether user owns a material or tool"""
    try:
        # Optimize: Use atomic update instead of fetch-modify-replace
        # Try updating in materials array first
        result = await db.projects.update_one(
            {"id": project_id, "materials.id": request.item_id},
            {"$set": {"materials.$.already_owned": request.owned}}
        )
        
        # If not found in materials, try tools array
        if result.matched_count == 0:
            result = await db.projects.update_one(
                {"id": project_id, "tools.id": request.item_id},
                {"$set": {"tools.$.already_owned": request.owned}}
            )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Project or item not found")

        return {"success": True, "message": "Item updated"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to toggle item: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to toggle item: {str(e)}")

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    """Delete a project"""
    try:
        result = await db.projects.delete_one({"id": project_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"success": True, "message": "Project deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete project: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
