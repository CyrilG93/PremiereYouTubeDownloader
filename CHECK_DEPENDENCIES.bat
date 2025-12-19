@echo off
:: Dependency Checker for YouTube Downloader Extension
:: Run this to verify all dependencies are installed correctly

echo ========================================
echo YouTube Downloader - Dependency Checker
echo ========================================
echo.

set "ALL_OK=1"

:: Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo   [OK] Node.js: %%i
) else (
    echo   [MISSING] Node.js not found
    echo   Download from: https://nodejs.org/
    set "ALL_OK=0"
)
echo.

:: Check Python
echo [2/4] Checking Python...
python --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version') do echo   [OK] Python: %%i
) else (
    echo   [MISSING] Python not found
    echo   Download from: https://www.python.org/downloads/
    set "ALL_OK=0"
)
echo.

:: Check yt-dlp
echo [3/4] Checking yt-dlp...
yt-dlp --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('yt-dlp --version') do echo   [OK] yt-dlp: %%i
) else (
    echo   [MISSING] yt-dlp not found
    echo   Install with: pip install yt-dlp
    set "ALL_OK=0"
)
echo.

:: Check ffmpeg
echo [4/4] Checking ffmpeg...
ffmpeg -version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=3" %%i in ('ffmpeg -version ^| findstr "ffmpeg version"') do echo   [OK] ffmpeg: %%i
) else (
    echo   [MISSING] ffmpeg not found
    echo   Download from: https://ffmpeg.org/download.html
    set "ALL_OK=0"
)
echo.

:: Check extension installation
echo [BONUS] Checking extension installation...
if exist "%ProgramFiles%\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader" (
    echo   [OK] Extension installed at correct location
) else (
    echo   [WARNING] Extension not found in standard location
    echo   Expected: %ProgramFiles%\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader
)
echo.

echo ========================================
if "%ALL_OK%"=="1" (
    echo Result: ALL DEPENDENCIES INSTALLED! ✓
    echo.
    echo You're ready to use YouTube Downloader!
    echo Open Premiere Pro and go to Window ^> Extensions ^> YouTube Downloader
) else (
    echo Result: MISSING DEPENDENCIES ✗
    echo.
    echo Please install the missing dependencies listed above
    echo Then run this checker again to verify
)
echo ========================================
echo.

pause
