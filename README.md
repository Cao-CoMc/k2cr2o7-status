# K2Cr2O7 Server Status

K2Cr2O7 Minecraft 服务器状态监控页面，支持多地区节点检测。

## 🚀 GitHub Pages 部署指南

### 1. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称：`k2cr2o7-status`（或你喜欢的名字）
3. 选择 **Public**（公开）
4. 勾选 **Add a README file**
5. 点击 **Create repository**

### 2. 上传文件到仓库

```bash
# 克隆仓库（替换为你的仓库地址）
git clone https://github.com/你的用户名/k2cr2o7-status.git
cd k2cr2o7-status

# 创建必要的目录
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p data

# 复制所有生成的文件到对应位置
# - .github/workflows/deploy.yml
# - scripts/fetch-status.js
# - scripts/build-static.js
# - style.css
# - package.json
# - server-icon.png（如有）

# 提交到 GitHub
git add .
git commit -m "Initial commit: server status monitor"
git push origin main
```

或者直接拖拽上传：
1. 打开 GitHub 仓库页面
2. 点击 **Add file** → **Upload files**
3. 拖拽所有文件到上传区域
4. 点击 **Commit changes**

### 3. 启用 GitHub Pages

1. 进入仓库 **Settings** → **Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存设置

### 4. 配置 GitHub Actions 权限

1. 进入 **Settings** → **Actions** → **General**
2. 找到 **Workflow permissions**
3. 选择 **Read and write permissions**
4. 勾选 **Allow GitHub Actions to create and approve pull requests**
5. 点击 **Save**

### 5. 触发首次部署

1. 进入 **Actions** 标签页
2. 点击 **Deploy to GitHub Pages**
3. 点击 **Run workflow** → **Run workflow**
4. 等待部署完成（约2-3分钟）

### 6. 访问网站

部署完成后，访问：
```
https://你的用户名.github.io/k2cr2o7-status/
```

## 🔄 自动更新机制

GitHub Actions 会自动执行以下操作：

| 触发条件 | 频率 | 操作 |
|---------|------|------|
| `git push` | 每次推送 | 立即重新部署 |
| 定时任务 | 每5分钟 | 自动检测服务器状态并更新 |
| 手动触发 | 随时 | 在 Actions 页面点击 Run workflow |

## 📁 文件结构

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 配置
├── scripts/
│   ├── fetch-status.js         # 获取服务器状态
│   └── build-static.js         # 构建静态页面
├── data/
│   ├── current-status.json     # 当前状态（自动生成）
│   └── status-history.json     # 历史记录（自动生成）
├── dist/                       # 构建输出（自动生成）
├── style.css                   # 样式文件
├── package.json                # 项目配置
└── README.md                   # 本文件
```

## 🛠️ 本地测试

```bash
# 安装依赖
npm install

# 获取服务器状态
npm run fetch

# 构建静态网站
npm run build

# 查看构建结果
cd dist
python -m http.server 8000
# 访问 http://localhost:8000
```

## 🔧 自定义配置

### 修改检测节点

编辑 `scripts/fetch-status.js`：

```javascript
const NODES = [
  { id: "shandong", name: "山东节点", host: "frp-ten.com", port: 57232 },
  { id: "jiangsu", name: "江苏节点", host: "frp-web.com", port: 40319 },
  { id: "hubei", name: "湖北节点", host: "frp-tag.com", port: 19158 }
  // 添加更多节点...
];
```

### 调整更新频率

编辑 `.github/workflows/deploy.yml`：

```yaml
schedule:
  # 每5分钟（CRON格式）
  - cron: '*/5 * * * *'
  # 每15分钟：'*/15 * * * *'
  # 每小时：'0 * * * *'
```

### 修改页面样式

直接编辑 `style.css`，推送后会自动重新部署。

## 🐛 故障排除

### 部署失败

1. 检查 **Actions** 标签页查看错误日志
2. 确保 `package.json` 中的依赖正确
3. 确认仓库已启用 GitHub Pages

### 状态不更新

1. 检查 Actions 是否正常运行
2. 查看 `data/current-status.json` 是否生成
3. 确认服务器地址和端口正确

### 页面显示旧数据

GitHub Pages 有缓存，强制刷新：
- Windows: `Ctrl + F5`
- Mac: `Cmd + Shift + R`

## 📄 许可证

MIT License - 自由使用和修改

---

**K2Cr2O7 Server** © 2026
