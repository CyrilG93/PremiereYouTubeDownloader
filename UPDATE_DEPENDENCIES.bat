@echo off
:: YouTube Downloader for Premiere Pro - Dependency Updater (Windows)
:: Forces update of all dependencies to latest versions

title YouTube Downloader - Dependency Updater

echo.
echo ========================================
echo YouTube Downloader - Dependency Updater
echo ========================================
echo.

set "UPDATES_DONE=0"

:: 1. Update yt-dlp
echo [1/3] Updating yt-dlp...
set "PYTDL_OLD_VERSION="
yt-dlp --version >nul 2>&1
if %errorlevel% EQU 0 (
    for /f "tokens=*" %%i in ('yt-dlp --version') do set "PYTDL_OLD_VERSION=%%i"
    echo   Current version: %PYTDL_OLD_VERSION%
    echo   Upgrading...
    python -m pip install --upgrade "yt-dlp[default]" 2>&1
    if %errorlevel% NEQ 0 (
        python -m pip install --upgrade yt-dlp yt-dlp-ejs 2>&1
    )
    set "PYTDL_NEW_VERSION="
    for /f "tokens=*" %%i in ('yt-dlp --version') do set "PYTDL_NEW_VERSION=%%i"
    if not "%PYTDL_OLD_VERSION%"=="%PYTDL_NEW_VERSION%" (
        echo   [UPDATED] %PYTDL_OLD_VERSION% -^> %PYTDL_NEW_VERSION%
        set /a UPDATES_DONE+=1
    ) else (
        echo   [OK] Already up to date: %PYTDL_NEW_VERSION%
    )
) else (
    echo   [MISSING] yt-dlp not found. Run INSTALL_WINDOWS.bat first.
)
echo.

:: 2. Update Deno
echo [2/3] Updating Deno...
set "DENO_PATH=%USERPROFILE%\.deno\bin\deno.exe"
set "DENO_OLD_VERSION="
if exist "%DENO_PATH%" (
    for /f "tokens=2" %%i in ('"%DENO_PATH%" --version 2^>nul ^| findstr "deno"') do set "DENO_OLD_VERSION=%%i"
    echo   Current version: %DENO_OLD_VERSION%
    echo   Upgrading...
    "%DENO_PATH%" upgrade 2>&1
    set "DENO_NEW_VERSION="
    for /f "tokens=2" %%i in ('"%DENO_PATH%" --version 2^>nul ^| findstr "deno"') do set "DENO_NEW_VERSION=%%i"
    if not "%DENO_OLD_VERSION%"=="%DENO_NEW_VERSION%" (
        echo   [UPDATED] %DENO_OLD_VERSION% -^> %DENO_NEW_VERSION%
        set /a UPDATES_DONE+=1
    ) else (
        echo   [OK] Already up to date: %DENO_NEW_VERSION%
    )
) else (
    deno --version >nul 2>&1
    if %errorlevel% EQU 0 (
        for /f "tokens=2" %%i in ('deno --version 2^>nul ^| findstr "deno"') do set "DENO_OLD_VERSION=%%i"
        echo   Current version: %DENO_OLD_VERSION%
        echo   Upgrading...
        deno upgrade 2>&1
        for /f "tokens=2" %%i in ('deno --version 2^>nul ^| findstr "deno"') do set "DENO_NEW_VERSION=%%i"
        if not "%DENO_OLD_VERSION%"=="%DENO_NEW_VERSION%" (
            echo   [UPDATED] %DENO_OLD_VERSION% -^> %DENO_NEW_VERSION%
            set /a UPDATES_DONE+=1
        ) else (
            echo   [OK] Already up to date: %DENO_NEW_VERSION%
        )
    ) else (
        echo   [MISSING] Deno not found. Run INSTALL_WINDOWS.bat first.
    )
)
echo.

:: 3. Update ffmpeg
echo [3/3] Checking ffmpeg...
ffmpeg -version >nul 2>&1
if %errorlevel% EQU 0 (
    for /f "tokens=3" %%i in ('ffmpeg -version ^| findstr "ffmpeg version"') do echo   Current version: %%i
    echo   [INFO] ffmpeg must be updated manually on Windows.
    echo   Download latest from: https://www.gyan.dev/ffmpeg/builds/
) else (
    echo   [MISSING] ffmpeg not found. Run INSTALL_WINDOWS.bat first.
)
echo.

:: Summary
echo ========================================
if %UPDATES_DONE% GTR 0 (
    echo Done! %UPDATES_DONE% dependency(ies) updated.
) else (
    echo Done! All dependencies are already up to date.
)
echo ========================================
echo.

echo Press any key to exit...
pause >nul
