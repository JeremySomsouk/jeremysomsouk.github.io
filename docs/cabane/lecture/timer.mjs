export class ReadingTimer {
  constructor(now = () => performance.now()) {
    this.now = now;
    this.state = 'idle';
    this.total = 0;
    this.since = 0;
  }

  start() {
    if (this.state !== 'idle') return false;
    this.total = 0;
    this.since = this.now();
    this.state = 'running';
    return true;
  }

  elapsed() {
    return this.total + (this.state === 'running' ? this.now() - this.since : 0);
  }

  stop() {
    if (this.state === 'idle') return null;
    this.total = this.elapsed();
    this.state = 'idle';
    return this.total;
  }

  reset() {
    this.state = 'idle';
    this.total = 0;
  }
}

export function formatDuration(milliseconds) {
  const tenths = Math.floor(milliseconds / 100);
  return `${String(Math.floor(tenths / 600)).padStart(2, '0')}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')}.${tenths % 10}`;
}
