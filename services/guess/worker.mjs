import { Room, code, MAX_MESSAGE_BYTES } from './engine.mjs';

// One Durable Object per room; persistence and websocket hibernation survive eviction.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (['/', '/health'].includes(url.pathname) && request.method === 'GET') return Response.json({ service: 'somsouk-games-api', status: 'ok' });
    const origin = request.headers.get('Origin');
    const allowed = (env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim());
    if (!allowed.includes(origin) || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('WebSocket from the configured site required.', { status: 403 });
    let roomCode = url.searchParams.get('room')?.toUpperCase();
    const creating = url.pathname === '/create';
    if (!creating && (url.pathname !== '/room' || !/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4,8}$/.test(roomCode ?? ''))) return new Response('Unknown room.', { status: 404 });
    // Creation reserves a code atomically in its own DO, retries collisions.
    for (let attempt = 0; attempt < 8; attempt++) {
      if (creating) roomCode = code();
      const stub = env.ROOMS.get(env.ROOMS.idFromName(roomCode));
      const headers = new Headers(request.headers);
      headers.set('X-Room-Code', roomCode); headers.set('X-Create-Room', creating ? 'yes' : 'no');
      const response = await stub.fetch(new Request(request, { headers }));
      if (response.status !== 409) return response;
    }
    return new Response('Try creating again.', { status: 503 });
  },
};
export class GuessRoom {
  constructor(ctx) {
    this.ctx = ctx; this.room = null;
    ctx.blockConcurrencyWhile(async () => {
      const stored = await ctx.storage.get('room');
      if (stored) this.room = Object.assign(Object.create(Room.prototype), stored);
      // Connections are authoritative after hibernation or restart.
      if (this.room) for (const p of this.room.players) p.connected = ctx.getWebSockets().some(ws => ws.deserializeAttachment()?.token === p.token);
    });
  }
  async fetch(request) {
    const creating = request.headers.get('X-Create-Room') === 'yes';
    if (creating && (this.room || this.ctx.getWebSockets().length)) return new Response('Code occupied.', { status: 409 });
    if (!creating && (!this.room || Date.now() >= this.room.expiresAt)) return new Response('Room not found or expired.', { status: 404 });
    if (this.ctx.getWebSockets().length >= 48) return new Response('Room connection limit reached.', { status: 429 });
    const pair = new WebSocketPair();
    this.ctx.acceptWebSocket(pair[1]);
    pair[1].serializeAttachment({ creating, code: request.headers.get('X-Room-Code'), count: 0, window: Date.now() });
    // Bound unauthenticated sockets; production should additionally use Cloudflare rate limiting.
    if (!this.room) await this.ctx.storage.setAlarm(Date.now() + 60000);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }
  async persist() {
    if (!this.room) return;
    await this.ctx.storage.put('room', { ...this.room });
    await this.ctx.storage.setAlarm(Math.min(this.room.expiresAt, this.room.deadline ?? this.room.expiresAt));
  }
  broadcast() {
    if (!this.room || Date.now() >= this.room.expiresAt) return;
    for (const ws of this.ctx.getWebSockets()) {
      const a = ws.deserializeAttachment();
      if (a?.token) {
        const state = this.room.view(a.token), version = this.room.bannerVersion ?? 0;
        if (a.bannerVersion === version) delete state.banner;
        ws.send(JSON.stringify({ type: 'state', state }));
        if (a.bannerVersion !== version) { a.bannerVersion = version; ws.serializeAttachment(a); }
      }
    }
  }
  async webSocketMessage(ws, raw) {
    try {
      if (typeof raw !== 'string') throw Error('Invalid message.');
      const messageBytes = new TextEncoder().encode(raw).byteLength;
      if (messageBytes > MAX_MESSAGE_BYTES) throw Error('Invalid message.');
      const a = ws.deserializeAttachment();
      if (Date.now() - a.window > 1000) { a.count = 0; a.window = Date.now(); }
      if (++a.count > 20) throw Error('Slow down a moment.');
      ws.serializeAttachment(a);
      const m = JSON.parse(raw);
      if (m?.type !== 'set_banner' && messageBytes > 16384) throw Error('Invalid message.');
      if (!a.token) {
        let credentials;
        if (a.creating && m.type === 'create_room' && !this.room) {
          this.room = new Room(a.code, m.name, m.questions);
          credentials = { playerId: this.room.hostId, playerToken: this.room.players[0].token, hostToken: this.room.hostToken };
        } else if (!a.creating && m.type === 'join_room' && this.room) {
          this.room.tick();
          credentials = m.playerToken ? { playerId: this.room.player(m.playerToken).id, playerToken: m.playerToken } : this.room.join(m.name);
        } else throw Error('Join a room first.');
        a.token = credentials.playerToken; a.hostToken = m.hostToken ?? credentials.hostToken;
        ws.serializeAttachment(a); this.room.player(a.token).connected = true;
        await this.persist();
        ws.send(JSON.stringify({ type: 'welcome', code: this.room.code, ...credentials }));
      } else { this.room.command(a.token, a.hostToken, m); await this.persist(); }
      this.broadcast();
    } catch (error) {
      // Deadline expiry may have legitimately transitioned the room before rejecting an intent.
      if (this.room && Date.now() < this.room.expiresAt) { await this.persist(); this.broadcast(); }
      const message = error instanceof SyntaxError ? 'Invalid message.' : error.message;
      ws.send(JSON.stringify({ type: 'error', message }));
    }
  }
  async webSocketClose(ws) {
    const a = ws.deserializeAttachment();
    if (a?.token && this.room && Date.now() < this.room.expiresAt) {
      this.room.player(a.token).connected = this.ctx.getWebSockets().some(other => other !== ws && other.deserializeAttachment()?.token === a.token);
      await this.persist(); this.broadcast();
    }
  }
  async webSocketError(ws) { await this.webSocketClose(ws); }
  async alarm() {
    if (!this.room || Date.now() >= this.room.expiresAt) {
      for (const ws of this.ctx.getWebSockets()) ws.close(1000, 'Room expired');
      this.room = null; await this.ctx.storage.deleteAll(); await this.ctx.storage.deleteAlarm(); return;
    }
    this.room.tick(); await this.persist(); this.broadcast();
  }
}
