# Logo Setup Instructions

## Your Logo File

Place your `logo.png` file in this directory: `assets/images/logo.png`

## Logo Requirements

### For Best Results:
- **Size:** 1024x1024 pixels (recommended)
- **Format:** PNG with transparency
- **Aspect Ratio:** 1:1 (square)
- **File Name:** `logo.png` (exactly)

### What it's used for:
- ✅ App icon on home screen
- ✅ Splash screen when app launches
- ✅ Adaptive icon on Android
- ✅ Web favicon

## If You Don't Have a Logo Yet

### Option 1: Create One Online (Free)
- **Canva:** https://www.canva.com/create/logos/
- **Hatchful:** https://www.shopify.com/tools/logo-maker
- **LogoMakr:** https://logomakr.com/

### Option 2: Use a Simple Design
Use a letter 'A' (for Attendance) with a nice background color.

### Option 3: Temporary Placeholder
I've created instructions for a simple placeholder. You can replace it later.

## How to Add Your Logo

1. Create or download your logo (1024x1024px PNG)
2. Save it as `logo.png`
3. Place it in: `C:\Users\admin\Desktop\SAMS\assets\images\logo.png`
4. Restart the app: `npm start`

## Current Configuration

The app is configured to use: `./assets/images/logo.png`

- **App Icon:** Your logo will appear on the home screen
- **Splash Screen:** Shows logo on app launch with blue background (#4A90E2)
- **Android Adaptive Icon:** Uses logo with blue background

## Testing Your Logo

After adding the logo:
```bash
npm start
```

Then open in Expo Go on your Android phone to see the logo!

---

**Note:** If you don't add a logo.png file, Expo will show a warning but the app will still work with a default icon.
