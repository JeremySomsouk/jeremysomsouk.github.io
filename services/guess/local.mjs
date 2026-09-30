import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { WebSocketServer } from 'ws';
import { Room, code } from './engine.mjs';

const rooms = new Map(), peers = new Map();
const root = resolve('../../target/site-preview');
const port = Number(process.env.PORT ?? 8787);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (/^\/guess\/[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,8}\/?$/i.test(path)) path = '/guess/';
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root + '/')) throw Error();
    if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('Not found. Build the site preview first.'); }
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 16384 });
server.on('upgrade', (req, socket, head) => {
  // Same-origin browser connections only. Bind locally by default.
  if (req.url !== '/api/guess' || (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)) return socket.destroy();
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws));
});
function broadcast(room) {
  for (const [ws, peer] of peers) if (peer.room === room && ws.readyState === 1) ws.send(JSON.stringify({ type: 'state', state: room.view(peer.token) }));
}
wss.on('connection', ws => {
  let rate = 0;
  const reset = setInterval(() => { rate = 0; }, 1000);
  ws.on('message', raw => {
    try {
      if (++rate > 20) throw Error('Slow down a moment.');
      const message = JSON.parse(raw.toString());
      let peer = peers.get(ws);
      if (!peer) {
        let room, credentials;
        if (message.type === 'create_room') {
          let roomCode; do { roomCode = code(); } while (rooms.has(roomCode));
          room = new Room(roomCode, message.name, message.questions); rooms.set(roomCode, room);
          credentials = { playerId: room.hostId, playerToken: room.players[0].token, hostToken: room.hostToken };
        } else if (message.type === 'join_room') {
          room = rooms.get(String(message.code).toUpperCase());
          if (!room) throw Error('Room not found or expired.');
          room.tick();
          credentials = message.playerToken ? { playerId: room.player(message.playerToken).id, playerToken: message.playerToken } : room.join(message.name);
        } else throw Error('Join a room first.');
        peer = { room, token: credentials.playerToken, hostToken: message.hostToken ?? credentials.hostToken }; peers.set(ws, peer);
        room.player(peer.token).connected = true;
        ws.send(JSON.stringify({ type: 'welcome', code: room.code, ...credentials }));
      } else peer.room.command(peer.token, peer.hostToken, message);
      broadcast(peer.room);
    } catch (error) {
      const peer = peers.get(ws);
      if (peer && Date.now() < peer.room.expiresAt) broadcast(peer.room);
      ws.send(JSON.stringify({ type: 'error', message: error instanceof SyntaxError ? 'Invalid message.' : error.message }));
    }
  });
  ws.on('close', () => {
    clearInterval(reset); const peer = peers.get(ws); peers.delete(ws);
    if (peer && Date.now() < peer.room.expiresAt) {
      peer.room.player(peer.token).connected = [...peers.values()].some(p => p.room === peer.room && p.token === peer.token);
      broadcast(peer.room);
    }
  });
});
setInterval(() => {
  for (const [key, room] of rooms) {
    if (Date.now() >= room.expiresAt) {
      rooms.delete(key);
      for (const [ws, peer] of peers) if (peer.room === room) { ws.send(JSON.stringify({ type: 'error', message: 'This room has expired.' })); ws.close(); }
    } else { const before = room.phase; room.tick(); if (before !== room.phase) broadcast(room); }
  }
}, 250).unref();
server.listen(port, '127.0.0.1', () => console.log(`Guess locally: http://localhost:${port}/guess/`));
