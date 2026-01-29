@echo off
:: Dependency Checker for YouTube Downloader Extension
:: Run this to verify all dependencies are installed correctly

echo ========================================
echo YouTube Downloader - Dependency Checker
echo ========================================
echo.

set "ALL_OK=1"

:: Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do echo   [OK] Node.js: %%i
    for /f "tokens=*" %%i in ('where node') do echo        Path: %%i
) else (
    echo   [MISSING] Node.js not found
    echo   Download from: https://nodejs.org/
    set "ALL_OK=0"
)
echo.

:: Check Python
echo [2/5] Checking Python...
python --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('python --version') do echo   [OK] Python: %%i
    for /f "tokens=*" %%i in ('where python') do echo        Path: %%i
) else (
    echo   [MISSING] Python not found
    echo   Download from: https://www.python.org/downloads/
    set "ALL_OK=0"
)
echo.

:: Check yt-dlp
echo [3/5] Checking yt-dlp...
yt-dlp --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=*" %%i in ('yt-dlp --version') do echo   [OK] yt-dlp: %%i
    for /f "tokens=*" %%i in ('where yt-dlp') do echo        Path: %%i
) else (
    echo   [MISSING] yt-dlp not found
    echo   Install with: pip install yt-dlp
    set "ALL_OK=0"
)
echo.

:: Check ffmpeg
echo [4/5] Checking ffmpeg...
ffmpeg -version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=3" %%i in ('ffmpeg -version ^| findstr "ffmpeg version"') do echo   [OK] ffmpeg: %%i
    for /f "tokens=*" %%i in ('where ffmpeg') do echo        Path: %%i
) else (
    echo   [MISSING] ffmpeg not found
    echo   Download from: https://ffmpeg.org/download.html
    set "ALL_OK=0"
)
echo.

:: Check Deno
echo [5/5] Checking Deno...
deno --version >nul 2>&1
if %errorLevel% equ 0 (
    for /f "tokens=2" %%i in ('deno --version ^| findstr "deno"') do echo   [OK] Deno: %%i
    for /f "tokens=*" %%i in ('where deno') do echo        Path: %%i
) else (
    echo   [MISSING] Deno not found
    echo   Run: powershell -c "irm https://deno.land/install.ps1 | iex"
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

:: Check CEP Debug Mode
echo [BONUS] Checking CEP Debug Mode...
reg query "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode >nul 2>&1
if %errorLevel% equ 0 (
    echo   [OK] Debug mode enabled
) else (
    echo   [MISSING] Debug mode NOT enabled!
    echo   The extension will NOT load without this.
    echo   Run INSTALL_WINDOWS.bat as administrator to fix this.
    set "ALL_OK=0"
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
