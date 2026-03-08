# 🔧 GitHub Actions 定时任务不运行 - 排查指南

## 常见问题及解决方案

### 1. 定时任务从未运行过

**原因**：GitHub Actions 定时任务（schedule）**只在默认分支（main/master）上运行**

**检查**：
1. 你的工作流文件 `.github/workflows/deploy.yml` 是否在 **main** 分支上？
2. 文件是否已推送到 GitHub？

**解决**：
```bash
git add .github/workflows/deploy.yml
git commit -m "Add scheduled workflow"
git push origin main
```

---

### 2. 定时任务运行一段时间后停止

**原因**：GitHub 会自动禁用**60天无活动**的仓库的定时任务

**检查**：
- 仓库最后一次提交是什么时候？
- Actions 页面是否显示 "This scheduled workflow is disabled because there hasn't been activity in this repository for at least 60 days"?

**解决**：
1. **手动启用**：进入 Actions 页面，点击 "Enable workflow"
2. **保持活动**：工作流已添加自动提交步骤，每次运行都会提交更新，保持仓库活动

---

### 3. 定时任务有延迟（不是精确的5分钟）

**原因**：这是正常现象！GitHub Actions 的定时任务**不保证精确执行时间**

> 官方说明："Generally, the delay time is about 3 to 10 minutes. Sometimes, it may be more, even dozens of minutes, or more than one hour."

**实际情况**：
- 请求每5分钟执行一次
- 实际执行时间可能有 3-10 分钟延迟
- 高峰期（整点）延迟可能更长

**这不是 bug**，是 GitHub Actions 的设计限制

---

### 4. 权限不足导致无法运行

**原因**：`permissions` 配置不正确

**检查**：查看 Actions 日志是否有 "Resource not accessible by integration" 错误

**解决**：确保工作流文件包含正确的权限：
```yaml
permissions:
  contents: write    # 允许提交更改
  pages: write       # 允许部署 Pages
  id-token: write    # 允许使用 OIDC
```

---

### 5. 工作流被手动禁用

**检查**：
1. 进入仓库的 **Actions** 标签
2. 点击左侧的 **Deploy to GitHub Pages**
3. 查看是否有 "This workflow was disabled" 的提示

**解决**：点击 **Enable workflow** 按钮

---

## ✅ 修复后的工作流特点

本次更新的工作流已修复以下问题：

1. ✅ **正确的权限配置** - `contents: write` 允许提交
2. ✅ **自动保持活动** - 每次运行都会提交数据更新，防止60天自动禁用
3. ✅ **完整的 checkout** - `fetch-depth: 0` 避免 shallow clone 问题
4. ✅ **移除缓存** - 避免 `cache: 'npm'` 导致的权限错误

---

## 🔍 如何验证定时任务是否正常工作

### 方法 1：查看 Actions 日志
1. 进入仓库 **Actions** 标签
2. 查看 **Deploy to GitHub Pages** 工作流
3. 观察触发方式：
   - `schedule` - 表示定时触发 ✅
   - `push` - 表示推送触发
   - `workflow_dispatch` - 表示手动触发

### 方法 2：检查上次运行时间
在 Actions 页面，查看每次运行的 **时间戳**，确认是否大约每5分钟有一次运行

### 方法 3：查看提交记录
由于每次运行都会提交数据更新，可以在 **Code** 标签查看提交历史：
- 应该有 "Update server status [...]" 的自动提交
- 大约每5-15分钟一次

---

## 🚀 快速修复步骤

1. **更新工作流文件**：
   ```bash
   # 下载最新的 deploy.yml
   # 复制到 .github/workflows/deploy.yml
   git add .github/workflows/deploy.yml
   git commit -m "Fix: Update workflow permissions and add auto-commit"
   git push origin main
   ```

2. **检查仓库设置**：
   - 进入 **Settings** → **Actions** → **General**
   - 确保 **Workflow permissions** 设置为 **Read and write permissions**

3. **手动触发一次**：
   - 进入 **Actions** → **Deploy to GitHub Pages**
   - 点击 **Run workflow** → **Run workflow**
   - 确认能正常运行

4. **等待验证**：
   - 等待 10-15 分钟
   - 查看是否有定时触发的运行记录

---

## 📝 重要提示

1. **定时任务不精确**：GitHub Actions 的 `schedule` 是"请求"而不是"保证"，延迟是正常的

2. **需要保持仓库活动**：如果60天没有提交，定时任务会被自动禁用
   - ✅ 本次修复已添加自动提交，每次运行都会更新数据

3. **只在默认分支运行**：`schedule` 触发器只在 main/master 分支上工作

4. **时区问题**：GitHub Actions 使用 UTC 时间，`*/5 * * * *` 表示 UTC 时间的每5分钟

---

## 🆘 如果还是不行

请检查以下内容并提供信息：

1. 仓库是否为 **Public**？（Private 仓库 Actions 有时间限制）
2. 工作流文件是否在 **main** 分支的 `.github/workflows/` 目录下？
3. Actions 页面显示什么错误信息？
4. 最近是否有手动触发成功过？

可以截图 Actions 页面的状态，方便进一步排查。
