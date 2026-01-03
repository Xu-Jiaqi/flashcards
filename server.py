#!/usr/bin/env python3
"""
简单HTTP服务器，用于在本地测试闪卡学习系统
"""

import http.server
import socketserver
import os
import sys
import webbrowser
from datetime import datetime

# 服务器配置
PORT = 8080
HOST = 'localhost'
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {self.address_string()} - {format % args}")

    def end_headers(self):
        """添加CORS头，便于开发"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    """启动HTTP服务器"""
    os.chdir(DIRECTORY)

    print("=" * 60)
    print("闪卡学习系统 - 本地HTTP服务器")
    print("=" * 60)
    print(f"目录: {DIRECTORY}")
    print(f"URL: http://{HOST}:{PORT}")
    print("=" * 60)
    print("文件列表:")

    # 显示重要文件
    for file in ['index.html', 'style.css', 'script.js', 'flashcards.csv', 'README.md']:
        if os.path.exists(os.path.join(DIRECTORY, file)):
            size = os.path.getsize(os.path.join(DIRECTORY, file))
            print(f"  ✓ {file} ({size:,} bytes)")
        else:
            print(f"  ✗ {file} (未找到)")

    print("=" * 60)

    try:
        # 尝试在浏览器中打开
        webbrowser.open(f'http://{HOST}:{PORT}')
        print("正在浏览器中打开页面...")
    except:
        print("无法自动打开浏览器，请手动访问上面的URL")

    print("按 Ctrl+C 停止服务器")
    print("=" * 60)

    try:
        with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        if e.errno == 98:  # 端口被占用
            print(f"错误: 端口 {PORT} 已被占用")
            print("请尝试:")
            print(f"  1. 使用其他端口: python {sys.argv[0]} <端口号>")
            print(f"  2. 停止占用端口 {PORT} 的进程")
            print(f"  3. 等待几分钟后重试")
        else:
            print(f"错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    # 检查是否指定了自定义端口
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
            if not (1 <= PORT <= 65535):
                raise ValueError
        except ValueError:
            print(f"错误: 端口号必须是1-65535之间的整数")
            print(f"用法: python {sys.argv[0]} [端口号]")
            sys.exit(1)

    main()