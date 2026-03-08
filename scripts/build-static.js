const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🔨 Building static site (China optimized)...');

const statusFile = path.join(__dirname, '../data/current-status.json');
const templateFile = path.join(__dirname, '../index-template.html');
const distDir = path.join(__dirname, '../dist');

// 确保 dist 目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 下载文件函数
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) {
      console.log('✅ Already exists:', path.basename(dest));
      resolve();
      return;
    }

    console.log('⬇️  Downloading:', path.basename(dest));
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error('Status Code: ' + response.statusCode));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('✅ Downloaded:', path.basename(dest));
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// 下载必要的资源到本地
async function downloadAssets() {
  const assetsDir = path.join(distDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  try {
    // 下载 Chart.js（使用 jsDelivr 的国内镜像或备用源）
    await downloadFile(
      'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
      path.join(assetsDir, 'chart.min.js')
    );
  } catch (e) {
    console.log('⚠️  Failed to download Chart.js:', e.message);
    console.log('   Will use CDN fallback');
  }
}

// 加载状态数据
let statusData = { 
  timestamp: new Date().toISOString(), 
  generatedAt: new Date().toLocaleString('zh-CN'),
  totalNodes: 0, onlineNodes: 0, totalPlayers: 0, nodes: [] 
};

try {
  if (fs.existsSync(statusFile)) {
    statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
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

// 生成动态内容（与之前相同）
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
    <div style="margin-top:10px;font-size:14px;color:#a0b0c0;">在线：${node.players.online}/${node.players.max} 人</div>
    <button class="copy-btn" onclick="copyAddress('${node.address}', this)">📋 复制地址</button>
  </div>`;
  }).join('\n');
}

function generateChartScript(nodes) {
  const node = nodes.find(n => n.history && n.history.length > 0);
  if (!node) return '';
  const labels = JSON.stringify(node.history.map(i => i.time));
  const data = JSON.stringify(node.history.map(i => i.players));

  return `<script>
(function() {
  const labels = ${labels}; const data = ${data};
  if (labels.length === 0) return;
  new Chart(document.getElementById('chart').getContext('2d'), {
    type: 'line',
    data: { labels: labels, datasets: [{ label: '在线人数', data: data, borderColor: '#4da6ff', backgroundColor: 'rgba(77,166,255,0.1)', tension: 0.3, fill: true, pointRadius: 3, pointBackgroundColor: '#4da6ff' }] },
    options: { responsive: true, plugins: { legend: { display: true, labels: { color: '#e0e0e0' } } }, scales: { y: { beginAtZero: true, ticks: { color: '#a0b0c0' }, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { ticks: { color: '#a0b0c0' }, grid: { color: 'rgba(255,255,255,0.05)' } } } }
  });
})();
</script>`;
}

function generateTimeline(nodes) {
  const node = nodes.find(n => n.history && n.history.length > 0);
  if (!node) return '<li>暂无历史数据</li>';
  return [...node.history].reverse().map(item => 
    `  <li><span class="time">${item.time}</span><span class="count">${item.players} 玩家</span></li>`
  ).join('\n');
}

function generatePlayers(nodes) {
  const players = new Map();
  nodes.forEach(n => {
    if (n.online && n.players.sample) {
      n.players.sample.forEach(p => players.set(p.name, p));
    }
  });
  if (players.size === 0) return '<li>暂无玩家在线</li>';
  return Array.from(players.values()).map(p => 
    `  <li><img src="https://mc-heads.net/avatar/${p.name}/32" alt="${p.name}" loading="lazy" onerror="this.src='https://cravatar.eu/helmavatar/${p.name}/32.png'; this.onerror=function(){this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22><rect fill=%22%23ccc%22 width=%2232%22 height=%2232%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2216%22>?</text></svg>';}">${p.name}</li>`
  ).join('\n');
}

// 主构建流程
async function build() {
  // 下载资源
  await downloadAssets();

  // 替换模板
  let html = template
    .replace('{{SERVER_STATUS}}', statusData.onlineNodes > 0 ? '🟢 在线' : '🔴 离线')
    .replace('{{SERVER_STATUS_CLASS}}', statusData.onlineNodes > 0 ? 'online' : 'offline')
    .replace('{{PLAYER_COUNT}}', String(statusData.totalPlayers || 0))
    .replace('{{UPDATE_TIME}}', statusData.generatedAt || new Date().toLocaleString('zh-CN'))
    .replace('{{ONLINE_NODES}}', String(statusData.onlineNodes || 0))
    .replace('{{TOTAL_NODES}}', String(statusData.totalNodes || 0))
    .replace('{{NODES_HTML}}', generateNodes(statusData.nodes))
    .replace('{{TIMELINE_HTML}}', generateTimeline(statusData.nodes))
    .replace('{{PLAYERS_HTML}}', generatePlayers(statusData.nodes))
    .replace('{{CHART_SCRIPT}}', generateChartScript(statusData.nodes))
    .replace('{{BUILD_TIME}}', new Date().toLocaleString('zh-CN'));

  // 替换 CDN 链接为本地链接（如果下载成功）
  const localChartPath = './assets/chart.min.js';
  const fullChartPath = path.join(distDir, 'assets', 'chart.min.js');
  if (fs.existsSync(fullChartPath)) {
    html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', localChartPath);
    html = html.replace('https://cdn.jsdelivr.net/npm/chart.js', localChartPath);
  }

  // 写入 HTML
  fs.writeFileSync(path.join(distDir, 'index.html'), html);

  // 复制样式
  const styleSrc = path.join(__dirname, '../style.css');
  const styleDest = path.join(distDir, 'style.css');
  if (fs.existsSync(styleSrc)) {
    fs.copyFileSync(styleSrc, styleDest);
  }

  console.log('✅ Build complete!');
  console.log('📁 Output:', distDir);
  console.log('📊 Size:', (fs.statSync(path.join(distDir, 'index.html')).size / 1024).toFixed(1), 'KB');

  // 检查是否使用了本地资源
  if (fs.existsSync(fullChartPath)) {
    console.log('✅ Chart.js 已本地化');
  } else {
    console.log('⚠️  Chart.js 使用 CDN');
  }
}

build().catch(console.error);
