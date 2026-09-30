import { workerOrigin, localWorkerOrigin } from './config.js';
export class GameTransport {
  constructor(onEvent, onConnection) { this.onEvent = onEvent; this.onConnection = onConnection; this.socket = null; this.retry = null; this.stopped = false; }
  endpoint() { throw new Error('Choose a transport.'); }
  connect(intent) {
    this.intent = intent; this.stopped = false;
    clearTimeout(this.retry);
    this.socket = new WebSocket(this.endpoint(intent));
    this.onConnection('Connecting…');
    this.socket.onopen = () => { this.onConnection('Connected'); this.send(this.intent); };
    this.socket.onmessage = event => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'welcome') this.intent = { type: 'join_room', code: message.code, playerToken: message.playerToken, hostToken: message.hostToken ?? this.intent.hostToken };
        this.onEvent(message);
      } catch { this.onConnection('Could not read a server message.'); }
    };
    this.socket.onclose = () => {
      if (this.stopped) return;
      this.onConnection('Disconnected. Reconnecting…');
      // Never retry creation automatically: avoid orphan duplicate rooms.
      if (!this.stopped && this.intent.type === 'join_room') this.retry = setTimeout(() => this.connect(this.intent), 2500);
      else this.onConnection('Connection closed. You can try again.');
    };
    this.socket.onerror = () => this.onConnection('Cannot reach the game server.');
  }
  send(intent) {
    if (this.socket?.readyState !== WebSocket.OPEN) throw new Error('Reconnect before submitting.');
    this.socket.send(JSON.stringify(intent));
  }
  close() { this.stopped = true; clearTimeout(this.retry); this.socket?.close(); }
}
export class LocalGameTransport extends GameTransport {
  endpoint() { return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/api/guess`; }
}
export class CloudflareGameTransport extends GameTransport {
  endpoint(intent) {
    const url = new URL(intent.type === 'create_room' ? '/create' : '/room', isLocal && useWorker ? localWorkerOrigin : workerOrigin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    if (intent.code) url.searchParams.set('room', intent.code);
    return url.href;
  }
}
const isLocal = ['localhost', '127.0.0.1'].includes(location.hostname);
const useWorker = new URLSearchParams(location.search).get('backend') === 'worker';
export const transportClass = isLocal && !useWorker ? LocalGameTransport : CloudflareGameTransport;
export const available = Boolean(workerOrigin) || isLocal;
