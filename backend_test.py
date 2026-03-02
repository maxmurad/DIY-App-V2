#!/usr/bin/env python3
"""
DIY Home Repair Backend API Test Suite
Tests all backend endpoints with proper image handling
"""

import requests
import base64
import json
import sys
from PIL import Image, ImageDraw
import io
import os
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://home-fix-vision.preview.emergentagent.com/api"

def create_test_image():
    """Create a realistic test image of a leaking faucet for testing"""
    # Create a 400x300 image with realistic faucet-like features
    img = Image.new('RGB', (400, 300), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a simple faucet representation
    # Faucet body (silver/gray)
    draw.rectangle([150, 100, 250, 180], fill='#C0C0C0', outline='#808080', width=2)
    
    # Spout
    draw.rectangle([200, 180, 220, 220], fill='#C0C0C0', outline='#808080', width=2)
    
    # Handle
    draw.ellipse([120, 120, 160, 160], fill='#A0A0A0', outline='#606060', width=2)
    
    # Water drops (blue) to simulate leak
    draw.ellipse([205, 225, 215, 235], fill='#0066CC')
    draw.ellipse([208, 240, 218, 250], fill='#0066CC')
    draw.ellipse([210, 255, 220, 265], fill='#0066CC')
    
    # Sink edge
    draw.rectangle([100, 270, 300, 290], fill='#F0F0F0', outline='#D0D0D0', width=2)
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=85)
    img_data = buffer.getvalue()
    return base64.b64encode(img_data).decode('utf-8')

def test_root_endpoint():
    """Test GET /api/ endpoint"""
    print("🔍 Testing root endpoint...")
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "status" in data:
                print("✅ Root endpoint working correctly")
                return True
            else:
                print("❌ Root endpoint missing required fields")
                return False
        else:
            print(f"❌ Root endpoint failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Root endpoint error: {str(e)}")
        return False

def test_empty_projects():
    """Test GET /api/projects (should return empty initially)"""
    print("\n🔍 Testing empty projects list...")
    try:
        response = requests.get(f"{BACKEND_URL}/projects")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "projects" in data and isinstance(data["projects"], list):
                print(f"✅ Projects endpoint working, found {len(data['projects'])} projects")
                return True, data["projects"]
            else:
                print("❌ Projects endpoint missing 'projects' field or not a list")
                return False, []
        else:
            print(f"❌ Projects endpoint failed with status {response.status_code}")
            return False, []
    except Exception as e:
        print(f"❌ Projects endpoint error: {str(e)}")
        return False, []

def test_diagnose_endpoint():
    """Test POST /api/diagnose with test image"""
    print("\n🔍 Testing diagnose endpoint with test image...")
    
    # Create test image
    test_image_b64 = create_test_image()
    
    payload = {
        "image_base64": test_image_b64,
        "description": "leaking faucet in kitchen - water dripping from spout"
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/diagnose",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response keys: {list(data.keys())}")
            
            # Check if we have a project
            if "project" in data:
                project = data["project"]
                print(f"Project ID: {project.get('id', 'Missing')}")
                print(f"Title: {project.get('title', 'Missing')}")
                print(f"Hardware Identified: {project.get('hardware_identified', 'Missing')}")
                print(f"Issue Type: {project.get('issue_type', 'Missing')}")
                print(f"Skill Level: {project.get('skill_level', 'Missing')}")
                print(f"Steps Count: {len(project.get('steps', []))}")
                print(f"Materials Count: {len(project.get('materials', []))}")
                print(f"Tools Count: {len(project.get('tools', []))}")
                
                # Validate required fields
                required_fields = ['id', 'title', 'hardware_identified', 'issue_type', 'skill_level', 'steps', 'materials', 'tools']
                missing_fields = [field for field in required_fields if field not in project]
                
                if not missing_fields:
                    print("✅ Diagnose endpoint working correctly - all required fields present")
                    return True, project
                else:
                    print(f"❌ Diagnose endpoint missing fields: {missing_fields}")
                    return False, None
            else:
                print("❌ Diagnose endpoint missing 'project' field")
                return False, None
        else:
            print(f"❌ Diagnose endpoint failed with status {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error details: {error_detail}")
            except:
                print(f"Error response: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Diagnose endpoint error: {str(e)}")
        return False, None

def test_get_specific_project(project_id):
    """Test GET /api/projects/{project_id}"""
    print(f"\n🔍 Testing get specific project: {project_id}")
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if "project" in data and data["project"]["id"] == project_id:
                print("✅ Get specific project working correctly")
                return True
            else:
                print("❌ Get specific project returned incorrect data")
                return False
        elif response.status_code == 404:
            print("❌ Project not found (404)")
            return False
        else:
            print(f"❌ Get specific project failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get specific project error: {str(e)}")
        return False

def test_toggle_item_ownership(project_id, project_data):
    """Test POST /api/projects/{project_id}/toggle-item"""
    print(f"\n🔍 Testing toggle item ownership for project: {project_id}")
    
    # Find first material or tool to toggle
    item_to_toggle = None
    if project_data.get('materials') and len(project_data['materials']) > 0:
        item_to_toggle = project_data['materials'][0]
        item_type = "material"
    elif project_data.get('tools') and len(project_data['tools']) > 0:
        item_to_toggle = project_data['tools'][0]
        item_type = "tool"
    
    if not item_to_toggle:
        print("❌ No materials or tools found to test toggle")
        return False
    
    item_id = item_to_toggle['id']
    current_owned = item_to_toggle.get('already_owned', False)
    new_owned = not current_owned
    
    print(f"Toggling {item_type} '{item_to_toggle['name']}' from {current_owned} to {new_owned}")
    
    payload = {
        "item_id": item_id,
        "owned": new_owned
    }
    
    try:
        response = requests.post(
            f"{BACKEND_URL}/projects/{project_id}/toggle-item",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Toggle item ownership working correctly")
                return True
            else:
                print("❌ Toggle item ownership returned success=false")
                return False
        else:
            print(f"❌ Toggle item ownership failed with status {response.status_code}")
            try:
                error_detail = response.json()
                print(f"Error details: {error_detail}")
            except:
                print(f"Error response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Toggle item ownership error: {str(e)}")
        return False

def test_delete_project(project_id):
    """Test DELETE /api/projects/{project_id}"""
    print(f"\n🔍 Testing delete project: {project_id}")
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_id}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("✅ Delete project working correctly")
                return True
            else:
                print("❌ Delete project returned success=false")
                return False
        elif response.status_code == 404:
            print("❌ Project not found for deletion (404)")
            return False
        else:
            print(f"❌ Delete project failed with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Delete project error: {str(e)}")
        return False

def test_projects_after_deletion():
    """Test that project list is updated after deletion"""
    print("\n🔍 Testing projects list after deletion...")
    try:
        response = requests.get(f"{BACKEND_URL}/projects")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            projects_count = len(data.get("projects", []))
            print(f"Projects remaining: {projects_count}")
            print("✅ Projects list accessible after deletion")
            return True
        else:
            print(f"❌ Projects list failed after deletion with status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Projects list error after deletion: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print("🚀 Starting DIY Home Repair Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 60)
    
    results = {}
    
    # Test 1: Root endpoint
    results['root'] = test_root_endpoint()
    
    # Test 2: Empty projects list
    results['empty_projects'], initial_projects = test_empty_projects()
    
    # Test 3: Diagnose endpoint (create project)
    results['diagnose'], created_project = test_diagnose_endpoint()
    
    if created_project:
        project_id = created_project['id']
        
        # Test 4: Get specific project
        results['get_project'] = test_get_specific_project(project_id)
        
        # Test 5: Toggle item ownership
        results['toggle_item'] = test_toggle_item_ownership(project_id, created_project)
        
        # Test 6: Delete project
        results['delete_project'] = test_delete_project(project_id)
        
        # Test 7: Projects list after deletion
        results['projects_after_delete'] = test_projects_after_deletion()
    else:
        print("\n⚠️  Skipping remaining tests due to diagnose failure")
        results['get_project'] = False
        results['toggle_item'] = False
        results['delete_project'] = False
        results['projects_after_delete'] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed!")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)