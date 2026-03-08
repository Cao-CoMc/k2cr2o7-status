const fs = require('fs');
const path = require('path');

console.log('🔨 Building static site...');

const statusFile = path.join(__dirname, '../data/current-status.json');
const templateFile = path.join(__dirname, '../index-template.html');

// 加载状态数据
let statusData = { 
  timestamp: new Date().toISOString(), 
  generatedAt: new Date().toLocaleString('zh-CN'),
  totalNodes: 0, onlineNodes: 0, totalPlayers: 0, nodes: [] 
};

try {
  if (fs.existsSync(statusFile)) {
    statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    console.log('✅ Loaded status for', statusData.nodes?.length || 0, 'nodes');
  }
} catch (e) {
  console.log('⚠️  Using default data');
}

// 读取模板
let template = '';
try {
  template = fs.readFileSync(templateFile, 'utf8');
} catch (e) {
  console.error('❌ Cannot read template:', e.message);
  process.exit(1);
}

// 生成节点HTML
function generateNodes(nodes) {
  if (!nodes || nodes.length === 0) return '';

  return nodes.map(node => {
    const statusClass = node.online ? 'online' : 'offline';
    const statusText = node.online ? '🟢 在线' : '🔴 离线';
    const latencyText = node.latency ? `(${node.latency}ms)` : '';

    return `  <div class="server-node ${statusClass}" data-node-id="${node.id}">
    <div class="node-header">
      <span class="node-region">📍 ${node.name}</span>
      <span class="node-status ${statusClass}">${statusText} ${latencyText}</span>
    </div>
    <div class="node-address">${node.address}</div>
    <div style="margin-top:10px;font-size:14px;color:#a0b0c0;">
      在线：${node.players.online}/${node.players.max} 人
    </div>
    <button class="copy-btn" onclick="copyAddress('${node.address}', this)">📋 复制地址</button>
  </div>`;
  }).join('\n');
}

// 生成图表脚本
function generateChartScript(nodes) {
  const node = nodes.find(n => n.history && n.history.length > 0);
  if (!node) return '';

  const labels = JSON.stringify(node.history.map(i => i.time));
  const data = JSON.stringify(node.history.map(i => i.players));

  return `<script>
(function() {
  const labels = ${labels};
  const data = ${data};
  if (labels.length === 0) return;

  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '在线人数',
        data: data,
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
})();
</script>`;
}

// 生成时间轴
function generateTimeline(nodes) {
  const node = nodes.find(n => n.history && n.history.length > 0);
  if (!node) return '<li>暂无历史数据</li>';

  return [...node.history].reverse().map(item => 
    `  <li><span class="time">${item.time}</span><span class="count">${item.players} 玩家</span></li>`
  ).join('\n');
}

// 生成玩家列表
function generatePlayers(nodes) {
  const players = new Map();
  nodes.forEach(n => {
    if (n.online && n.players.sample) {
      n.players.sample.forEach(p => players.set(p.name, p));
    }
  });

  if (players.size === 0) return '<li>暂无玩家在线</li>';

  return Array.from(players.values()).map(p => 
    `  <li><img src="https://mc-heads.net/avatar/${p.name}/32" alt="${p.name}" loading="lazy">${p.name}</li>`
  ).join('\n');
}

// 替换所有占位符
const replacements = {
  '{{SERVER_STATUS}}': statusData.onlineNodes > 0 ? '🟢 在线' : '🔴 离线',
  '{{SERVER_STATUS_CLASS}}': statusData.onlineNodes > 0 ? 'online' : 'offline',
  '{{PLAYER_COUNT}}': String(statusData.totalPlayers || 0),
  '{{UPDATE_TIME}}': statusData.generatedAt || new Date().toLocaleString('zh-CN'),
  '{{ONLINE_NODES}}': String(statusData.onlineNodes || 0),
  '{{TOTAL_NODES}}': String(statusData.totalNodes || 0),
  '{{NODES_HTML}}': generateNodes(statusData.nodes),
  '{{TIMELINE_HTML}}': generateTimeline(statusData.nodes),
  '{{PLAYERS_HTML}}': generatePlayers(statusData.nodes),
  '{{CHART_SCRIPT}}': generateChartScript(statusData.nodes),
  '{{BUILD_TIME}}': new Date().toLocaleString('zh-CN')
};

let html = template;
for (const [key, value] of Object.entries(replacements)) {
  html = html.split(key).join(value);
}

// 确保 dist 目录存在
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 写入文件
const outputFile = path.join(distDir, 'index.html');
fs.writeFileSync(outputFile, html);

// 复制样式文件
const styleSrc = path.join(__dirname, '../style.css');
const styleDest = path.join(distDir, 'style.css');
if (fs.existsSync(styleSrc)) {
  fs.copyFileSync(styleSrc, styleDest);
}

console.log('✅ Build complete!');
console.log('📁 Output:', outputFile);
console.log('📊 Size:', (fs.statSync(outputFile).size / 1024).toFixed(1), 'KB');
