const fs = require('fs');
const path = require('path');

// Android
const manifestPath = path.join(__dirname, 'android/app/src/main/AndroidManifest.xml');
let manifest = fs.readFileSync(manifestPath, 'utf8');
if (!manifest.includes('WRITE_EXTERNAL_STORAGE')) {
  manifest = manifest.replace(
    '<manifest',
    `<manifest\n    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\n    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />\n    <manifest`
  );
  fs.writeFileSync(manifestPath, manifest);
}

// iOS
const plistPath = path.join(__dirname, 'ios/App/App/Info.plist');
let plist = fs.readFileSync(plistPath, 'utf8');
if (!plist.includes('NSPhotoLibraryUsageDescription')) {
  plist = plist.replace(
    '</dict>',
    `  <key>NSPhotoLibraryUsageDescription</key>\n  <string>We need access to your photo library to save or read files.</string>\n  <key>NSPhotoLibraryAddUsageDescription</key>\n  <string>We need access to save files to your photo library.</string>\n</dict>`
  );
  fs.writeFileSync(plistPath, plist);
}

console.log('Permissions added!');