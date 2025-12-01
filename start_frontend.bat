@echo off
REM 前端服务启动脚本 (Windows)
REM 适用于Channel-frontend项目

echo 启动Channel前端服务...

REM 设置项目根目录
set PROJECT_ROOT=C:\Users\%USERNAME%\Files\ChannelDemo
set FRONTEND_DIR=%PROJECT_ROOT%\Channel-frontend

REM 设置Node.js环境
set NODE_ENV=node
set NPM_ENV=npm

REM 检查Node.js环境是否存在
where %NODE_ENV% >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js环境不存在，请先安装Node.js
    pause
    exit /b 1
)

where %NPM_ENV% >nul 2>&1
if %errorlevel% neq 0 (
    echo npm环境不存在，请先安装npm
    pause
    exit /b 1
)

REM 切换到前端目录
cd /d "%FRONTEND_DIR%" || (
    echo 无法切换到前端目录: %FRONTEND_DIR%
    pause
    exit /b 1
)

REM 检查package.json文件
if not exist "package.json" (
    echo package.json文件不存在
    pause
    exit /b 1
)

REM 检查vite.config.js文件
if not exist "vite.config.js" (
    echo vite.config.js文件不存在
    pause
    exit /b 1
)

echo 环境信息:
echo    Node.js版本: 
%NODE_ENV% --version
echo    npm版本: 
%NPM_ENV% --version
echo    项目目录: %FRONTEND_DIR%
echo    工作目录: %CD%

REM 检查端口是否被占用
set PORT=3000
netstat -an | findstr ":%PORT%" | findstr "LISTENING" >nul
if %errorlevel% == 0 (
    echo 警告: 端口 %PORT% 已被占用
    echo 请手动停止占用端口的进程或修改端口配置
)

echo.
echo 启动开发模式...

echo 检查依赖...
if not exist "node_modules" (
    echo 安装依赖...
    %NPM_ENV% install
)

echo 启动开发服务器...
%NPM_ENV% run dev
