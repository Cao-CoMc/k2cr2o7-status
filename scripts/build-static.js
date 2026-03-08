const fs = require('fs');
const path = require('path');

console.log('🔨 Building static site...');
console.log('');

// 读取当前状态
const statusFile = path.join(__dirname, '../data/current-status.json');
const styleFile = path.join(__dirname, '../style.css');

let statusData = { 
  timestamp: new Date().toISOString(), 
  generatedAt: new Date().toLocaleString('zh-CN'),
  totalNodes: 0,
  onlineNodes: 0,
  totalPlayers: 0,
  nodes: [] 
};

// 尝试读取状态文件
try {
  if (fs.existsSync(statusFile)) {
    const raw = fs.readFileSync(statusFile, 'utf8');
    statusData = JSON.parse(raw);
    console.log(`✅ Loaded status data: ${statusData.nodes?.length || 0} nodes`);
  } else {
    console.log('⚠️  No status file found, using defaults');
  }
} catch (e) {
  console.error('❌ Error reading status:', e.message);
}

// 读取样式
t let styleContent = '';
try {
  if (fs.existsSync(styleFile)) {
    styleContent = fs.readFileSync(styleFile, 'utf8');
    console.log('✅ Loaded styles');
  } else {
    console.log('⚠️  No style file found');
  }
} catch (e) {
  console.error('❌ Error reading styles:', e.message);
}

// 生成节点HTML
function generateNodesHtml(nodes) {
  if (!nodes || nodes.length === 0) {
    return '<p style="text-align: center; color: #6b7280;">暂无节点数据</p>';
  }

  return nodes.map(node => `
<div class="server-node ${node.online ? 'online' : 'offline'}" data-node-id="${node.id}">
  <div class="node-header">
    <span class="node-region">📍 ${node.name}</span>
    <span class="node-status ${node.online ? 'online' : 'offline'}">
      ${node.online ? '🟢 在线' : '🔴 离线'}
      ${node.latency ? `(${node.latency}ms)` : ''}
    </span>
  </div>
  <div class="node-address">${node.address}</div>
  <div class="node-stats">
    <span class="stat">👥 ${node.players.online}/${node.players.max}</span>
    ${node.version ? `<span class="stat">📦 ${node.version}</span>` : ''}
  </div>
  <button class="copy-btn" onclick="copyAddress('${node.address}', this)">
    📋 复制地址
  </button>
</div>
  `).join('');
}

// 生成图表数据
function generateChartData(nodes) {
  const nodeWithHistory = nodes.find(n => n.history && n.history.length > 0);
  if (!nodeWithHistory) return { labels: [], data: [] };

  return {
    labels: nodeWithHistory.history.map(i => i.time),
    data: nodeWithHistory.history.map(i => i.players)
  };
}

// 生成时间轴HTML
function generateTimeline(nodes) {
  const nodeWithHistory = nodes.find(n => n.history && n.history.length > 0);
  if (!nodeWithHistory || !nodeWithHistory.history) {
    return '<li>暂无历史数据</li>';
  }

  return [...nodeWithHistory.history].reverse().map(item => `
<li>
  <span class="time">${item.time}</span>
  <span class="count">${item.players} 玩家</span>
</li>
  `).join('');
}

// 生成玩家列表
function generatePlayers(nodes) {
  const allPlayers = new Map();

  nodes.forEach(node => {
    if (node.online && node.players.sample) {
      node.players.sample.forEach(p => {
        if (!allPlayers.has(p.name)) {
          allPlayers.set(p.name, p);
        }
      });
    }
  });

  if (allPlayers.size === 0) {
    return '<li>暂无玩家在线</li>';
  }

  return Array.from(allPlayers.values()).map(p => `
<li>
  <img src="https://mc-heads.net/avatar/${p.name}/32" alt="${p.name}" loading="lazy">
  <span>${p.name}</span>
</li>
  `).join('');
}

const chartData = generateChartData(statusData.nodes);

// HTML 模板
const htmlTemplate = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>K2Cr2O7 Minecraft Server Status</title>
<link rel="icon" type="image/png" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E⚗️%3C/text%3E%3C/svg%3E">
<style>
${styleContent}

/* 额外样式 */
.node-stats {
  margin: 10px 0;
  font-size: 13px;
  color: #a0b0c0;
  display: flex;
  gap: 15px;
}

.stat {
  background: rgba(77, 166, 255, 0.1);
  padding: 4px 10px;
  border-radius: 12px;
}

.update-info {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  margin-top: 10px;
}

.auto-update {
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4caf50;
  border-radius: 50%;
  margin-right: 5px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>

<header class="hero">
<div class="overlay">
<h1>K2Cr2O7 Server</h1>
<p class="subtitle">用重铬酸钾的能量，点燃你的工业灵感</p>
<div class="status">
  状态：<span id="serverStatus" class="${statusData.onlineNodes > 0 ? 'online' : 'offline'}">
    ${statusData.onlineNodes > 0 ? '🟢 在线' : '🔴 离线'}
  </span>
  <br>
  在线人数：<span id="playerCount">${statusData.totalPlayers || 0}</span>
</div>
<div class="update-info">
  <span class="auto-update"></span>
  最后更新：${statusData.generatedAt || new Date().toLocaleString('zh-CN')}
  <br>
  <small>节点：${statusData.onlineNodes || 0}/${statusData.totalNodes || 0} 在线</small>
</div>
</div>
</header>

<section class="info">
<h2>🌐 服务器简介</h2>
<p>K2Cr2O7 是一个基于 Forge 构建的科技生存服务器，融合 <b>性能优化 + 机械自动化 + 多样生态群系</b>。</p>
<p>核心玩法：<b>技术探索 + 冒险挑战 + 模组生存</b></p>
</section>

<section>
<h2>🌐 多地区服务器节点</h2>
<p class="server-intro">我们提供多个地区节点，请选择延迟最低的服务器加入：</p>

<div class="server-nodes">
${generateNodesHtml(statusData.nodes)}
</div>

<p class="node-tip">💡 提示：建议选择地理位置最近的节点以获得最佳游戏体验</p>
</section>

<section>
<h2>✨ 特性亮点</h2>
<ul>
<li>⚡ <b>性能优化彻底</b>：涵盖 FPS 增强、异步粒子渲染、UI 优化等方面</li>
<li>🌿 <b>生态群系丰富</b>：支持暮色森林、超多生物群系、农夫乐事等</li>
<li>🚗 <b>机械玩法完整</b>：整合机械动力及多个附加模组</li>
<li>🧰 <b>界面与交互提升</b>：使用现代化 UI、地图系统、便捷背包</li>
</ul>
</section>

<section>
<h2>📊 在线人数趋势</h2>
<canvas id="chart"></canvas>
</section>

<section>
<h2>📈 在线人数时间轴</h2>
<ul id="timeline">
${generateTimeline(statusData.nodes)}
</ul>
</section>

<section>
<h2>👥 当前在线玩家</h2>
<ul id="players">
${generatePlayers(statusData.nodes)}
</ul>
</section>

<section>
<h2>📬 加入服务器</h2>
<div class="join-info">
<p><b>服务器名称：</b>K2Cr2O7 Server</p>
<p><b>版本：</b>Minecraft 1.20.1 Forge</p>
<p><b>QQ群：</b>115987290（入群获取服务器地址和整合包）</p>
<p><b>整合包下载：</b><br><a href="https://github.com/sankuchuari/K2Cr2O7" target="_blank">GitHub - K2Cr2O7</a></p>
<p class="private-notice">🔒 为保护服务器安全，服务器地址仅对群成员开放。请加入 QQ 群 115987290 获取详细信息。</p>
</div>
</section>

<footer>
<p>K2Cr2O7 Server © 2026</p>
<p style="font-size: 12px; opacity: 0.5;">
  自动部署于 ${new Date().toLocaleString('zh-CN')}
  <br>
  <span id="nextUpdate">下次更新：计算中...</span>
</p>
</footer>

<script>
// 图表数据
const chartData = {
  labels: ${JSON.stringify(chartData.labels)},
  data: ${JSON.stringify(chartData.data)}
};

// 初始化图表
if (chartData.labels.length > 0) {
  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.labels,
      datasets: [{
        label: '在线人数',
        data: chartData.data,
        borderColor: '#4da6ff',
        backgroundColor: 'rgba(77,166,255,0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: '#4da6ff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { 
          display: true,
          labels: { color: '#e0e0e0' }
        }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          ticks: { color: '#a0b0c0' },
          grid: { color: 'rgba(255,255,255,0.1)' }
        },
        x: { 
          ticks: { color: '#a0b0c0' },
          grid: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
}

// 复制地址功能
function copyAddress(addr, btn) {
  navigator.clipboard.writeText(addr).then(() => {
    const original = btn.innerHTML;
    btn.innerHTML = '✅ 已复制';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.innerHTML = original;
      btn.classList.remove('copied');
    }, 2000);
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = addr;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    btn.innerHTML = '✅ 已复制';
    setTimeout(() => btn.innerHTML = '📋 复制地址', 2000);
  });
}

// 计算下次更新时间（每5分钟）
function updateNextUpdateTime() {
  const now = new Date();
  const nextUpdate = new Date(Math.ceil(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
  const diff = Math.ceil((nextUpdate - now) / 1000);
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  document.getElementById('nextUpdate').textContent = 
    `下次更新：${minutes}分${seconds}秒后`;
}

updateNextUpdateTime();
setInterval(updateNextUpdateTime, 1000);
</script>

</body>
</html>`;

// 确保 dist 目录存在
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 写入 HTML 文件
const outputFile = path.join(distDir, 'index.html');
fs.writeFileSync(outputFile, htmlTemplate);

console.log('');
console.log('✅ Build complete!');
console.log(`📁 Output: ${outputFile}`);
console.log(`📊 Size: ${(fs.statSync(outputFile).size / 1024).toFixed(1)} KB`);
console.log('');
console.log('Summary:');
console.log(`  - Nodes: ${statusData.nodes?.length || 0}`);
console.log(`  - Online: ${statusData.onlineNodes || 0}`);
console.log(`  - Players: ${statusData.totalPlayers || 0}`);
console.log(`  - History points: ${statusData.nodes?.[0]?.history?.length || 0}`);
