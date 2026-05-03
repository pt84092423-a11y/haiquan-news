const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_CHANNEL_ID;
const content = JSON.parse(process.env.DISCORD_CONTENT || '""');
const embedImage = process.env.DISCORD_EMBED_IMAGE || '';

if (!token) { console.error('DISCORD_BOT_TOKEN not set'); process.exit(1); }
if (!channelId) { console.error('DISCORD_CHANNEL_ID not set'); process.exit(1); }

const payload = { content };
if (embedImage) {
  payload.embeds = [{ image: { url: embedImage }, color: 0x0059b2 }];
}

console.log(`Sending to channel ${channelId}...`);
const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
  method: 'POST',
  headers: {
    'Authorization': `Bot ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload),
});

if (res.ok) {
  const data = await res.json();
  console.log(`Message sent! ID: ${data.id}`);
} else {
  const err = await res.text();
  console.error(`Discord error ${res.status}: ${err}`);
  process.exit(1);
}
