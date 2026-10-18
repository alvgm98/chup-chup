// Aviso sonoro y vibración al terminar un temporizador.
let ctx = null;

/** Hay que llamarlo desde un gesto del usuario para que el audio quede desbloqueado. */
export function prepararAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}

export function avisar() {
  try { navigator.vibrate?.([300, 120, 300, 120, 500]); } catch {}
  if (!ctx) return;
  const ahora = ctx.currentTime;
  // Tres "tines" suaves, como un temporizador de cocina
  [0, 0.45, 0.9, 1.6, 2.05, 2.5].forEach((t) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ahora + t);
    g.gain.exponentialRampToValueAtTime(0.35, ahora + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ahora + t + 0.35);
    o.connect(g).connect(ctx.destination);
    o.start(ahora + t);
    o.stop(ahora + t + 0.4);
  });
}

/** Temporizador que sigue la hora real (no se desajusta si el móvil se duerme). */
export class Temporizador {
  constructor(segundos, { onTick, onFin } = {}) {
    this.total = segundos;
    this.restante = segundos;
    this.fin = null;
    this.estado = 'parado'; // parado | marcha | fin
    this.onTick = onTick;
    this.onFin = onFin;
    this.iv = null;
  }
  iniciar() {
    prepararAudio();
    if (this.estado === 'fin') this.restante = this.total;
    this.fin = Date.now() + this.restante * 1000;
    this.estado = 'marcha';
    clearInterval(this.iv);
    this.iv = setInterval(() => this.tick(), 250);
    this.tick();
  }
  pausar() {
    if (this.estado !== 'marcha') return;
    this.restante = Math.max(0, (this.fin - Date.now()) / 1000);
    this.estado = 'parado';
    clearInterval(this.iv);
    this.onTick?.(this);
  }
  alternar() {
    if (this.estado === 'marcha') this.pausar();
    else this.iniciar();
  }
  reiniciar() {
    clearInterval(this.iv);
    this.restante = this.total;
    this.estado = 'parado';
    this.onTick?.(this);
  }
  get segundos() {
    return this.estado === 'marcha' ? Math.max(0, Math.ceil((this.fin - Date.now()) / 1000)) : Math.ceil(this.restante);
  }
  tick() {
    if (this.estado === 'marcha' && Date.now() >= this.fin) {
      clearInterval(this.iv);
      this.restante = 0;
      this.estado = 'fin';
      this.onTick?.(this);
      avisar();
      this.onFin?.(this);
      return;
    }
    this.onTick?.(this);
  }
}
