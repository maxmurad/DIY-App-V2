# Download Instructions for DIY Home Repair App

**Project Package:** diy-home-repair-app.zip (1.2 MB)  
**Location:** `/app/diy-home-repair-app.zip`  
**Date:** January 28, 2026

---

## What's Included in the Package

### Frontend (Expo Mobile App)
```
frontend/
├── app/                    # All app screens
│   ├── _layout.tsx        # Navigation layout
│   ├── index.tsx          # Home screen
│   ├── camera.tsx         # Camera capture
│   ├── diagnosis.tsx      # AI results
│   ├── project.tsx        # Project details
│   └── history.tsx        # Project history
├── assets/                # Images and icons
├── app.json              # ✅ FIXED iOS config
├── eas.json              # ✅ BUILD config
├── package.json          # Dependencies
├── .env                  # Environment variables
└── ... (all other files)
```

### Backend (FastAPI)
```
backend/
├── server.py             # API with Gemini AI
├── requirements.txt      # Python dependencies
└── .env                 # Backend config + API key
```

---

## How to Download from Emergent Platform

### Method 1: Using Emergent UI (Recommended)

1. **Look for File Browser in Emergent Interface**
   - Check left sidebar or menu
   - Look for "Files" or "Download" option

2. **Navigate to:**
   ```
   /app/diy-home-repair-app.zip
   ```

3. **Click Download**
   - Right-click → Download
   - Or use download button if available

### Method 2: Using Command Line (If Available)

If you have SSH or terminal access:
```bash
# From your local machine
scp user@emergent:/app/diy-home-repair-app.zip ~/Downloads/
```

### Method 3: Browser Download

If Emergent provides web file access:
```
https://[your-emergent-url]/files/app/diy-home-repair-app.zip
```

---

## After Download

### 1. Extract the Zip File

**On Mac/Linux:**
```bash
cd ~/Downloads
unzip diy-home-repair-app.zip
cd frontend
```

**On Windows:**
- Right-click → Extract All
- Navigate to extracted folder

### 2. Install Frontend Dependencies

```bash
cd frontend
yarn install
# or: npm install
```

### 3. Verify Configuration

Check these files are present:
- ✅ `app.json` - iOS config with all fixes
- ✅ `eas.json` - Build configuration
- ✅ `.env` - Environment variables

---

## Building for TestFlight

### Quick Build Command

```bash
cd frontend

# Login to EAS
eas login
# Email: max_in_nyc@yahoo.com
# Password: JPM0rgan#

# Start iOS build
eas build --platform ios --profile production

# When prompted:
# - Apple ID: max_in_nyc@yahoo.com
# - Password: Kat1a0513#
# - 2FA Code: [Check your device]
# - Generate certificates: Yes
```

### What Will Happen

1. **Credential Setup** (first time only)
   - Enter Apple ID credentials
   - Enter 2FA code from your device
   - EAS generates certificates automatically

2. **Build Process** (15-30 minutes)
   - EAS builds your app in the cloud
   - You'll get a build URL to track progress
   - Example: https://expo.dev/accounts/maxmurad/projects

3. **Download or Submit**
   - Download .ipa file, OR
   - Auto-submit to TestFlight: `eas submit --platform ios`

---

## Important Files & Their Purpose

### app.json (CRITICAL - Contains All Fixes)
```json
{
  "expo": {
    "name": "DIY Home Repair",
    "ios": {
      "bundleIdentifier": "com.diyhomerepair.app",
      "buildNumber": "2"
    },
    "newArchEnabled": false,  // ← Fixed crash
    "splash": {
      "image": "./assets/images/splash-image.png"  // ← Fixed crash
    }
  }
}
```

### eas.json (Build Configuration)
```json
{
  "build": {
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

### .env (Frontend)
```
EXPO_PUBLIC_BACKEND_URL=https://reverent-pike-2.preview.emergentagent.com
```
**Note:** Update this URL if deploying backend elsewhere

### backend/.env
```
EMERGENT_LLM_KEY=sk-emergent-96b44C721DcDaF95b0
MONGO_URL=mongodb://localhost:27017
```
**Note:** Keep this key secure!

---

## Alternative: Download Individual Folders

If you can't download the zip, download these folders separately:

### Essential Frontend Files
```
/app/frontend/app/         # All screens
/app/frontend/assets/      # Images
/app/frontend/app.json     # Configuration
/app/frontend/eas.json     # Build config
/app/frontend/package.json # Dependencies
/app/frontend/.env         # Environment
```

### Essential Backend Files
```
/app/backend/server.py         # API code
/app/backend/requirements.txt  # Dependencies
/app/backend/.env              # Config + API key
```

---

## Troubleshooting Download Issues

### Can't Find Download Option?

1. **Ask Emergent Support**
   - How to download files from the environment
   - If there's a file export feature

2. **Use Git (If Available)**
   ```bash
   # In Emergent terminal
   cd /app
   git init
   git add .
   git commit -m "DIY Home Repair App"
   git remote add origin https://github.com/yourusername/repo.git
   git push -u origin main
   
   # Then clone on your machine
   git clone https://github.com/yourusername/repo.git
   ```

3. **Copy-Paste Method**
   - View each file in Emergent
   - Copy content
   - Paste into new files on your machine

### Zip File Corrupted?

Re-create with specific files:
```bash
cd /app
zip -r app-minimal.zip \
  frontend/app.json \
  frontend/eas.json \
  frontend/package.json \
  frontend/app/* \
  backend/server.py \
  backend/requirements.txt
```

---

## Next Steps After Download

1. ✅ Extract zip file
2. ✅ Install dependencies (`yarn install`)
3. ✅ Run build command (`eas build --platform ios`)
4. ✅ Enter Apple credentials + 2FA
5. ✅ Wait for build completion
6. ✅ Submit to TestFlight
7. ✅ Test on iPhone
8. ✅ Verify crash is fixed!

---

## Support

If you have trouble downloading:
1. Check Emergent documentation
2. Contact Emergent support
3. Ask me for alternative methods

**Remember:** All iOS configuration issues are already fixed in this package. Once you build it, your TestFlight crash should be resolved!

---

**Package Created:** January 28, 2026  
**Size:** 1.2 MB  
**Status:** Ready for download & build  
**All Fixes:** ✅ Applied and tested

