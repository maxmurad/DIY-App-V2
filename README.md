# DIY Home Repair - AI-Powered Mobile App

An intelligent mobile application that helps users diagnose and repair home issues using AI vision analysis.

## 🎯 Features

### Phase 1 MVP (Current)
- **AI-Powered Visual Diagnosis** - Upload or capture photos of home repair issues
- **Gemini 1.5 Pro Vision** - Advanced image recognition for hardware and material identification
- **Step-by-Step Instructions** - Detailed repair guides with conditional logic
- **Skill Level Assessment** - Rates projects from Novice to Expert
- **Material & Tool Lists** - Comprehensive lists with cost estimates
- **Project History** - Save and track all repair projects
- **Safety Warnings** - Project and step-level safety information
- **iOS AR Ready** - Infrastructure for AR overlay guidance (iOS)

## 📱 Tech Stack

### Frontend
- **Expo SDK 54** - React Native framework
- **TypeScript** - Type-safe development
- **expo-router** - File-based navigation
- **expo-camera** - Camera integration
- **expo-image-picker** - Gallery access
- **React Native** - Cross-platform mobile development

### Backend
- **FastAPI** - High-performance Python API
- **Gemini 1.5 Pro Vision** - AI image analysis
- **MongoDB** - Document database
- **Motor** - Async MongoDB driver
- **emergentintegrations** - Unified AI API access

### AI & Cloud
- **Gemini 1.5 Pro Vision** - Image analysis and repair guidance
- **Emergent LLM Key** - Universal API access

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and Yarn
- Python 3.11+
- MongoDB
- Expo account
- Apple Developer account (for iOS builds)

### Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Start development server
expo start

# For Expo Go testing
expo start --tunnel
```

### Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Environment Variables

**Frontend (.env):**
```env
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**Backend (.env):**
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=diy_home_repair
EMERGENT_LLM_KEY=your-key-here
```

## 📦 Building for Production

### iOS Build with EAS

```bash
cd frontend

# Login to EAS
eas login

# Build for iOS
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

### Android Build

```bash
# Build for Android
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android
```

## 🏗️ Project Structure

```
DIY-AI/
├── frontend/                # Expo mobile app
│   ├── app/                # Screens (expo-router)
│   │   ├── _layout.tsx    # Navigation layout
│   │   ├── index.tsx      # Home screen
│   │   ├── camera.tsx     # Camera capture
│   │   ├── diagnosis.tsx  # AI results
│   │   ├── project.tsx    # Project details
│   │   └── history.tsx    # Project history
│   ├── assets/            # Images and fonts
│   ├── app.json           # Expo configuration
│   ├── eas.json           # Build configuration
│   └── package.json       # Dependencies
├── backend/               # FastAPI server
│   ├── server.py         # API endpoints
│   ├── requirements.txt  # Python dependencies
│   └── .env             # Backend config
└── README.md            # This file
```

## 🔑 Key API Endpoints

### Diagnosis
```
POST /api/diagnose
Body: { image_base64, description }
Response: Complete project with steps, materials, tools
```

### Projects
```
GET /api/projects           # List all projects
GET /api/projects/{id}      # Get specific project
DELETE /api/projects/{id}   # Delete project
```

### Toggle Item Ownership
```
POST /api/projects/{id}/toggle-item
Body: { item_id, owned }
```

## 🎨 App Features Detail

### 1. Camera Integration
- Real-time photo capture
- Gallery upload
- Image preview with description

### 2. AI Diagnosis
- Hardware identification
- Material recognition
- Issue type detection
- Skill level assessment (1-4)
- Time estimation

### 3. Repair Instructions
- Expandable step-by-step guide
- Conditional logic (if/then scenarios)
- Image hints for AR guidance
- Step-specific warnings

### 4. Material & Tool Management
- Comprehensive lists
- Cost estimates
- Ownership tracking
- Mock "Add to Cart" feature

### 5. Project History
- All saved repairs
- Quick access to previous projects
- Delete functionality
- Pull-to-refresh

## 🛠️ Configuration

### iOS Configuration (app.json)
```json
{
  "ios": {
    "bundleIdentifier": "com.diyhomerepair.app",
    "buildNumber": "2",
    "infoPlist": {
      "NSCameraUsageDescription": "Take photos of repairs",
      "NSPhotoLibraryUsageDescription": "Select repair photos"
    }
  }
}
```

### Build Profiles (eas.json)
- **development** - Development builds
- **preview** - Internal testing
- **production** - App Store releases

## 📊 Skill Level System

| Level | Name | Description | Time | Tools |
|-------|------|-------------|------|-------|
| 1 | Novice | No power tools | <30 min | Basic hand tools |
| 2 | Beginner | Basic tools | 1-2 hrs | Hammer, screwdriver |
| 3 | Intermediate | Power tools | 2-4 hrs | Drill, saw |
| 4 | Expert | Specialized | 4+ hrs | Professional tools |

## 🔒 Security Notes

- API keys stored in environment variables
- Base64 image encoding for database storage
- No hardcoded credentials
- Proper CORS configuration
- MongoDB connection secured

## 🐛 Known Issues & Fixes

### iOS TestFlight Crash (FIXED)
- ✅ Splash screen path corrected
- ✅ Bundle identifier added
- ✅ New architecture disabled
- ✅ Camera/picker plugins configured

### React Version Mismatch (FIXED)
- ✅ Updated to React 19.1.0
- ✅ Matches react-native-renderer

## 📱 Testing

### Expo Go (Development)
```bash
expo start --tunnel
# Scan QR code with Expo Go app
```

### TestFlight (iOS)
1. Build with EAS
2. Submit to TestFlight
3. Install via TestFlight app

### Android Testing
1. Build APK/AAB
2. Install directly or via Play Store beta

## 🚦 Database Schema

### Projects Collection
```javascript
{
  id: String,
  title: String,
  description: String,
  skill_level: Number (1-4),
  skill_level_name: String,
  estimated_time: String,
  image_base64: String,
  hardware_identified: String,
  issue_type: String,
  steps: [InstructionStep],
  materials: [MaterialTool],
  tools: [MaterialTool],
  safety_warnings: [String],
  created_at: DateTime
}
```

## 🎯 Roadmap

### Phase 2 (Future)
- [ ] Full AR implementation with expo-ar-kit
- [ ] Gamification (badges, points, streaks)
- [ ] Maintenance calendar
- [ ] Community features
- [ ] Real commerce integration
- [ ] Video snippet library
- [ ] Smart home IoT integration

## 📝 License

Private project - All rights reserved

## 👤 Author

**Max Murad**
- Email: max_in_nyc@yahoo.com
- GitHub: [@maxmurad](https://github.com/maxmurad)

## 🙏 Acknowledgments

- Expo team for amazing mobile framework
- Google for Gemini AI API
- Emergent for unified AI integration
- React Native community

## 📞 Support

For issues or questions:
1. Check documentation in `/app/*.md` files
2. Review TestFlight fix guide
3. Check Expo documentation
4. Contact developer

---

**Built with ❤️ using Expo, React Native, FastAPI, and Gemini AI**

**Last Updated:** January 28, 2026  
**Version:** 1.0.0 (Build 2)  
**Status:** Production Ready ✅
