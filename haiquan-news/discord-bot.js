import { Client, GatewayIntentBits, ActivityType } from 'discord.js';

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('[Discord Bot] DISCORD_BOT_TOKEN chưa được cấu hình. Bot sẽ không khởi động.');
  process.exit(0);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('clientReady', () => {
  console.log(`[Discord Bot] ✅ Bot đã online: ${client.user.tag}`);
  console.log(`[Discord Bot] Application ID: ${client.user.id}`);
  console.log(`[Discord Bot] OAuth Invite URL: https://discord.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=2048`);
  const guilds = client.guilds.cache.map(g => `${g.name} (${g.id})`);
  if (guilds.length === 0) {
    console.log('[Discord Bot] ⚠️  Bot chưa được thêm vào server nào!');
  } else {
    console.log(`[Discord Bot] Bot đang có trong ${guilds.length} server: ${guilds.join(', ')}`);
  }
  client.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'baohaiquansrov.xo.je',
        type: ActivityType.Watching,
      },
    ],
  });
});

client.on('error', (err) => {
  console.error('[Discord Bot] Lỗi:', err.message);
});

client.login(token).catch((err) => {
  console.error('[Discord Bot] Không thể đăng nhập:', err.message);
});
