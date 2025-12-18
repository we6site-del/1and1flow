# 修复 Nginx Host 头部问题

## 问题诊断

从日志中看到：
```
origin: 'https://0.0.0.0:3000'
```

这说明 Nginx 没有正确传递 `Host` 头部给 Next.js。

## 解决方案

需要更新 Nginx 配置文件，确保正确传递所有必要的头部。

### 在服务器上执行：

```bash
# 1. 编辑 Nginx 配置
nano /etc/nginx/sites-available/11flow
```

### 找到 `location /` 块，确保包含以下配置：

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    
    # 关键：正确传递 Host 头部
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
    
    # WebSocket 支持
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_cache_bypass $http_upgrade;
    
    # 增加缓冲区大小（用于认证回调）
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;
}
```

### 保存后执行：

```bash
# 2. 测试 Nginx 配置
nginx -t

# 3. 如果测试通过，重新加载 Nginx
systemctl reload nginx

# 4. 重启前端服务
pm2 restart frontend

# 5. 查看日志
pm2 logs frontend --lines 20
```

### 验证修复

日志应该显示：
```
origin: 'https://lunyee.cn'  ← 正确！
```

而不是 `https://0.0.0.0:3000`
