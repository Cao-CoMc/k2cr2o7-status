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

// 下载文件函数（用于本地化 Chart.js 缓存防止 CDN 挂掉）
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

// 🛡️ 核心：在后端统一将时间戳转为北京时间 (UTC+8) 的 "MM-DD HH:mm" 格式
function formatToLocalTimezone(timestamp) {
  if (!timestamp) return '';
  const date = new Date(Number(timestamp));
  if (isNaN(date.getTime())) return '';

  // 强制使用 Asia/Shanghai 时区，格式化为 "06-02 16:30"
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const map = new Map(parts.map(p => [p.type, p.value]));
  
  return `${map.get('month')}-${map.get('day')} ${map.get('hour')}:${map.get('minute')}`;
}

// 渲染节点 HTML
function generateNodes(nodes) {
  if (!nodes || nodes.length === 0) return '<p>暂无节点数据</p>';
  return nodes.map(node => {
    const statusClass = node.online ? 'online' : 'offline';
    const statusText = node.online ? '🟢 在线' : '🔴 离线';
    return `
      <div class="node-card">
        <div class="node-header">
          <h3>${node.name}</h3>
          <span class="node-status ${statusClass}">${statusText}</span>
        </div>
        <div class="node-body">
          <p><strong>地址：</strong><code>${node.address}</code> <button class="btn-copy" onclick="copyAddress('${node.address}', this)">📋 复制地址</button></p>
          ${node.online ? `
            <p><strong>版本：</strong>${node.version || '未知'}</p>
            <p><strong>延迟：</strong>${node.latency ? node.latency + 'ms' : '未知'}</p>
            <p><strong>玩家：</strong><span class="highlight">${node.players.online}/${node.players.max}</span></p>
          ` : `
            <p class="error-text"><strong>错误原因：</strong>${node.error || '连接超时'}</p>
          `}
        </div>
      </div>
    `;
  }).join('\n');
}

// 渲染下方列表时间轴 HTML
function generateTimeline(nodes) {
  if (!nodes || nodes.length === 0) return '';
  // 取第一个有历史记录的节点的记录来做公共时间轴列表
  const mainNode = nodes.find(n => n.history && n.history.length > 0);
  if (!mainNode) return '<li class="no-data">暂无历史事件</li>';

  // 倒序排列，让最新的事件显示在最上面
  const displayHistory = [...mainNode.history].reverse();

  return displayHistory.map(h => {
    // 优先读取时间戳进行北京时间转换，如果没有则降级读取 time
    const localTimeStr = h.timestamp ? formatToLocalTimezone(h.timestamp) : h.time;
    return `
      <li>
        <span class="time">${localTimeStr}</span>
        <span class="event">服务器状态检查完成</span>
        <span class="count">全网在线: ${h.players} 人</span>
      </li>
    `;
  }).join('\n');
}

// 渲染在线玩家头像
function generatePlayers(nodes) {
  const allPlayers = [];
  nodes.forEach(node => {
    if (node.online && node.players.sample) {
      node.players.sample.forEach(p => {
        if (!allPlayers.some(existing => existing.id === p.id)) {
          allPlayers.push(p);
        }
      });
    }
  });

  if (allPlayers.length === 0) {
    return '<p style="text-align:center; opacity:0.6; padding: 20px;">当前暂无在线玩家</p>';
  }

  return allPlayers.map(p => `
    <div class="player-avatar" title="${p.name}">
      <img src="https://mc-heads.net/avatar/${p.name}/32" alt="${p.name}">
      <span>${p.name}</span>
    </div>
  `).join('\n');
}

// 🛡️ 核心：生成前端 Chart.js 的配置脚本
function generateChartScript(nodes) {
  if (!nodes || nodes.length === 0) return '';

  // 提取公共 X 轴标签（采用北京时间转换后的安全字符串数组）
  const firstNode = nodes.find(n => n.history && n.history.length > 0);
  if (!firstNode) return 'console.log("No history data available for chart");';

  // 将所有历史节点的时间戳转换为北京时间字符串数组
  const labelsArray = firstNode.history.map(h => `"${formatToLocalTimezone(h.timestamp || h.time)}"`);
  const labelsJson = `[${labelsArray.join(', ')}]`;

  // 组装各个节点的 datasets 数据集
  const datasets = nodes.map((node, index) => {
    const colors = [
      { border: '#4caf50', background: 'rgba(76, 175, 80, 0.1)' },  // 绿色系
      { border: '#2196f3', background: 'rgba(33, 150, 243, 0.1)' }, // 蓝色系
      { border: '#ff9800', background: 'rgba(255, 152, 0, 0.1)' }   // 橙色系
    ];
    const color = colors[index % colors.length];
    const dataPoints = (node.history || []).map(h => h.players).join(', ');

    return `
      {
        label: '${node.name}',
        data: [${dataPoints}],
        borderColor: '${color.border}',
        backgroundColor: '${color.background}',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5
      }`;
  }).join(',\n');

  // 输出完整的 Chart.js 原生初始化前端代码
  return `
    const ctx = document.getElementById('statusChart').getContext('2d');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${labelsJson},
        datasets: [${datasets}]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#e0e0e0', font: { family: '-apple-system' } }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
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

// 主构建异步逻辑
async function main() {
  if (!fs.existsSync(statusFile)) {
    console.error('❌ Error: current-status.json 找不到，请先执行 npm run fetch ！');
    process.exit(1);
  }

  const statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
  let html = fs.readFileSync(templateFile, 'utf8');

  // 尝试下载 Chart.js 静态资源到本地 assets 目录进行离线加速优化
  try {
    const assetsDir = path.join(distDir, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    await downloadFile(
      'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
      path.join(assetsDir, 'chart.min.js')
    );
  } catch (err) {
    console.log('⚠️  ⚠️ CDN 资源本地下载失败，将回退直接使用模板中的远程链接：', err.message);
  }

  // 计算当前的中国标准时间作为页面渲染戳
  const buildTimeStr = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }) + ' (北京时间)';

  // 全量占位符替换
  html = html
    .replace('{{SERVER_STATUS}}', statusData.onlineNodes > 0 ? '正常运行中' : '全线维护中')
    .replace('{{SERVER_STATUS_CLASS}}', statusData.onlineNodes > 0 ? 'status-online' : 'status-offline')
    .replace('{{PLAYER_COUNT}}', String(statusData.totalPlayers || 0))
    .replace('{{UPDATE_TIME}}', formatToLocalTimezone(statusData.timestamp))
    .replace('{{ONLINE_NODES}}', String(statusData.onlineNodes || 0))
    .replace('{{TOTAL_NODES}}', String(statusData.totalNodes || 0))
    .replace('{{NODES_HTML}}', generateNodes(statusData.nodes))
    .replace('{{TIMELINE_HTML}}', generateTimeline(statusData.nodes))
    .replace('{{PLAYERS_HTML}}', generatePlayers(statusData.nodes))
    .replace('{{CHART_SCRIPT}}', generateChartScript(statusData.nodes))
    .replace('{{BUILD_TIME}}', buildTimeStr);

  // 如果本地有 chart.min.js，则动态将模板内的 cdn 链接覆盖成相对路径本地引用
  const fullChartPath = path.join(distDir, 'assets', 'chart.min.js');
  if (fs.existsSync(fullChartPath)) {
    html = html.replace('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js', './assets/chart.min.js');
  }

  // 写入生成的生产 index.html
  fs.writeFileSync(path.join(distDir, 'index.html'), html);
  console.log('✨ index.html 生成成功！');

  // 复制主样式表 style.css 到 dist
  const styleSrc = path.join(__dirname, '../style.css');
  const styleDest = path.join(distDir, 'style.css');
  if (fs.existsSync(styleSrc)) {
    fs.copyFileSync(styleSrc, styleDest);
    console.log('🎨 style.css 样式同步完成！');
  }

  console.log('🚀 Build process completed successfully!');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
