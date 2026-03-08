# K2Cr2O7 Server Status - 项目结构

```
k2cr2o7-status/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions 自动部署配置
├── scripts/
│   ├── fetch-status.js         # 获取服务器状态（带重试和缓存）
│   └── build-static.js         # 构建静态 HTML 页面
├── data/                       # 数据目录（自动生成，Git忽略）
│   ├── current-status.json     # 当前状态
│   └── status-history.json     # 历史记录
├── dist/                       # 构建输出（自动生成）
│   └── index.html              # 最终部署的页面
├── style.css                   # 页面样式
├── package.json                # 项目配置和依赖
├── .gitignore                  # Git 忽略文件
└── README.md                   # 部署指南
```

## 关键文件说明

### deploy.yml
- 触发条件：git push、每5分钟定时、手动触发
- 使用缓存保留历史数据
- 自动部署到 GitHub Pages

### fetch-status.js
- 检测3个地区节点状态
- 支持重试机制（最多3次）
- 保存30条历史记录
- 输出详细日志

### build-static.js
- 读取状态数据生成 HTML
- 内嵌 CSS 和 JavaScript
- 生成图表和玩家列表
- 显示下次更新倒计时

### style.css
- 深色主题设计
- 响应式布局
- 动画效果（脉冲、悬停）
- 节点状态样式（在线/离线）
