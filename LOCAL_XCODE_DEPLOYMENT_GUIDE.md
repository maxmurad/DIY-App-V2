# Local Xcode Build Deployment Guide
**DIY Home Repair Mobile App - iOS Deployment**  
**Complete Step-by-Step Instructions**

---

## Prerequisites

Before starting, ensure you have:

### Required Software:
- ✅ **macOS** (Monterey 12.0 or later recommended)
- ✅ **Xcode 14.0+** (Download from Mac App Store)
- ✅ **Xcode Command Line Tools** (Install via Xcode)
- ✅ **Node.js 18+** and **Yarn** or **npm**
- ✅ **CocoaPods** (Install: `sudo gem install cocoapods`)

### Required Accounts:
- ✅ **Apple Developer Account** ($99/year)
  - Active membership at https://developer.apple.com/account/
- ✅ **GitHub Account** (to clone repository)

### Verify Installations:
```bash
# Check Node version
node --version  # Should be 18+

# Check Yarn
yarn --version  # Or use npm

# Check CocoaPods
pod --version  # Should be 1.11+

# Check Xcode
xcodebuild -version  # Should be 14+
```

---

## Step 1: Clone Repository from GitHub

Open Terminal and run:

```bash
# Navigate to your desired directory
cd ~/Projects  # or wherever you want

# Clone the repository
git clone https://github.com/maxmurad/DIY-AI.git

# Navigate into the project
cd DIY-AI

# Verify you have the latest code
git pull origin main
git status
```

**Expected Output:**
```
Cloning into 'DIY-AI'...
remote: Enumerating objects...
Receiving objects: 100%
```

---

## Step 2: Install Frontend Dependencies

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies with Yarn (recommended)
yarn install

# Or with npm
# npm install

# Wait for installation to complete (2-5 minutes)
```

**Expected Output:**
```
[1/4] Resolving packages...
[2/4] Fetching packages...
[3/4] Linking dependencies...
[4/4] Building fresh packages...
✨ Done in 180.34s
```

**Troubleshooting:**
- If you get permission errors: Don't use `sudo`
- If packages fail: Delete `node_modules` and `yarn.lock`, then retry
- If version conflicts: Update Node.js to latest LTS

---

## Step 3: Generate iOS Native Project

This step creates the native iOS project using your custom Podfile with C++ fixes:

```bash
# Make sure you're in the frontend directory
cd ~/Projects/DIY-AI/frontend

# Generate iOS project
npx expo prebuild --platform ios --clean

# This will:
# - Create ios/ directory
# - Install CocoaPods dependencies
# - Configure native modules
# - Use your custom Podfile with C++17 fixes
```

**Expected Output:**
```
✔ Created native iOS project
✔ Installing pods
✔ Config synced
```

**Wait Time:** 3-5 minutes (CocoaPods installation takes time)

**Common Issues:**

**Issue: "expo-cli not found"**
```bash
# Install Expo CLI globally
npm install -g expo-cli
```

**Issue: CocoaPods installation fails**
```bash
# Update CocoaPods
sudo gem install cocoapods

# Then retry prebuild
npx expo prebuild --platform ios --clean
```

**Issue: "ios directory already exists"**
```bash
# The --clean flag should handle this, but if not:
rm -rf ios
npx expo prebuild --platform ios --clean
```

---

## Step 4: Open Project in Xcode

```bash
# From the frontend directory
open ios/DIYHomeRepair.xcworkspace

# IMPORTANT: Open .xcworkspace NOT .xcodeproj
# The .xcworkspace includes CocoaPods dependencies
```

**Expected:** Xcode launches and loads the project

**⚠️ Critical:** Always open `.xcworkspace`, not `.xcodeproj`

---

## Step 5: Configure Signing & Certificates

### 5.1 Add Your Apple ID to Xcode

1. In Xcode, go to **Xcode → Preferences** (or Settings on newer versions)
2. Click **Accounts** tab
3. Click the **+** button (bottom left)
4. Select **Apple ID**
5. Enter your credentials:
   - **Apple ID:** max_in_nyc@yahoo.com
   - **Password:** Your regular Apple password (NOT app-specific)
6. Click **Sign In**
7. If prompted for 2FA code, enter it from your device

**Verify:** You should see your account listed with your team name

### 5.2 Configure Project Signing

1. In Xcode's left sidebar, click on **DIYHomeRepair** (blue icon at top)
2. In the main editor, select **DIYHomeRepair** under TARGETS
3. Click on **Signing & Capabilities** tab

4. Configure the settings:
   - ✅ Check **"Automatically manage signing"**
   - **Team:** Select your team from dropdown (should appear after adding Apple ID)
   - **Bundle Identifier:** Should already be `com.diyhomerepair.app`
   - **Provisioning Profile:** Will be created automatically

5. Repeat for test target (if present):
   - Select **DIYHomeRepairTests** target
   - Set same Team and signing settings

**Expected:** 
- ✅ Green checkmark appears
- ✅ "Signing for 'DIYHomeRepair' requires a development team"... message disappears

**Common Issues:**

**Issue: "No matching provisioning profiles found"**
- Solution: Ensure Bundle ID is unique. Change to: `com.yourname.diyhomerepair`
- Update in app.json and regenerate: `npx expo prebuild --platform ios --clean`

**Issue: "Failed to create provisioning profile"**
- Solution: Verify Apple Developer membership is active
- Visit: https://developer.apple.com/account/

---

## Step 6: Build the Project (Test Compilation)

Before archiving, let's verify the project builds successfully:

1. In Xcode, select a destination:
   - Click device dropdown (next to Run/Stop buttons)
   - Select **"Any iOS Device (arm64)"**
   - Or select your connected iPhone if available

2. Build the project:
   - Go to **Product → Build** (or press ⌘B)
   - Watch the progress in the top center of Xcode
   - Wait for build to complete (5-10 minutes first time)

**Expected Output:**
```
Build Succeeded
```

**If Build Fails:**

**Check the Error Navigator** (triangle icon in left sidebar)
- Click on errors to see details
- Most common issues and fixes below

**Common Build Errors:**

**Error: "Command PhaseScriptExecution failed"**
```bash
# In Terminal, clean CocoaPods
cd ios
rm -rf Pods Podfile.lock
pod install
# Then rebuild in Xcode
```

**Error: "Cycle in dependencies"**
```bash
# In Xcode: Product → Clean Build Folder (⌘⇧K)
# Then build again
```

**Error: C++ compilation errors**
```
# Our custom Podfile should prevent this
# If it still occurs, verify Podfile is present:
cat ios/Podfile | grep "CLANG_CXX_LANGUAGE_STANDARD"
# Should show: c++17
```

**Error: "Signing certificate missing"**
- Go back to Signing & Capabilities
- Reselect your Team
- Click "Download Manual Profiles"

---

## Step 7: Archive the Project

Once the build succeeds, create an archive for TestFlight:

### 7.1 Select Generic iOS Device

1. In the device dropdown (top left), select:
   - **"Any iOS Device (arm64)"**
   - Do NOT select Simulator
   - Archives only work with real device targets

### 7.2 Create Archive

1. Go to **Product → Archive**
2. Wait for the archive process (10-15 minutes)
3. Watch progress in the top center

**Expected:** Archive completes successfully

**If Archive Fails:**
- Check all the same build error solutions above
- Ensure "Any iOS Device" is selected, not Simulator
- Clean build folder: Product → Clean Build Folder

### 7.3 Organizer Window Opens

After archiving, the **Organizer** window opens automatically.

You should see:
- Your app name: **DIY Home Repair**
- Version: **1.0.0**
- Build number: **4**
- Date and time of archive

---

## Step 8: Distribute to TestFlight

### 8.1 Select Archive

In the Organizer window:
1. Select your most recent archive (top of the list)
2. Click **"Distribute App"** button (right side)

### 8.2 Distribution Method

1. Select **"App Store Connect"**
2. Click **Next**

### 8.3 Distribution Options

1. Select **"Upload"**
   - This uploads to App Store Connect for TestFlight
2. Click **Next**

### 8.4 App Store Connect Distribution Options

1. Options to select:
   - ✅ **Include bitcode:** NO (uncheck)
   - ✅ **Upload your app's symbols:** YES (check)
   - ✅ **Manage Version and Build Number:** YES (check - Xcode will auto-increment)

2. Click **Next**

### 8.5 Re-sign Binary (if needed)

1. Select your signing certificate and provisioning profile
   - Should use the ones Xcode created
   - **"Automatically manage signing"** should be selected

2. Click **Next**

### 8.6 Review and Upload

1. Review the archive details:
   - App name
   - Version
   - Build number
   - Bundle ID
   - Certificates

2. Click **Upload**

3. **Wait for upload** (5-15 minutes depending on internet speed)
   - Progress bar shows upload status
   - Don't close Xcode during upload

**Expected:** "Upload Successful" message

---

## Step 9: App Store Connect Processing

### 9.1 Check Upload Status

1. Go to: https://appstoreconnect.apple.com/
2. Sign in with your Apple ID
3. Click **My Apps**
4. Select **DIY Home Repair** (or create new app if first time)

### 9.2 First Time Setup (If New App)

If this is your first upload, you need to create the app listing:

1. Click **+** → **New App**
2. Fill in details:
   - **Platforms:** iOS
   - **Name:** DIY Home Repair
   - **Primary Language:** English (US)
   - **Bundle ID:** com.diyhomerepair.app
   - **SKU:** com.diyhomerepair.app (or any unique ID)
   - **User Access:** Full Access

3. Click **Create**

### 9.3 Wait for Processing

1. Go to **TestFlight** tab (top of page)
2. Look for **"Processing"** status
3. **Wait time:** 15-45 minutes

**Processing Steps:**
- ✅ Upload Received
- ⏳ Processing
- ⏳ Testing (automatic app review)
- ✅ Ready to Test

**Email Notification:** You'll receive email when ready

---

## Step 10: Configure TestFlight

### 10.1 Test Information

While waiting for processing, configure test details:

1. In App Store Connect, go to **TestFlight** tab
2. Under **Test Information**, fill in:
   - **What to Test:** "Initial release - test all core features"
   - **Test Notes:** Any specific instructions for testers
   - **Feedback Email:** max_in_nyc@yahoo.com
   - **Marketing URL:** (optional)

### 10.2 Add Internal Testers

1. Under **Internal Testing** section
2. Click **Add Internal Testers** (if you have team members)
3. Or test yourself directly

### 10.3 Add External Testers (Optional)

1. Under **External Testing** section
2. Create a test group
3. Add tester emails
4. Submit for Beta App Review (required for external testers)

---

## Step 11: Install and Test on iPhone

### 11.1 Install TestFlight App

On your iPhone:
1. Open **App Store**
2. Search for **"TestFlight"**
3. Download and install (free app from Apple)

### 11.2 Accept Invite

Option A: If you added yourself as tester:
1. Check email (max_in_nyc@yahoo.com)
2. Click **"View in TestFlight"** link
3. Opens TestFlight app

Option B: Direct access (if you're the developer):
1. Open TestFlight app
2. Sign in with Apple ID
3. App should appear automatically

### 11.3 Install Your App

1. In TestFlight, find **DIY Home Repair**
2. Tap **Install**
3. Wait for download (app size ~50-100 MB)
4. Tap **Open** once installed

---

## Step 12: Test the Application

### 12.1 Complete Test Checklist

Test all features systematically:

**App Launch:**
- [ ] App opens without crashing
- [ ] Splash screen displays correctly
- [ ] Home screen loads properly

**Camera Functionality:**
- [ ] "Start New Repair" button works
- [ ] Camera permission request appears
- [ ] Can grant camera permission
- [ ] Camera view opens
- [ ] Can capture photo
- [ ] Can select from gallery
- [ ] Image preview shows correctly

**Keyboard Interaction:**
- [ ] Description text box opens keyboard
- [ ] Can type description
- [ ] Keyboard dismisses when tapping outside
- [ ] Keyboard dismisses when pressing "Done"
- [ ] Keyboard dismisses when pressing "Analyze"

**AI Analysis:**
- [ ] "Analyze" button works
- [ ] Loading indicator shows
- [ ] Analysis completes (may take 10-30 seconds)
- [ ] Results screen displays

**Results Display:**
- [ ] Repair title shows correctly
- [ ] Skill level badge displays
- [ ] Time estimate shows
- [ ] Safety warnings display (if any)
- [ ] Materials list shows
- [ ] Tools list shows
- [ ] Step-by-step instructions display

**Project History:**
- [ ] Can navigate to history screen
- [ ] Saved projects display
- [ ] Can open saved project
- [ ] Can delete project
- [ ] Pull-to-refresh works

**Navigation:**
- [ ] All screen transitions work
- [ ] Back navigation works
- [ ] Tab navigation works (if applicable)

### 12.2 Report Issues

If you find any issues:
1. Note the specific steps to reproduce
2. Take screenshots if possible
3. Note device model and iOS version
4. Check crash logs in Settings → Privacy → Analytics

---

## Troubleshooting Guide

### Build Issues

**"No such module 'ExpoModulesCore'"**
```bash
cd ios
pod install
# Reopen .xcworkspace in Xcode
```

**"Multiple commands produce..."**
```
# In Xcode: File → Project Settings
# Click "Advanced"
# Select "Unique" for Build System
# Rebuild
```

**"Code signing error"**
1. Check Apple Developer membership is active
2. Verify Bundle ID is unique
3. Go to Signing & Capabilities
4. Try "Download Manual Profiles"
5. Or uncheck/recheck "Automatically manage signing"

### Archive Issues

**"Generic iOS Device not available"**
- Xcode → Preferences → Locations
- Command Line Tools: Select Xcode version
- Restart Xcode

**"Archive not showing in Organizer"**
- Product → Clean Build Folder
- Product → Archive again

### Upload Issues

**"Invalid Binary"**
- Ensure version/build numbers are incremented
- Check Bundle ID matches App Store Connect
- Verify all required icons are present

**"Upload Failed"**
- Check internet connection
- Try uploading from Xcode Organizer again
- Or use Application Loader (legacy tool)

### TestFlight Issues

**"App stuck in Processing"**
- Normal wait time: up to 1 hour
- If longer: Check for email from Apple
- May require additional info or compliance

**"App not appearing in TestFlight"**
- Ensure you're signed in with correct Apple ID
- Check that processing completed in App Store Connect
- Try logging out and back in to TestFlight

---

## Common Questions

### Q: How long does the whole process take?
**A:** 
- Build and archive: 20-30 minutes
- Upload: 5-15 minutes  
- App Store processing: 15-60 minutes
- **Total: 40 minutes to 2 hours**

### Q: Do I need to rebuild every time I make a change?
**A:** 
- For code changes: Yes, need new archive
- For App Store metadata: No, can update in App Store Connect

### Q: How do I update the app after initial release?
**A:**
1. Pull latest code from GitHub
2. Increment build number in app.json
3. Run `npx expo prebuild --platform ios --clean`
4. Archive and upload again
5. New build appears in TestFlight

### Q: Can I skip TestFlight and go straight to App Store?
**A:** Not recommended. Always test via TestFlight first. After testing, you can promote the build to production from App Store Connect.

### Q: What if the C++ error appears in Xcode too?
**A:** The custom Podfile should prevent this. If it occurs:
1. Verify Podfile exists in ios/
2. Check it contains C++17 settings
3. Run `pod install` again
4. Clean build folder and rebuild

### Q: How do I get the app icon to show correctly?
**A:** Icons should be generated during prebuild. If missing:
1. Check assets/images/icon.png exists
2. Run `npx expo prebuild --platform ios --clean`
3. Xcode should show icons in Assets.xcassets

---

## Version Management

### Incrementing Build Numbers

For each new TestFlight build:

1. Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",  // Keep same for minor updates
    "ios": {
      "buildNumber": "5"  // Increment this (was 4, now 5)
    }
  }
}
```

2. Regenerate iOS project:
```bash
npx expo prebuild --platform ios --clean
```

3. Archive and upload again

---

## Success Checklist

Before considering deployment complete:

**Code:**
- [ ] Latest code pulled from GitHub
- [ ] Dependencies installed
- [ ] iOS project generated with prebuild

**Xcode:**
- [ ] Opened .xcworkspace (not .xcodeproj)
- [ ] Apple ID added to Xcode
- [ ] Signing configured correctly
- [ ] Build succeeded without errors
- [ ] Archive created successfully

**App Store Connect:**
- [ ] Binary uploaded
- [ ] Processing completed
- [ ] TestFlight configured

**Testing:**
- [ ] App installed via TestFlight
- [ ] All features tested on device
- [ ] No crashes or major bugs
- [ ] Ready for users

---

## Next Steps After Successful TestFlight

### For Beta Testing:
1. Add external testers
2. Submit for Beta App Review
3. Collect feedback
4. Fix any issues
5. Upload new build if needed

### For App Store Release:
1. Complete App Store listing:
   - Description
   - Screenshots (iPhone 6.7", 6.5", 5.5")
   - Preview videos (optional)
   - Keywords
   - Privacy policy URL
   - Support URL

2. Set pricing (Free or Paid)

3. Select TestFlight build to release

4. Submit for App Store Review

5. Wait for approval (1-3 days typically)

6. Release to App Store!

---

## Summary

You've now successfully:
- ✅ Deployed iOS app using local Xcode build
- ✅ Uploaded to TestFlight
- ✅ Tested on real device
- ✅ Bypassed React Native C++ compilation issues
- ✅ Ready for beta testing or App Store submission

**Congratulations on your deployment!** 🎉

---

**Guide Version:** 1.0  
**Last Updated:** February 3, 2026  
**For App:** DIY Home Repair v1.0.0 (Build 4)  
**Repository:** https://github.com/maxmurad/DIY-AI

---

*If you encounter any issues not covered in this guide, check the troubleshooting section or review error messages carefully. Most issues have solutions in the troubleshooting guide above.*
