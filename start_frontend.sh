#!/bin/bash

# 前端服务启动脚本 (Linux/macOS)
# 适用于Channel-frontend项目

echo "启动Channel前端服务..."

# 设置项目根目录
PROJECT_ROOT="/home/xyj/Files/ChannelDemo"
FRONTEND_DIR="$PROJECT_ROOT/Channel-frontend"

# 设置Node.js环境
NODE_ENV="node"
NPM_ENV="npm"

# 检查Node.js环境是否存在
if ! command -v $NODE_ENV &> /dev/null; then
    echo "Node.js环境不存在，请先安装Node.js"
    exit 1
fi

if ! command -v $NPM_ENV &> /dev/null; then
    echo "npm环境不存在，请先安装npm"
    exit 1
fi

# 切换到前端目录
cd "$FRONTEND_DIR" || {
    echo "无法切换到前端目录: $FRONTEND_DIR"
    exit 1
}

# 检查package.json文件
if [ ! -f "package.json" ]; then
    echo "package.json文件不存在"
    exit 1
fi

# 检查vite.config.js文件
if [ ! -f "vite.config.js" ]; then
    echo "vite.config.js文件不存在"
    exit 1
fi

echo "环境信息:"
echo "   Node.js版本: $($NODE_ENV --version)"
echo "   npm版本: $($NPM_ENV --version)"
echo "   项目目录: $FRONTEND_DIR"
echo "   工作目录: $(pwd)"

# 检查端口是否被占用
PORT=3000
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "警告: 端口 $PORT 已被占用，正在尝试停止现有服务..."
    # 尝试停止占用端口的进程
    PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        echo "已停止占用端口的进程 (PID: $PID)"
        sleep 2
    fi
fi

echo ""
echo "启动开发模式..."

echo "检查依赖..."
if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    $NPM_ENV install
fi

echo "启动开发服务器..."
$NPM_ENV run dev
