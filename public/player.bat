@echo off
chcp 65001 >nul 2>&1
title Course Player Launcher
echo.
echo  ╔══════════════════════════════════════╗
echo  ║       COURSE PLAYER LAUNCHER         ║
echo  ╚══════════════════════════════════════╝
echo.

:: Get the directory where this BAT file is located
set "COURSE_DIR=%~dp0"

:: Remove trailing backslash
if "%COURSE_DIR:~-1%"=="\" set "COURSE_DIR=%COURSE_DIR:~0,-1%"

echo  Course folder: %COURSE_DIR%
echo.

:: Try Python first (most common)
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Python detected - starting HTTP server...
    echo.
    echo  Starting server on port 8080...
    echo  Open your browser if it doesn't open automatically.
    echo  Press Ctrl+C to stop the server when done.
    echo.
    
    :: Copy the player HTML to the course directory if not already there
    if not exist "%COURSE_DIR%\standalone-player.html" (
        if exist "%~dp0standalone-player.html" (
            copy /y "%~dp0standalone-player.html" "%COURSE_DIR%\standalone-player.html" >nul
            echo  [INFO] Copied player HTML to course folder.
        )
    )
    
    :: Open browser after a short delay
    start "" "http://localhost:8080/standalone-player.html"
    
    :: Start Python HTTP server in the course directory
    cd /d "%COURSE_DIR%"
    python -m http.server 8080 --bind 127.0.0.1
    goto :end
)

:: Try Python3 (Linux-style naming on Windows)
where python3 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Python3 detected - starting HTTP server...
    echo.
    start "" "http://localhost:8080/standalone-player.html"
    cd /d "%COURSE_DIR%"
    python3 -m http.server 8080 --bind 127.0.0.1
    goto :end
)

:: Try Node.js with npx
where npx >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js/npx detected - starting HTTP server...
    echo.
    start "" "http://localhost:8080/standalone-player.html"
    cd /d "%COURSE_DIR%"
    npx -y serve -l 8080 -s
    goto :end
)

:: Try Node.js directly
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo  [OK] Node.js detected - starting custom server...
    echo.
    
    :: Create a temporary Node.js server script
    set "SERVER_SCRIPT=%TEMP%\course-player-server.js"
    echo const http = require('http'); > "%SERVER_SCRIPT%"
    echo const fs = require('fs'); >> "%SERVER_SCRIPT%"
    echo const path = require('path'); >> "%SERVER_SCRIPT%"
    echo const dir = '%COURSE_DIR%'.replace(/\\/g, '/'); >> "%SERVER_SCRIPT%"
    echo const mimeTypes = {'.html':'text/html','.mp4':'video/mp4','.mkv':'video/x-matroska','.avi':'video/x-msvideo','.webm':'video/webm','.mov':'video/quicktime','.flv':'video/x-flv','.wmv':'video/x-ms-wmv','.m4v':'video/mp4','.mpg':'video/mpeg','.mpeg':'video/mpeg','.css':'text/css','.js':'application/javascript'}; >> "%SERVER_SCRIPT%"
    echo http.createServer((req, res) =^> { >> "%SERVER_SCRIPT%"
    echo   let filePath = path.join(dir, decodeURIComponent(req.url.split('?')[0])); >> "%SERVER_SCRIPT%"
    echo   if (fs.statSync(filePath).isDirectory^(^)) filePath = path.join(filePath, 'standalone-player.html'); >> "%SERVER_SCRIPT%"
    echo   const ext = path.extname(filePath).toLowerCase^(^); >> "%SERVER_SCRIPT%"
    echo   const contentType = mimeTypes[ext] ^|^| 'application/octet-stream'; >> "%SERVER_SCRIPT%"
    echo   const stat = fs.statSync(filePath); >> "%SERVER_SCRIPT%"
    echo   res.writeHead(200, {'Content-Type': contentType, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes'}); >> "%SERVER_SCRIPT%"
    echo   fs.createReadStream(filePath).pipe(res); >> "%SERVER_SCRIPT%"
    echo }).listen(8080, '127.0.0.1', () =^> console.log('Server running at http://localhost:8080/')); >> "%SERVER_SCRIPT%"
    
    start "" "http://localhost:8080/standalone-player.html"
    node "%SERVER_SCRIPT%"
    goto :end
)

:: Fallback: Try to open HTML directly with file:// protocol
echo  [WARN] No Python or Node.js found!
echo.
echo  Falling back to direct file open (limited functionality).
echo  For full features, install Python 3 or Node.js.
echo.
echo  Download Python: https://www.python.org/downloads/
echo  Download Node.js: https://nodejs.org/
echo.

if exist "%COURSE_DIR%\standalone-player.html" (
    start "" "%COURSE_DIR%\standalone-player.html"
) else if exist "%~dp0standalone-player.html" (
    start "" "%~dp0standalone-player.html"
) else (
    echo  [ERROR] standalone-player.html not found!
    echo  Make sure standalone-player.html is in the same folder as this BAT file.
    echo.
)

:end
echo.
pause
