const util = require('minecraft-server-util');
const fs = require('fs');
const path = require('path');

// 多地区服务器节点配置
const NODES = [
  { id: "shandong", name: "山东节点", host: "frp-ten.com", port: 57232 },
  { id: "jiangsu", name: "江苏节点", host: "frp-web.com", port: 40319 },
  { id: "hubei", name: "湖北节点", host: "frp-tag.com", port: 19158 }
];

// 数据目录
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'status-history.json');
const STATUS_FILE = path.join(DATA_DIR, 'current-status.json');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 加载历史数据（支持从 GitHub Actions 缓存恢复）
function loadHistory() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      console.log(`📚 Loaded history: ${Object.keys(data).length} nodes`);
      return data;
    }
  } catch (e) {
    console.error('⚠️  Error loading history:', e.message);
  }
  return {};
}

// 保存历史数据
function saveHistory(history) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(history, null, 2));
    console.log(`💾 Saved history to ${DATA_FILE}`);
  } catch (e) {
    console.error('❌ Error saving history:', e.message);
  }
}

// 检测单个节点（带重试）
async function checkNode(node, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await util.status(node.host, node.port, { 
        timeout: 10000,
        enableSRV: true 
      });

      return {
        online: true,
        players: {
          online: result.players.online,
          max: result.players.max,
          sample: result.players.sample || []
        },
        motd: result.motd ? result.motd.clean : "",
        latency: result.roundTripLatency || null,
        version: result.version ? result.version.name : null,
        checkedAt: new Date().toISOString()
      };
    } catch (e) {
      if (i === retries) {
        return {
          online: false,
          players: { online: 0, max: 0, sample: [] },
          error: e.message,
          checkedAt: new Date().toISOString()
        };
      }
      console.log(`  ⚠️  ${node.name} retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// 主函数
async function main() {
  console.log('🔍 K2Cr2O7 Server Status Check');
  console.log('==============================');
  console.log(`⏰ ${new Date().toLocaleString('zh-CN')}`);
  console.log('');

  const history = loadHistory();
  const timestamp = new Date().toISOString();
  const results = [];
  let totalOnline = 0;

  for (const node of NODES) {
    process.stdout.write(`  Checking ${node.name}... `);
    const status = await checkNode(node);

    // 更新历史记录
    if (!history[node.id]) {
      history[node.id] = [];
    }

    history[node.id].push({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      players: status.players.online,
      timestamp: timestamp
    });

    // 只保留最近30条记录（约2.5小时，每5分钟一条）
    if (history[node.id].length > 30) {
      history[node.id].shift();
    }

    results.push({
      ...node,
      ...status,
      address: `${node.host}:${node.port}`,
      history: history[node.id]
    });

    totalOnline += status.players.online;

    if (status.online) {
      console.log(`🟢 ${status.players.online}/${status.players.max} players ${status.latency ? '(' + status.latency + 'ms)' : ''}`);
    } else {
      console.log(`🔴 Offline - ${status.error}`);
    }
  }

  // 保存历史数据
  saveHistory(history);

  // 生成当前状态文件
  const statusData = {
    timestamp,
    generatedAt: new Date().toLocaleString('zh-CN'),
    totalNodes: results.length,
    onlineNodes: results.filter(n => n.online).length,
    totalPlayers: totalOnline,
    nodes: results
  };

  fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));

  console.log('');
  console.log('✅ Status check complete');
  console.log(`📊 Summary: ${statusData.onlineNodes}/${statusData.totalNodes} nodes online, ${totalOnline} players`);
  console.log(`💾 Data saved to: ${DATA_FILE}`);
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
