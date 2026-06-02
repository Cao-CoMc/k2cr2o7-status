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

// 加载历史数据
function loadHistory() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('⚠️ Error loading history, resetting:', e.message);
  }
  return {};
}

// 保存历史数据
function saveHistory(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('⚠️ Error saving history:', e.message);
  }
}

async function queryServer(node) {
  try {
    const result = await util.status(node.host, node.port, { timeout: 5000 });
    return {
      online: true,
      players: {
        online: result.players.online,
        max: result.players.max,
        sample: result.players.sample || []
      },
      latency: result.roundTripTime,
      version: result.version.name,
      motd: result.motd.clean
    };
  } catch (error) {
    return {
      online: false,
      players: { online: 0, max: 0, sample: [] },
      latency: 0,
      version: "Unknown",
      error: error.message
    };
  }
}

async function run() {
  console.log('🌐 Fetching Minecraft server status...');
  const history = loadHistory();
  const timestamp = Date.now();
  const results = [];
  let totalOnline = 0;

  for (const node of NODES) {
    console.log(`📡 Querying ${node.name} (${node.host}:${node.port})...`);
    const status = await queryServer(node);
    
    if (!history[node.id]) {
      history[node.id] = [];
    }

    // 核心安全数据结构：time 作为回退文本，timestamp 作为前端高精度时间戳
    history[node.id].push({
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      players: status.players.online,
      timestamp: timestamp
    });

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
      console.log(`🟢 ${status.players.online}/${status.players.max} players (${status.latency}ms)`);
    } else {
      console.log(`🔴 Offline - ${status.error}`);
    }
  }

  saveHistory(history);

  const statusData = {
    timestamp,
    generatedAt: new Date().toLocaleString('zh-CN'),
    totalNodes: results.length,
    onlineNodes: results.filter(n => n.online).length,
    totalPlayers: totalOnline,
    nodes: results
  };

  fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
  console.log('✅ Status updated successfully.');
}

run();
