const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔨 Building static site (China optimized)...');

const statusFile = path.join(__dirname, '../data/current-status.json');
const templateFile = path.join(__dirname, '../index-template.html');
const distDir = path.join(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function generateNodes(nodes) {
  return nodes.map(node => {
    const statusClass = node.online ? 'online' : 'offline';
    const statusText = node.online ? '🟢 在线' : '🔴 离线';
    return `
      <div class="node-card ${statusClass}">
        <h3>${node.name}</h3>
        <p class="node-meta">${node.address}</p>
        <div class="node-status-block">
          <span class="node-status-tag ${statusClass}">${statusText}</span>
          ${node.online ? `<span class="node-latency">${node.latency}ms</span>` : ''}
        </div>
        <div class="node-players">
          在线: <strong>${node.players.online}</strong> / ${node.players.max}
        </div>
      </div>
    `;
  }).join('');
}

function generateTimeline(nodes) {
  const allHistory = [];
  nodes.forEach(node => {
    if (node.history) {
      node.history.forEach(h => {
        allHistory.push({
          timestamp: h.timestamp || Date.now(),
          nodeName: node.name,
          players: h.players
        });
      });
    }
  });

  allHistory.sort((a, b) => b.timestamp - a.timestamp);
  const latest = allHistory.slice(0, 15);

  return latest.map(item => `
    <li data-timestamp="${item.timestamp}">
      <span class="time-label">${item.timestamp}</span>
      <span class="node-tag">${item.nodeName}</span>
      <span class="count">在线人数: <strong>${item.players}</strong></span>
    </li>
  `).join('');
}

function generatePlayers(nodes) {
  let html = '';
  nodes.forEach(node => {
    if (node.online && node.players.sample && node.players.sample.length > 0) {
      node.players.sample.forEach(p => {
        html += `
          <div class="player-avatar" title="${p.name} (${node.name})">
            <img src="https://mc-heads.net/avatar/${p.name}/32" alt="${p.name}">
            <span>${p.name}</span>
          </div>
        `;
      });
    }
  });
  return html || '<p style="color:#64748b;font-size:14px;">当前暂无玩家在线</p>';
}

function generateChartScript(nodes) {
  if (!nodes || nodes.length === 0) return '';
  const firstNode = nodes[0];
  if (!firstNode.history || firstNode.history.length === 0) return '';

  // 核心改动：X 轴 labels 直接安全映射为纯时间戳数字数组
  const labels = firstNode.history.map(h => h.timestamp || Date.now()).join(', ');

  const datasets = nodes.map((node, index) => {
    const colors = [
      { border: '#4caf50', bg: 'rgba(76, 175, 80, 0.1)' },
      { border: '#2196f3', bg: 'rgba(33, 150, 243, 0.1)' },
      { border: '#ff9800', bg: 'rgba(255, 152, 0, 0.1)' }
    ];
    const color = colors[index % colors.length];
    const data = node.history ? node.history.map(h => h.players).join(', ') : '';

    return `{
      label: '${node.name}',
      data: [${data}],
      borderColor: '${color.border}',
      backgroundColor: '${color.bg}',
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 2,
      pointHoverRadius: 5
    }`;
  }).join(',\n');

  // 注意：此处纯粹负责前端图表基础配置的初始化生成
  return `
    const ctx = document.getElementById('statusChart').getContext('2d');
    window.activeChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [${labels}],
        datasets: [${datasets}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#e0e0e0' } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          x: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: '#aaa', maxRotation: 45, minRotation: 45 } 
          },
          y: { 
            grid: { color: 'rgba(255, 255, 255, 0.05)' }, 
            ticks: { color: '#aaa', beginAtZero: true, stepSize: 1 } 
          }
        }
      }
    });
  `;
}

async function build() {
  if (!fs.existsSync(statusFile)) {
    console.error('❌ current-status.json not found! Run fetch first.');
    process.exit(1);
  }

  const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  let html = fs.readFileSync(templateFile, 'utf8');

  html = html
    .replace('{{UPDATE_TIME}}', statusData.generatedAt)
    .replace('{{SERVER_STATUS}}', statusData.onlineNodes > 0 ? '正常' : '维护')
    .replace('{{SERVER_STATUS_CLASS}}', statusData.onlineNodes > 0 ? 'online' : 'offline')
    .replace('{{PLAYER_COUNT}}', String(statusData.totalPlayers || 0))
    .replace('{{ONLINE_NODES}}', String(statusData.onlineNodes || 0))
    .replace('{{TOTAL_NODES}}', String(statusData.totalNodes || 0))
    .replace('{{NODES_HTML}}', generateNodes(statusData.nodes))
    .replace('{{TIMELINE_HTML}}', generateTimeline(statusData.nodes))
    .replace('{{PLAYERS_HTML}}', generatePlayers(statusData.nodes))
    .replace('{{CHART_SCRIPT}}', generateChartScript(statusData.nodes))
    .replace('{{BUILD_TIME}}', new Date().toLocaleString('zh-CN'));

  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  
  const styleSrc = path.join(__dirname, '../style.css');
  if (fs.existsSync(styleSrc)) {
    fs.writeFileSync(path.join(distDir, 'style.css'), fs.readFileSync(styleSrc));
  }
  console.log('🎯 Static site built successfully in dist/.');
}

build();
