# 🇨🇳 国内访问速度优化指南

## 优化策略

### 1. 资源本地化（推荐）

**原理**：将所有外部 CDN 资源下载到本地，避免跨境访问

**效果**：⭐⭐⭐⭐⭐ 最佳

**实现方式**：
- Chart.js → 本地 `assets/chart.min.js`
- 头像服务 → 双重 fallback

### 2. CDN 替换

**原理**：使用国内可访问的 CDN 或国际 CDN 的国内节点

| 资源 | 原地址 | 优化后 |
|------|--------|--------|
| Chart.js | cdn.jsdelivr.net ❌ | cdnjs.cloudflare.com ✅ |
| 头像 | mc-heads.net ⚠️ | mc-heads.net + cravatar.eu fallback |

**效果**：⭐⭐⭐ 中等

### 3. GitHub Pages 加速

**原理**：GitHub Pages 本身在国内访问较慢，建议：

#### 方案 A：使用 Vercel/Netlify 镜像（推荐）
1. 在 Vercel 导入 GitHub 仓库
2. 自动获得国内访问更快的 CDN
3. 自定义域名指向 Vercel

#### 方案 B：使用 Cloudflare CDN
1. 注册 Cloudflare 账号
2. 添加自定义域名
3. 开启 CDN 加速

#### 方案 C：使用 Gitee Pages（国内）
1. 同步代码到 Gitee
2. 开启 Gitee Pages
3. 获得国内极速访问

**效果**：⭐⭐⭐⭐⭐ 最佳

---

## 快速部署方案

### 方案一：Vercel 部署（推荐）

```bash
# 1. 注册 Vercel 账号（使用 GitHub 登录）
# https://vercel.com

# 2. 导入项目
# - 点击 "Add New Project"
# - 选择你的 GitHub 仓库
# - 框架选择 "Other"
# - 构建命令：npm run build
# - 输出目录：dist

# 3. 环境变量（可选）
# 在 Project Settings → Environment Variables 中添加：
# NODE_VERSION = 20

# 4. 部署
# 每次推送到 main 分支会自动重新部署

# 5. 自定义域名（可选）
# 在 Domain 设置中添加你的域名
```

**优点**：
- 全球 CDN，国内访问快
- 自动 HTTPS
- 与 GitHub 集成好
- 免费额度充足

---

### 方案二：Netlify 部署

```bash
# 1. 注册 Netlify 账号
# https://netlify.com

# 2. 导入项目
# - "Add new site" → "Import an existing project"
# - 选择 GitHub
# - 选择仓库

# 3. 构建设置
# Build command: npm run build
# Publish directory: dist

# 4. 部署
```

---

### 方案三：Gitee Pages（国内最快）

```bash
# 1. 注册 Gitee 账号
# https://gitee.com

# 2. 导入 GitHub 仓库
# - 点击右上角 "+" → "从 GitHub/GitLab 导入仓库"
# - 选择你的仓库

# 3. 开启 Pages
# - 进入仓库 → 服务 → Gitee Pages
# - 选择部署分支：master/main
# - 选择部署目录：dist
# - 点击 "启动"

# 4. 自动更新（重要）
# Gitee Pages 不会自动更新，需要设置 Webhook 或手动刷新
```

**注意**：Gitee Pages 需要实名认证

---

## 资源优化详情

### Chart.js 本地化

构建时会自动下载到 `dist/assets/chart.min.js`

如果下载失败，会自动回退到 CDN

### 头像服务优化

使用双重 fallback：

```javascript
// 第一选择：mc-heads.net（国外，可能慢）
<img src="https://mc-heads.net/avatar/玩家名/32" 
     onerror="this.src='备用地址'">

// 第二选择：cravatar.eu（欧洲，相对稳定）
https://cravatar.eu/helmavatar/玩家名/32.png

// 第三选择：本地默认头像（SVG）
data:image/svg+xml,...
```

---

## 性能对比

| 方案 | 国内访问速度 | 部署难度 | 自动更新 | 推荐度 |
|------|-------------|----------|----------|--------|
| GitHub Pages | ⭐⭐ 慢 | ⭐ 简单 | ✅ | ⭐⭐ |
| GitHub + Cloudflare | ⭐⭐⭐ 中等 | ⭐⭐ 中等 | ✅ | ⭐⭐⭐ |
| Vercel | ⭐⭐⭐⭐ 快 | ⭐ 简单 | ✅ | ⭐⭐⭐⭐⭐ |
| Netlify | ⭐⭐⭐⭐ 快 | ⭐ 简单 | ✅ | ⭐⭐⭐⭐ |
| Gitee Pages | ⭐⭐⭐⭐⭐ 极快 | ⭐⭐ 中等 | ❌ | ⭐⭐⭐⭐ |

---

## 推荐配置

### 最佳实践：Vercel + 本地资源

1. **部署到 Vercel**：获得全球 CDN
2. **启用本地资源**：构建时自动下载 Chart.js
3. **头像 fallback**：确保头像能显示

### 备选方案：Gitee + 手动同步

1. **主仓库**：GitHub（自动更新）
2. **国内镜像**：Gitee（手动同步或 webhook）
3. **访问**：国内用户访问 Gitee 地址

---

## 验证优化效果

使用以下工具测试访问速度：

1. **站长工具**：https://tool.chinaz.com/speedtest/
2. **Ping.cn**：https://www.ping.cn/
3. **17CE**：https://www.17ce.com/

测试不同地区的访问速度，确保优化有效。

---

## 故障排除

### 资源下载失败

如果构建时下载 Chart.js 失败：

```bash
# 手动下载
mkdir -p dist/assets
curl -L -o dist/assets/chart.min.js   https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
```

### 头像不显示

检查浏览器控制台是否有跨域错误，fallback 机制会自动处理。

### Vercel 构建失败

检查构建日志，通常是 Node.js 版本问题，在环境变量中设置：
```
NODE_VERSION=20
```
