# Apple Developer Account Authentication Error

**Error:** Request failed with status code 400  
**Context:** iOS deployment build - Apple credential input  
**Status:** Authentication Issue  
**Date:** February 2, 2026

---

## Problem

When trying to build for iOS deployment and entering Apple Developer account credentials, you receive:
```
Request failed with status code 400
```

This indicates an authentication problem with Apple's servers.

---

## Common Causes & Solutions

### 1. Two-Factor Authentication (2FA) Required ⚠️

**Most Common Issue:** Your Apple ID has 2FA enabled, which requires an app-specific password.

**Solution:**

#### Generate App-Specific Password:

1. **Go to:** https://appleid.apple.com/
2. **Sign in** with your Apple ID
3. Navigate to **"Security"** section
4. Find **"App-Specific Passwords"**
5. Click **"Generate an App-Specific Password"**
6. Label it: "EAS Build" or "DIY Home Repair"
7. **Copy the generated password** (format: xxxx-xxxx-xxxx-xxxx)

#### Use App-Specific Password in EAS:

```bash
eas build --platform ios --profile production

# When prompted:
Apple ID: max_in_nyc@yahoo.com
Password: [paste app-specific password] # Not your regular password!
```

---

### 2. Apple Developer Program Not Enrolled

**Issue:** Account must be enrolled in Apple Developer Program ($99/year)

**Check:**
1. Go to: https://developer.apple.com/account/
2. Sign in
3. Verify you see "Membership" section
4. Status should be "Active"

**If Not Enrolled:**
- Enroll at: https://developer.apple.com/programs/enroll/
- Wait 24-48 hours for approval
- Cost: $99/year

---

### 3. Invalid Credentials Format

**Issue:** Special characters in password causing issues

**Solution:**
- Use app-specific password (no special characters to worry about)
- Or ensure password is properly entered (no extra spaces)

---

### 4. Account Locked or Security Hold

**Issue:** Apple temporarily locked account due to failed login attempts

**Solution:**
1. Visit: https://appleid.apple.com/
2. Try logging in on web first
3. Complete any security challenges
4. Reset password if needed
5. Wait 1 hour if account locked
6. Try EAS build again

---

### 5. Session/Cookie Issues

**Issue:** EAS credentials manager has cached invalid session

**Solution:**

```bash
# Clear credentials
eas credentials

# Select iOS
# Choose "Remove all credentials"

# Then try build again
eas build --platform ios --profile production
```

---

## Step-by-Step Fix (Recommended)

### Step 1: Generate App-Specific Password

1. Visit https://appleid.apple.com/
2. Sign in: max_in_nyc@yahoo.com
3. Security → App-Specific Passwords
4. Generate new password
5. **Save it somewhere safe**

### Step 2: Clear EAS Credentials

```bash
cd frontend
eas credentials

# Select: iOS
# Choose: Remove all credentials
# Confirm: Yes
```

### Step 3: Try Build Again

```bash
eas build --platform ios --profile production --clear-cache

# When prompted:
# Apple ID: max_in_nyc@yahoo.com
# Password: [app-specific password from Step 1]
```

### Step 4: Handle 2FA Code

If prompted for 2FA code:
- Check your trusted device
- Enter the 6-digit code
- EAS will save credentials for future builds

---

## Alternative: Use Existing Credentials

If you've built before and credentials exist:

```bash
# List credentials
eas credentials

# View existing credentials
# Select: iOS
# Choose: View credentials

# Use non-interactive build
eas build --platform ios --profile production --non-interactive
```

---

## Debugging Steps

### Check Apple Developer Portal

```bash
# 1. Can you log in here?
https://developer.apple.com/account/

# 2. Check membership status
# 3. Verify certificates exist
# 4. Check bundle ID availability
```

### Check EAS Project Status

```bash
# View project
eas project:info

# Check builds
eas build:list

# View credentials
eas credentials
```

### Verbose Logging

```bash
# Build with debug output
eas build --platform ios --profile production --no-wait

# Watch logs
eas build:view [BUILD_ID]
```

---

## Common Error Messages

### "Authentication failed"
→ Wrong password or app-specific password needed

### "Account not found"
→ Apple ID doesn't exist or typo in email

### "Developer Program required"
→ Need to enroll in $99/year program

### "Request failed with status code 400"
→ Usually 2FA/app-specific password issue

### "Certificate generation failed"
→ Need proper credentials and program enrollment

---

## Best Practices

### 1. Use App-Specific Passwords
✅ More secure
✅ Don't expire
✅ Can revoke individual passwords
✅ Required for 2FA accounts

### 2. Save Credentials Locally
```bash
# After successful credential setup
eas credentials

# View and verify they're stored
```

### 3. Use Non-Interactive Builds
```bash
# Once credentials are set up
eas build --platform ios --profile production --non-interactive
```

---

## If Still Failing: Local Xcode Build

Skip EAS credentials entirely:

```bash
# 1. Generate iOS project
npx expo prebuild --platform ios --clean

# 2. Open in Xcode
open ios/DIYHomeRepair.xcworkspace

# 3. In Xcode:
# - Preferences → Accounts → Add Apple ID
# - Sign in directly in Xcode
# - Select your team in project settings
# - Build and archive

# No EAS credentials needed!
```

---

## Verification Checklist

Before trying again:

- [ ] Apple Developer account active and paid ($99/year)
- [ ] Can log in to https://appleid.apple.com/
- [ ] Can log in to https://developer.apple.com/account/
- [ ] Generated app-specific password (if 2FA enabled)
- [ ] Cleared EAS credentials: `eas credentials`
- [ ] Using correct email: max_in_nyc@yahoo.com
- [ ] No typos in credentials
- [ ] Internet connection stable

---

## Expected Flow

### Successful Authentication:

```
✔ Apple ID: max_in_nyc@yahoo.com
✔ Password: ****-****-****-****
✔ Two-factor code: 123456
✔ Authenticating with Apple...
✔ Generating distribution certificate...
✔ Creating provisioning profile...
✔ Starting build...
```

### Build Progress:
1. Authentication successful
2. Credentials stored
3. Certificate created
4. Provisioning profile generated
5. Build starts
6. Complete in 15-30 minutes

---

## Summary

**Most Likely Issue:** Need app-specific password for 2FA

**Quick Fix:**
1. Generate app-specific password at appleid.apple.com
2. Clear EAS credentials: `eas credentials`
3. Build again with app-specific password

**Alternative:** Use local Xcode build (bypasses EAS credentials)

---

## Support Resources

**Apple ID Account:** https://appleid.apple.com/  
**Developer Portal:** https://developer.apple.com/account/  
**EAS Documentation:** https://docs.expo.dev/build/introduction/  
**Credentials Guide:** https://docs.expo.dev/app-signing/managed-credentials/

---

**Next Steps:**
1. Generate app-specific password
2. Clear EAS credentials
3. Try build again with app-specific password
4. If still fails, use local Xcode build

The 400 error is almost always authentication-related and can be resolved with proper credentials.
