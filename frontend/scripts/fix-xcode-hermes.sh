#!/bin/bash

# Define the target file
TARGET_FILE="./node_modules/react-native/scripts/react-native-xcode.sh"

# Check if the file exists
if [ -f "$TARGET_FILE" ]; then
    echo "Found react-native-xcode.sh, applying Hermes fix..."
    
    # Check if already patched to avoid double patching
    if grep -q "if \[\[ \"1\" == \"2\" \]\]; then # Disabled by DIY App Postinstall" "$TARGET_FILE"; then
        echo "Fix already applied. Skipping."
    else
        # Use sed to replace the line. 
        # macOS sed requires an empty string for -i, Linux sed doesn't. 
        # We'll use a temp file to be safe and cross-platform compatible.
        
        # Pattern to match: if [[ "$USE_HERMES" == true ]]; then
        # Replacement: if [[ "1" == "2" ]]; then # Disabled by DIY App Postinstall
        
        sed "s/if \[\[ \"\$USE_HERMES\" == true \]\]; then/if [[ \"1\" == \"2\" ]]; then # Disabled by DIY App Postinstall/" "$TARGET_FILE" > "$TARGET_FILE.tmp" && mv "$TARGET_FILE.tmp" "$TARGET_FILE"
        
        # Make executable again just in case
        chmod +x "$TARGET_FILE"
        
        echo "Successfully patched react-native-xcode.sh to disable Hermes."
    fi
else
    echo "Warning: react-native-xcode.sh not found at $TARGET_FILE. Skipping fix."
fi
