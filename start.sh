#!/bin/bash

# 闪卡学习系统启动脚本

echo "正在启动闪卡学习系统..."

# 检查Python3是否可用
if ! command -v python3 &> /dev/null; then
    echo "错误: 未找到Python3"
    echo "请安装Python3后重试"
    exit 1
fi

# 检查必要文件
required_files=("index.html" "style.css" "script.js" "flashcards.csv")
missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "警告: 以下文件缺失:"
    for file in "${missing_files[@]}"; do
        echo "  - $file"
    done
    echo "应用可能无法正常运行。"
    read -p "是否继续? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 启动服务器
echo "启动HTTP服务器..."
python3 server.py

# 如果server.py不存在，使用简单的替代方案
if [ $? -ne 0 ]; then
    echo "使用内置的Python HTTP服务器..."
    echo "访问地址: http://localhost:8080"
    echo "按 Ctrl+C 停止服务器"
    python3 -m http.server 8080
fi