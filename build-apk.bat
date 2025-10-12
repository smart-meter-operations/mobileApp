@echo off
echo ====================================
echo WATTLY APK Build Script
echo ====================================
echo.

echo Checking if EAS CLI is installed...
npx eas-cli --version
if %errorlevel% neq 0 (
    echo Installing EAS CLI...
    npm install -g eas-cli
)

echo.
echo ====================================
echo Building APK for Android...
echo ====================================
echo.

echo Choose build type:
echo 1. Preview APK (for testing)
echo 2. Production APK (for release)
echo.
set /p choice="Enter your choice (1 or 2): "

if "%choice%"=="1" (
    echo Building Preview APK...
    npx eas-cli build --platform android --profile preview
) else if "%choice%"=="2" (
    echo Building Production APK...
    npx eas-cli build --platform android --profile production
) else (
    echo Invalid choice. Building Preview APK by default...
    npx eas-cli build --platform android --profile preview
)

echo.
echo ====================================
echo Build process completed!
echo ====================================
echo.
echo Your APK will be available at:
echo https://expo.dev/accounts/[your-username]/projects/wattly/builds
echo.
pause
