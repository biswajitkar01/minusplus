@echo off
title MinusPlus Calculator
echo.
echo  =============================================
echo   MinusPlus Calculator - Portable Launcher
echo  =============================================
echo.

:: Find a free port (default 8000, try up to 8010)
set PORT=8000

:: Create a temporary PowerShell script for the HTTP server
set "PS_SCRIPT=%TEMP%\minusplus_server.ps1"

echo $port = %PORT% > "%PS_SCRIPT%"
echo $root = (Split-Path -Parent $MyInvocation.MyCommand.Path) >> "%PS_SCRIPT%"
echo # Use the directory where the batch file is, not temp >> "%PS_SCRIPT%"
echo $root = "%~dp0" >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo $listener = New-Object System.Net.HttpListener >> "%PS_SCRIPT%"
echo $listener.Prefixes.Add("http://localhost:$port/") >> "%PS_SCRIPT%"
echo try { $listener.Start() } catch { >> "%PS_SCRIPT%"
echo     Write-Host "Port $port is busy, trying next..." >> "%PS_SCRIPT%"
echo     $port++ >> "%PS_SCRIPT%"
echo     $listener.Prefixes.Clear() >> "%PS_SCRIPT%"
echo     $listener.Prefixes.Add("http://localhost:$port/") >> "%PS_SCRIPT%"
echo     $listener.Start() >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo Write-Host "" >> "%PS_SCRIPT%"
echo Write-Host "  MinusPlus is running at: http://localhost:$port" -ForegroundColor Green >> "%PS_SCRIPT%"
echo Write-Host "  Press Ctrl+C to stop the server" -ForegroundColor Yellow >> "%PS_SCRIPT%"
echo Write-Host "" >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo # Open browser >> "%PS_SCRIPT%"
echo Start-Process "http://localhost:$port" >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo # Serve files >> "%PS_SCRIPT%"
echo $mimeTypes = @{ >> "%PS_SCRIPT%"
echo     '.html' = 'text/html'; '.css' = 'text/css'; '.js' = 'application/javascript' >> "%PS_SCRIPT%"
echo     '.json' = 'application/json'; '.png' = 'image/png'; '.svg' = 'image/svg+xml' >> "%PS_SCRIPT%"
echo     '.ico' = 'image/x-icon'; '.webmanifest' = 'application/manifest+json' >> "%PS_SCRIPT%"
echo     '.woff2' = 'font/woff2'; '.woff' = 'font/woff'; '.ttf' = 'font/ttf' >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"
echo. >> "%PS_SCRIPT%"
echo while ($listener.IsListening) { >> "%PS_SCRIPT%"
echo     $context = $listener.GetContext() >> "%PS_SCRIPT%"
echo     $path = $context.Request.Url.LocalPath >> "%PS_SCRIPT%"
echo     if ($path -eq '/') { $path = '/index.html' } >> "%PS_SCRIPT%"
echo     $filePath = Join-Path $root $path.TrimStart('/') >> "%PS_SCRIPT%"
echo     if (Test-Path $filePath -PathType Leaf) { >> "%PS_SCRIPT%"
echo         $ext = [System.IO.Path]::GetExtension($filePath) >> "%PS_SCRIPT%"
echo         $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' } >> "%PS_SCRIPT%"
echo         $context.Response.ContentType = $contentType >> "%PS_SCRIPT%"
echo         $bytes = [System.IO.File]::ReadAllBytes($filePath) >> "%PS_SCRIPT%"
echo         $context.Response.OutputStream.Write($bytes, 0, $bytes.Length) >> "%PS_SCRIPT%"
echo     } else { >> "%PS_SCRIPT%"
echo         $context.Response.StatusCode = 404 >> "%PS_SCRIPT%"
echo         $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not Found') >> "%PS_SCRIPT%"
echo         $context.Response.OutputStream.Write($bytes, 0, $bytes.Length) >> "%PS_SCRIPT%"
echo     } >> "%PS_SCRIPT%"
echo     $context.Response.Close() >> "%PS_SCRIPT%"
echo } >> "%PS_SCRIPT%"

echo  Starting MinusPlus on http://localhost:%PORT% ...
echo  (Your browser will open automatically)
echo.
echo  Press Ctrl+C in this window to stop.
echo.

powershell -ExecutionPolicy Bypass -File "%PS_SCRIPT%"
