@echo off
chcp 65001 >nul
title 청춘 퀴즈팡 (QuizPang) - 실시간 퀴즈 서버
echo ========================================================
echo   🎉 청춘 퀴즈팡(QuizPang) 실시간 퀴즈 플랫폼 시작 중...
echo ========================================================
echo.

set AGY_NODE="%APPDATA%\Antigravity\bin\agy-node.cmd"

if exist %AGY_NODE% (
    start http://localhost:3000
    call %AGY_NODE% server.js
) else (
    where node >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        start http://localhost:3000
        node server.js
    ) else (
        echo [오류] Node.js 실행 환경을 찾을 수 없습니다.
        pause
    )
)
