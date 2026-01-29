@echo off
:: YouTube Downloader for Premiere Pro - Simple Installer
:: Version 2.5.1

title YouTube Downloader Installer

echo.
echo ========================================
echo YouTube Downloader for Premiere Pro
echo Installation Package v2.5.1
echo ========================================
echo.

:: Check for administrator privileges
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo.
    echo ERROR: Administrator privileges required!
    echo.
    echo Please right-click on INSTALL.bat and select
    echo "Run as administrator"
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo [OK] Running with administrator privileges
echo.

:: Get current directory
set "SOURCE_DIR=%~dp0"
set "EXTENSION_PATH=%ProgramFiles%\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader"

echo Source directory: %SOURCE_DIR%
echo Target directory: %EXTENSION_PATH%
echo.

:: Check if running from installation directory
if /I "%SOURCE_DIR:~0,-1%"=="%EXTENSION_PATH%" (
    echo.
    echo ========================================
    echo Extension Already Installed
    echo ========================================
    echo.
    echo The extension is already installed.
    echo This installer will only check/install dependencies.
    echo.
    set "SKIP_COPY=1"
) else (
    echo Extension will be installed to:
    echo %EXTENSION_PATH%
    echo.
    set "SKIP_COPY=0"
)

echo.
echo ========================================
echo Step 1/7: Checking Node.js
echo ========================================
echo.

node --version >nul 2>&1
if %errorlevel% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js installed: %%i
) else (
    echo [MISSING] Node.js not found
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installation, run this installer again.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo Step 2/7: Checking Python
echo ========================================
echo.

python --version >nul 2>&1
if %errorlevel% EQU 0 (
    for /f "tokens=*" %%i in ('python --version') do echo [OK] Python installed: %%i
) else (
    echo [MISSING] Python not found
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo IMPORTANT: Check "Add Python to PATH" during installation
    echo After installation, run this installer again.
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo ========================================
echo Step 3/7: Installing yt-dlp with EJS support
echo ========================================
echo.

echo Installing/updating yt-dlp with all dependencies...
python -m pip install --upgrade "yt-dlp[default]" --quiet 2>nul
if %errorlevel% NEQ 0 (
    echo Trying alternative installation method...
    python -m pip install --upgrade yt-dlp yt-dlp-ejs --quiet
)

yt-dlp --version >nul 2>&1
if %errorlevel% EQU 0 (
    for /f "tokens=*" %%i in ('yt-dlp --version') do echo [OK] yt-dlp version: %%i
    echo [OK] yt-dlp-ejs package included for YouTube compatibility
) else (
    echo [WARNING] yt-dlp installation may have failed
)

echo.
echo ========================================
echo Step 4/7: Installing Deno (for YouTube challenges)
echo ========================================
echo.

:: Check if deno is already installed
set "DENO_PATH=%USERPROFILE%\.deno\bin\deno.exe"
if exist "%DENO_PATH%" (
    echo [OK] Deno already installed at: %DENO_PATH%
) else (
    echo Installing Deno...
    powershell -Command "irm https://deno.land/install.ps1 | iex" >nul 2>&1
    if exist "%DENO_PATH%" (
        echo [OK] Deno installed successfully!
    ) else (
        echo [WARNING] Deno installation may have failed
        echo You can install manually from: https://deno.land/
        echo Or configure a custom path in the extension settings.
    )
)

echo.
echo ========================================
echo Step 5/7: Checking ffmpeg
echo ========================================
echo.

ffmpeg -version >nul 2>&1
if %errorlevel% EQU 0 (
    echo [OK] ffmpeg is installed
) else (
    echo [MISSING] ffmpeg not found
    echo.
    echo Please install ffmpeg:
    echo 1. Download from: https://www.gyan.dev/ffmpeg/builds/
    echo 2. Extract the ZIP file
    echo 3. Copy bin folder contents to C:\ffmpeg\bin\
    echo 4. Add C:\ffmpeg\bin to system PATH
    echo.
    echo Or configure a custom path in the extension settings.
    echo.
    echo Press any key to continue anyway...
    pause >nul
)

:: Install extension files if not already installed
if "%SKIP_COPY%"=="0" (
    echo.
    echo ========================================
    echo Installing Extension Files
    echo ========================================
    echo.
    
    :: Check if source files exist
    if not exist "%SOURCE_DIR%client" (
        echo ERROR: Extension files not found!
        echo.
        echo This installer must be run from the extracted ZIP folder.
        echo Make sure you have:
        echo - client folder
        echo - host folder
        echo - CSXS folder
        echo.
        echo Press any key to exit...
        pause >nul
        exit /b 1
    )
    
    :: Create extension directory
    if not exist "%EXTENSION_PATH%" (
        echo Creating extension directory...
        mkdir "%EXTENSION_PATH%"
    )
    
    :: Copy files
    echo Copying extension files...
    xcopy /Y /E /I /Q "%SOURCE_DIR%client" "%EXTENSION_PATH%\client\" >nul
    xcopy /Y /E /I /Q "%SOURCE_DIR%host" "%EXTENSION_PATH%\host\" >nul
    xcopy /Y /E /I /Q "%SOURCE_DIR%CSXS" "%EXTENSION_PATH%\CSXS\" >nul
    
    if exist "%SOURCE_DIR%.debug" copy /Y "%SOURCE_DIR%.debug" "%EXTENSION_PATH%\.debug" >nul
    if exist "%SOURCE_DIR%README.md" copy /Y "%SOURCE_DIR%README.md" "%EXTENSION_PATH%\README.md" >nul
    if exist "%SOURCE_DIR%INSTALLATION_GUIDE.md" copy /Y "%SOURCE_DIR%INSTALLATION_GUIDE.md" "%EXTENSION_PATH%\INSTALLATION_GUIDE.md" >nul
    if exist "%SOURCE_DIR%CHECK_DEPENDENCIES.bat" copy /Y "%SOURCE_DIR%CHECK_DEPENDENCIES.bat" "%EXTENSION_PATH%\CHECK_DEPENDENCIES.bat" >nul
    
    echo [OK] Extension files installed successfully!
)

    echo [OK] Extension files installed successfully!
)

echo.
echo ========================================
echo Step 6/7: Enabling CEP Debug Mode
echo ========================================
echo.

echo Enabling player debug mode (required for extension to load)...
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.12" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.13" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.14" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.15" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1
REG ADD "HKEY_CURRENT_USER\Software\Adobe\CSXS.16" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul 2>&1

echo [OK] Debug mode enabled for CSXS 10-16
echo.
echo ========================================
echo Step 7/7: Auto-Configuration
echo ========================================
echo.

echo Scanning system paths for dependencies...
echo.

set "CONFIG_FILE=%EXTENSION_PATH%\client\js\config.json"

:: Initialize variables
set "NODE_PATH="
set "PYTHON_PATH="
set "YTDLP_PATH="
set "FFMPEG_PATH="
set "DENO_PATH="

:: Find Node.js
for /f "tokens=*" %%i in ('where node 2^>nul') do set "NODE_PATH=%%i" & goto :config_found_node
:config_found_node
if "%NODE_PATH%"=="" ( echo   [MISSING] Node.js ) else ( echo   [FOUND] Node.js: %NODE_PATH% )

:: Find Python
for /f "tokens=*" %%i in ('where python 2^>nul') do set "PYTHON_PATH=%%i" & goto :config_found_python
:config_found_python
if "%PYTHON_PATH%"=="" ( echo   [MISSING] Python ) else ( echo   [FOUND] Python: %PYTHON_PATH% )

:: Find yt-dlp
for /f "tokens=*" %%i in ('where yt-dlp 2^>nul') do set "YTDLP_PATH=%%i" & goto :config_found_ytdlp
:config_found_ytdlp
if "%YTDLP_PATH%"=="" ( echo   [MISSING] yt-dlp ) else ( echo   [FOUND] yt-dlp: %YTDLP_PATH% )

:: Find ffmpeg
for /f "tokens=*" %%i in ('where ffmpeg 2^>nul') do set "FFMPEG_PATH=%%i" & goto :config_found_ffmpeg
:config_found_ffmpeg
if "%FFMPEG_PATH%"=="" ( echo   [MISSING] ffmpeg ) else ( echo   [FOUND] ffmpeg: %FFMPEG_PATH% )

:: Find Deno
for /f "tokens=*" %%i in ('where deno 2^>nul') do set "DENO_PATH=%%i" & goto :config_found_deno
:config_found_deno
if "%DENO_PATH%"=="" (
    if exist "%USERPROFILE%\.deno\bin\deno.exe" (
        set "DENO_PATH=%USERPROFILE%\.deno\bin\deno.exe"
        echo   [FOUND] Deno (User Dir): %DENO_PATH%
    ) else (
        echo   [MISSING] Deno
    )
) else (
    echo   [FOUND] Deno: %DENO_PATH%
)

echo.
echo Generating configuration file...

:: JSON escaping for backslashes
set "NODE_PATH_JSON=%NODE_PATH:\=\\%"
set "PYTHON_PATH_JSON=%PYTHON_PATH:\=\\%"
set "YTDLP_PATH_JSON=%YTDLP_PATH:\=\\%"
set "FFMPEG_PATH_JSON=%FFMPEG_PATH:\=\\%"
set "DENO_PATH_JSON=%DENO_PATH:\=\\%"

:: Write to file
(
    echo {
    echo   "nodePath": "%NODE_PATH_JSON%",
    echo   "pythonPath": "%PYTHON_PATH_JSON%",
    echo   "ytDlpPath": "%YTDLP_PATH_JSON%",
    echo   "ffmpegPath": "%FFMPEG_PATH_JSON%",
    echo   "denoPath": "%DENO_PATH_JSON%"
    echo }
) > "%CONFIG_FILE%"

if exist "%CONFIG_FILE%" (
    echo   [OK] Config file created at: %CONFIG_FILE%
) else (
    echo   [ERROR] Failed to write config file!
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Restart Adobe Premiere Pro
echo 2. Go to Window ^> Extensions ^> YouTube Downloader
echo 3. Start downloading YouTube videos!
echo.
echo For troubleshooting, see README.md
echo.
echo Press any key to exit...
pause >nul
