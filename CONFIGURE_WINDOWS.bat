@echo off
:: Auto-Configuration Tool for YouTube Downloader Extension - Windows
:: Scans for dependencies and creates a config.json file for the extension

echo ========================================
echo YouTube Downloader - Auto-Configurator
echo ========================================
echo.

:: Define paths
set "SCRIPT_DIR=%~dp0"
set "EXTENSION_PATH=%ProgramFiles%\Common Files\Adobe\CEP\extensions\PremiereYouTubeDownloader"
set "LOCAL_CONFIG=%SCRIPT_DIR%client\js\config.json"

:: Check if extension is installed in system folder
if exist "%EXTENSION_PATH%\client\js" (
    set "CONFIG_FILE=%EXTENSION_PATH%\client\js\config.json"
    echo Targeting installed extension at: %EXTENSION_PATH%
) else (
    set "CONFIG_FILE=%LOCAL_CONFIG%"
    echo Targeting local directory (Extension not found in system path)
)

echo Output file: %CONFIG_FILE%
echo.

echo Scanning system for dependencies...
echo.

:: Initialize variables
set "NODE_PATH="
set "PYTHON_PATH="
set "YTDLP_PATH="
set "FFMPEG_PATH="
set "DENO_PATH="

:: Find Node.js
for /f "tokens=*" %%i in ('where node 2^>nul') do set "NODE_PATH=%%i" & goto :found_node
:found_node
if "%NODE_PATH%"=="" (
    echo   [MISSING] Node.js
) else (
    echo   [FOUND] Node.js: %NODE_PATH%
)

:: Find Python
for /f "tokens=*" %%i in ('where python 2^>nul') do set "PYTHON_PATH=%%i" & goto :found_python
:found_python
if "%PYTHON_PATH%"=="" (
    echo   [MISSING] Python
) else (
    echo   [FOUND] Python: %PYTHON_PATH%
)

:: Find yt-dlp
for /f "tokens=*" %%i in ('where yt-dlp 2^>nul') do set "YTDLP_PATH=%%i" & goto :found_ytdlp
:found_ytdlp
if "%YTDLP_PATH%"=="" (
    echo   [MISSING] yt-dlp
) else (
    echo   [FOUND] yt-dlp: %YTDLP_PATH%
)

:: Find ffmpeg
for /f "tokens=*" %%i in ('where ffmpeg 2^>nul') do set "FFMPEG_PATH=%%i" & goto :found_ffmpeg
:found_ffmpeg
if "%FFMPEG_PATH%"=="" (
    echo   [MISSING] ffmpeg
) else (
    echo   [FOUND] ffmpeg: %FFMPEG_PATH%
)

:: Find Deno
for /f "tokens=*" %%i in ('where deno 2^>nul') do set "DENO_PATH=%%i" & goto :found_deno
:found_deno
if "%DENO_PATH%"=="" (
    :: Fallback Check for Deno in specific user directory if not in PATH
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
    echo   [OK] Config file created at:
    echo        %CONFIG_FILE%
    echo.
    echo File content:
    type "%CONFIG_FILE%"
    echo.
    echo Success! The extension will now use these paths automatically.
) else (
    echo   [ERROR] Failed to write config file!
)

echo.
echo ========================================
pause
