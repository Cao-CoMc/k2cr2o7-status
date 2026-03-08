# 🚀 K2Cr2O7 服务器状态页面 - 一键部署指南

## 方式一：网页上传（推荐新手）

### 步骤 1：创建 GitHub 仓库
1. 打开 https://github.com/new
2. 填写信息：
   - **Repository name**: `k2cr2o7-status`（或任意名称）
   - **Description**: K2Cr2O7 Minecraft 服务器状态监控
   - **Visibility**: ✅ Public
   - ✅ Add a README file
3. 点击 **Create repository**

### 步骤 2：上传文件
1. 在新仓库页面，点击 **Add file** → **Upload files**
2. 解压 `k2cr2o7-github-complete.zip`
3. 拖拽所有文件到 GitHub 上传区域：
   - `.github/` 文件夹
   - `scripts/` 文件夹
   - `style.css`
   - `package.json`
   - `.gitignore`
   - `README.md`
4. 点击 **Commit changes**

### 步骤 3：启用 GitHub Pages
1. 点击 **Settings** 标签
2. 左侧菜单点击 **Pages**
3. **Source** 选择 **GitHub Actions**
4. 点击 **Save**

### 步骤 4：运行部署
1. 点击 **Actions** 标签
2. 点击 **Deploy to GitHub Pages**
3. 点击右侧 **Run workflow** → **Run workflow**
4. 等待 ✅ 绿色勾出现（约2-3分钟）

### 步骤 5：访问网站
- 地址：`https://你的用户名.github.io/k2cr2o7-status/`
- 例如：`https://sankuchuari.github.io/k2cr2o7-status/`

---

## 方式二：命令行部署（推荐开发者）

```bash
# 1. 克隆仓库（替换用户名）
git clone https://github.com/你的用户名/k2cr2o7-status.git
cd k2cr2o7-status

# 2. 解压文件到当前目录
unzip ~/Downloads/k2cr2o7-github-complete.zip

# 3. 提交到 GitHub
git add .
git commit -m "Initial deployment"
git push origin main

# 4. 后续更新只需
 git pull  # 拉取自动生成的数据
git push   # 触发重新部署
```

---

## ⚙️ 配置说明

### 修改服务器节点

编辑 `scripts/fetch-status.js`：

```javascript
const NODES = [
  { id: "shandong", name: "山东节点", host: "frp-ten.com", port: 57232 },
  { id: "jiangsu", name: "江苏节点", host: "frp-web.com", port: 40319 },
  { id: "hubei", name: "湖北节点", host: "frp-tag.com", port: 19158 }
];
```

### 调整更新频率

编辑 `.github/workflows/deploy.yml`：

```yaml
schedule:
  # 每5分钟
  - cron: '*/5 * * * *'
  # 每15分钟：'*/15 * * * *'
  # 每小时：'0 * * * *'
```

### 本地测试

```bash
# 安装依赖
npm install

# 获取状态并构建
npm run deploy

# 查看结果
cd dist && python -m http.server 8000
# 打开 http://localhost:8000
```

---

## 🔍 故障排除

| 问题 | 解决方案 |
|------|----------|
| Actions 显示 ❌ 失败 | 点击失败记录查看日志，通常是网络问题 |
| 页面显示旧数据 | 强制刷新 `Ctrl+F5` 或等待5分钟 |
| 节点一直显示离线 | 检查服务器地址和端口是否正确 |
| 历史记录丢失 | 正常，GitHub Actions 缓存有时效性 |
| 样式错乱 | 确认 `style.css` 已上传到仓库 |

---

## 📊 功能特性

- ✅ **自动检测**: 每5分钟自动更新所有节点状态
- ✅ **延迟显示**: 显示每个节点的 ping 值
- ✅ **历史图表**: 30个时间点的在线人数趋势
- ✅ **玩家列表**: 自动合并所有节点的在线玩家
- ✅ **一键复制**: 点击复制服务器地址
- ✅ **响应式设计**: 支持手机、平板、电脑
- ✅ **深色主题**: 护眼设计，适合游戏玩家

---

## 🌟 进阶配置

### 自定义域名
1. 在 `dist` 目录创建 `CNAME` 文件
2. 写入你的域名：`status.yourdomain.com`
3. 在 DNS 添加 CNAME 记录指向 `你的用户名.github.io`

### 添加访问统计
在 `build-static.js` 的 HTML 模板中添加百度统计或 Google Analytics 代码。

### 多语言支持
修改 `build-static.js` 中的模板，添加语言切换功能。

---

**部署完成后，你的服务器状态页面就会每5分钟自动更新！** 🎉
