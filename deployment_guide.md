# 11Flow 阿里云全栈部署方案 (Alibaba Cloud Deployment Guide)

本方案详细介绍了如何将 11Flow (Frontend: Next.js + Backend: FastAPI) 部署到阿里云 ECS 服务器上。

## 1. 基础设施准备 (Infrastructure)

### 1.1 购买 ECS 实例
*   **地域 (Region)**: 建议选择离你的目标用户最近的节点（如：华东1-杭州，或 阿里云香港/新加坡 以便于访问海外 AI API）。
    *   *注意*: 如果服务器在大陆，必须进行 ICP 备案才能使用域名访问。如果不想备案，**必须选择香港或海外节点**。
*   **实例规格 (Instance Type)**: 
    *   **推荐**: 2核 4G (e.g., ecs.c6.large) 或更高。Next.js 构建和运行需要一定内存。
*   **操作系统 (OS)**: Ubuntu 22.04 LTS (推荐) 或 CentOS 7.9。*本教程基于 Ubuntu 22.04*。
*   **公网带宽**: 按量付费 (推荐用于测试) 或 固定带宽 (3M+)。
*   **安全组 (Security Group)**: 开放以下端口：
    *   `22` (SSH)
    *   `80` (HTTP)
    *   `443` (HTTPS)

### 1.2 域名准备
*   在阿里云万网购买域名。
*   解析域名 (A记录) 到 ECS 的公网 IP。

---

## 2. 服务器环境配置 (Environment Setup)

通过 SSH 登录服务器：`ssh root@<你的公网IP>`

### 2.1 更新系统与安装基础工具
```bash
apt update && apt upgrade -y
apt install -y curl git nginx unzip build-essential
```

### 2.2 安装 Node.js (v20.x)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
# 验证
node -v
npm -v
# 安装 pnpm (可选，如果你本地用 pnpm)
npm install -g pnpm pm2
```

### 2.3 安装 Python (3.12)
Ubuntu 22.04 默认自带 Python 3.10。建议使用 conda 或 venv 管理环境。
这里推荐安装 Miniconda 以便于管理 Python 版本：
```bash
mkdir -p ~/miniconda3
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O ~/miniconda3/miniconda.sh
bash ~/miniconda3/miniconda.sh -b -u -p ~/miniconda3
rm -rf ~/miniconda3/miniconda.sh
source ~/miniconda3/bin/activate
conda init bash
source ~/.bashrc
```
创建环境：
```bash
conda create -n 11flow python=3.12 -y
conda activate 11flow
```

---

## 3. 代码部署 (Code Deployment)

### 3. 代码部署 (详细步骤)

将代码从你的本地电脑部署到阿里云服务器，推荐使用 **Git**。

#### 3.1 准备 Git 仓库 (在你的本地电脑)
1. 确保你的代码已经上传到 GitHub、GitLab 或 Gitee。
2. 如果还没有，请创建一个私有仓库并上传代码：
   ```bash
   # 在本地项目根目录
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <你的仓库地址, 例如 git@github.com:we6site-del/1adn1flow.git>
   git push -u origin main
   ```

#### 3.1.2 选项 B: 使用 GitHub Desktop (图形界面)
如果不熟悉命令，可以使用 GitHub Desktop：
1.  打开 GitHub Desktop，点击 **"File"** -> **"Add Local Repository"**。
2.  选择你的项目文件夹 (`/Users/joeweng/11flow`)。
3.  如果提示 "This directory does not appear to be a Git repository"，点击蓝色链接 **"create a repository"**。
4.  在左侧 "Summary" 输入框填写 "Initial commit"，点击 **"Commit to main"**。
5.  点击顶部工具栏的 **"Publish repository"**。
    *   **Name**: 保持 `11flow`。
    *   **Keep this code private**: 勾选则为私有 (推荐)，取消则公开。
    *   点击 **"Publish repository"**。
6.  上传完成后，你的代码就在 GitHub 上了。

#### 3.2 配置服务器访问权限 (在阿里云服务器)
为了让服务器能下载你的私有仓库代码，需要配置 SSH Key。

1. **生成 SSH Key**:
   ```bash
   ssh-keygen -t ed25519 -C "server_deploy_key"
   # 一路回车即可
   ```
2. **查看并复制公钥**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
   复制输出的内容 (以 `ssh-ed25519` 开头的长字符串)。

3. **添加到 GitHub/GitLab**:
   - **GitHub**:用于仓库 -> Settings -> Deploy keys -> Add deploy key (勾选 Allow write access 如果需要写权限，通常拉取只需读权限)。
   - 或者添加到个人 Settings -> SSH and GPG keys (这样能访问你所有仓库)。

#### 3.3 克隆代码到服务器
1. **创建部署目录**:
   建议放在 `/var/www` 下。
   ```bash
   sudo mkdir -p /var/www/11flow
   # 将目录所有权改为当前用户 (例如 root 或 ubuntu)，避免每次都要 sudo
   sudo chown -R $USER:$USER /var/www/11flow
   ```

2. **克隆仓库**:
   ```bash
   cd /var/www/11flow
   # 注意：此时目录应为空，或者你可以克隆到当前目录下
   # 如果目录已存在且为空：
   git clone <你的仓库SSH地址> .
   
   # 例如:
   # git clone git@github.com:username/11flow.git .
   ```
   *如果提示 `Are you sure you want to continue connecting?`，输入 `yes`。*

3. **验证文件**:
   ```bash
   ls -la
   # 你应该能看到 backend, frontend, deployment_guide.md 等文件
   ```

#### 3.4 后续代码更新
当你本地修改了代码并 `git push` 后，在服务器上更新只需：
```bash
cd /var/www/11flow
git pull origin main
```
更新后，通常需要重启服务 (见第 8 节)。

---

## 4. 后端部署 (Backend: FastAPI)

### 4.1 安装依赖
```bash
cd /var/www/11flow/backend
conda activate 11flow
pip install -r requirements.txt
```

### 4.2 环境变量 (.env)
创建 `.env` 文件：
```bash
cp .env.example .env
nano .env
```
**关键配置修改**:
*   `SUPABASE_URL`: 你的 Supabase URL (生产环境建议继续使用 Supabase Cloud，或自行部署 Docker 版)。
*   `SUPABASE_KEY`: 生产环境 Service Role Key。
*   `OPENAI_API_KEY` / `GEMINI_API_KEY`: 你的 API Keys。

### 4.3 使用 PM2 启动后端
我们使用 PM2 来守护进程，确保后台运行。
```bash
# 在项目根目录 /var/www/11flow 下
pm2 start "conda run -n 11flow uvicorn backend.main:app --host 0.0.0.0 --port 8000" --name "backend"
```
或者编写一个 `ecosystem.config.js` (推荐)。

---

## 5. 前端部署 (Frontend: Next.js)

### 5.1 安装依赖
```bash
cd /var/www/11flow/frontend
npm install --legacy-peer-deps
```

### 5.2 环境变量 (.env.local)
```bash
cp .env.example .env.local
nano .env.local
```
**关键配置修改**:
*   `NEXT_PUBLIC_API_URL`: `https://你的域名/api` (注意这里通过 Nginx 转发，稍后配置)。
*   `NEXT_PUBLIC_SUPABASE_URL`: 同后端。
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key。

### 5.3 构建项目
```bash
npm run build
```

### 5.4 使用 PM2 启动前端
```bash
pm2 start "npm start" --name "frontend"
```
此时前端运行在 3000 端口，后端运行在 8000 端口。

---

## 6. Nginx 反向代理配置 (Reverse Proxy)

将域名请求转发到内部的 3000 和 8000 端口。

### 6.1 配置 Nginx
编辑配置文件：
```bash
nano /etc/nginx/sites-available/11flow
```
写入以下内容（替换 `your-domain.com`）：

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 强制跳转 HTTPS (稍后配置 SSL 后生效，目前先注释)
    # return 301 https://$host$request_uri;

    # 前端 (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API (FastAPI)
    # 将 /api 开头的请求转发到 8000 端口
    # 注意：如果后端路由以此开头，保持原样；如果后端没有 /api 前缀，需要 rewrite。
    # 假设后端路由包含 /api 前缀 (e.g., /api/chat/completions)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade"; # 支持 WebSocket
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：
```bash
ln -s /etc/nginx/sites-available/11flow /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default  # 移除默认配置
nginx -t  # 测试配置
systemctl restart nginx
```

---

## 7. 配置 HTTPS (SSL 证书)

使用 Certbot 免费申请 Let's Encrypt 证书。

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com -d www.your-domain.com
```
按照提示操作，选择 `2` (Redirect) 以强制 HTTPS。

---

## 8. 日常维护常用命令

*   **查看服务状态**: `pm2 status`
*   **查看日志**: `pm2 logs`
*   **重启服务**: `pm2 restart all`
*   **代码更新**:
    1.  `git pull`
    2.  后端: `pm2 restart backend`
    3.  前端: `cd frontend && npm install --legacy-peer-deps && npm run build && pm2 restart frontend`

## 9. 常见问题排查

1.  **502 Bad Gateway**: 通常是后端或前端服务没启动。检查 `pm2 status` 和 `pm2 logs`。
2.  **Websocket 连接失败**: 检查 Nginx 配置中的 `Upgrade` 和 `Connection` 头部是否正确设置。
3.  **API 404**: 检查 Nginx 的 `/api/` 转发路径末尾斜杠。建议 `location /api/` 对应 `proxy_pass http://localhost:8000/api/` 或保持后端路由结构一致。

---
**部署完成！**
