window.LP = window.LP || {};

// Oyun sesleri Web Audio ile üretilir; ses dosyası gerekmez.
LP.Sound = (function () {
  const KEY = 'logipoly.sound';
  let ctx = null;
  let room = null;
  let enabled = localStorage.getItem(KEY) !== 'off';
  let stopSiren = null;

  function audio() {
    if (!enabled) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function bus(c, volume) {
    const g = c.createGain();
    g.gain.value = volume;
    g.connect(c.destination);
    return g;
  }

  // Beton oda yankısı (gürültüden üretilmiş dürtü yanıtı).
  function reverb(c, wet) {
    if (!room) {
      const len = Math.floor(c.sampleRate * 1.8);
      const ir = c.createBuffer(2, len, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
      }
      room = ir;
    }
    const conv = c.createConvolver();
    conv.buffer = room;
    const dry = c.createGain();
    const wetGain = c.createGain();
    wetGain.gain.value = wet;
    const input = c.createGain();
    input.connect(dry);
    input.connect(conv);
    conv.connect(wetGain);
    return {
      input,
      connect(dest) { dry.connect(dest); wetGain.connect(dest); return input; },
    };
  }

  function filter(c, out, type, freq, q) {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    f.connect(out);
    return f;
  }

  function tone(c, out, { type = 'sine', freq, freqEnd, start = 0, dur, vol = 0.3, attack = 0.01, hold = 0.6, vibrato = 0 }) {
    const t0 = c.currentTime + start;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
    if (vibrato) {
      const lfo = c.createOscillator();
      const depth = c.createGain();
      lfo.frequency.value = 5.5;
      depth.gain.value = vibrato;
      lfo.connect(depth);
      depth.connect(o.frequency);
      lfo.start(t0);
      lfo.stop(t0 + dur);
    }
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.setValueAtTime(vol, t0 + Math.max(attack, dur * hold));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(out);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
    return o;
  }

  function noise(c, out, { start = 0, dur, vol = 0.4, type = 'bandpass', freq = 1000, q = 1, attack = 0.002 }) {
    const t0 = c.currentTime + start;
    const len = Math.ceil(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const g = c.createGain();
    src.buffer = buf;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter(c, g, type, freq, q));
    g.connect(out);
    src.start(t0);
    src.stop(t0 + dur);
  }

  // Kalabalık iniltisi: "offf" / "ayyy" gibi, formant filtreli birkaç ses.
  function groan(c, out, { start = 0, dur = 1, vol = 0.12, from = 230, drop = 0.7, f1 = 650, f2 = 1050 }) {
    const t0 = c.currentTime + start;
    const mix = c.createGain();
    mix.gain.setValueAtTime(0.0001, t0);
    mix.gain.exponentialRampToValueAtTime(vol, t0 + 0.12);
    mix.gain.setValueAtTime(vol, t0 + dur * 0.45);
    mix.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const a = filter(c, mix, 'bandpass', f1, 5);
    const b = filter(c, mix, 'bandpass', f2, 7);
    a.frequency.setValueAtTime(f1, t0);
    a.frequency.linearRampToValueAtTime(f1 * 0.7, t0 + dur);
    b.frequency.setValueAtTime(f2, t0);
    b.frequency.linearRampToValueAtTime(f2 * 0.75, t0 + dur);
    for (let i = 0; i < 6; i++) {
      const f = from * (0.85 + Math.random() * 0.35);
      const o = c.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f, t0);
      o.frequency.exponentialRampToValueAtTime(f * drop, t0 + dur);
      o.detune.value = (Math.random() - 0.5) * 30;
      o.connect(a);
      o.connect(b);
      o.start(t0 + Math.random() * 0.05);
      o.stop(t0 + dur + 0.05);
    }
    noise(c, mix, { start, dur, vol: 0.5, freq: 1200, q: 0.8, attack: 0.1 });
    mix.connect(out);
  }

  // ---------------- Olay sesleri ----------------

  // Kişi seçerken dönen çarkın tıkırtısı (progress 0..1, sona doğru yavaşlar).
  function tick(progress) {
    const c = audio();
    if (!c) return;
    const out = bus(c, 0.5);
    noise(c, out, { dur: 0.03, vol: 0.5, freq: 2600 - progress * 900, q: 4 });
    tone(c, out, { type: 'triangle', freq: 1400 - progress * 500, dur: 0.04, vol: 0.08, attack: 0.002 });
  }

  function picked() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.25);
    const out = r.connect(bus(c, 0.6));
    [784, 988, 1175].forEach((f, i) => tone(c, out, { freq: f, start: i * 0.06, dur: 0.6, vol: 0.14, hold: 0.1 }));
  }

  function question() {
    const c = audio();
    if (!c) return;
    const out = bus(c, 0.5);
    tone(c, out, { freq: 523, dur: 0.18, vol: 0.12, hold: 0.2 });
    tone(c, out, { freq: 784, start: 0.1, dur: 0.3, vol: 0.12, hold: 0.2 });
  }

  // Şanslı soru: mutlu, parıltılı arp + çan.
  function lucky() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.3);
    const out = r.connect(bus(c, 0.7));
    [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) =>
      tone(c, out, { type: 'triangle', freq: f, start: i * 0.055, dur: 0.5, vol: 0.12, hold: 0.1 }));
    [1047, 1319, 1568].forEach((f) => tone(c, out, { freq: f, start: 0.42, dur: 1.2, vol: 0.08, hold: 0.1 }));
    for (let i = 0; i < 8; i++) {
      tone(c, out, { freq: 2500 + Math.random() * 2500, start: 0.3 + Math.random() * 0.8, dur: 0.12, vol: 0.04 });
    }
  }

  // Şans karesine varış: zıplayan fanfar, alkış ve sevinçli "yeey".
  function chance() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.25);
    const out = r.connect(bus(c, 0.75));
    [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]].forEach(([f, t]) => {
      tone(c, out, { type: 'triangle', freq: f, start: t, dur: 0.16, vol: 0.16, attack: 0.004, hold: 0.3 });
      tone(c, out, { freq: f * 2, start: t, dur: 0.1, vol: 0.03, attack: 0.003 });
    });
    [523, 659, 784, 1047].forEach((f) =>
      tone(c, out, { type: 'triangle', freq: f, start: 0.42, dur: 1.1, vol: 0.09, attack: 0.01, hold: 0.25, vibrato: 4 }));
    [0.42, 0.62, 0.78, 0.94, 1.1].forEach((t) => {
      for (let k = 0; k < 3; k++) noise(c, out, { start: t + k * 0.008, dur: 0.06, vol: 0.22, freq: 1100 + k * 500, q: 1.5 });
    });
    groan(c, out, { start: 0.45, dur: 0.9, vol: 0.06, from: 300, drop: 1.25, f1: 520, f2: 1900 });
    for (let i = 0; i < 10; i++) {
      tone(c, out, { freq: 2600 + Math.random() * 2600, start: 0.45 + Math.random() * 0.9, dur: 0.12, vol: 0.035 });
    }
  }

  function boxOpen() {
    const c = audio();
    if (!c) return;
    const out = bus(c, 0.6);
    noise(c, out, { dur: 0.25, vol: 0.25, type: 'highpass', freq: 3000, attack: 0.05 });
    [988, 1319, 1976].forEach((f, i) => tone(c, out, { type: 'triangle', freq: f, start: 0.05 + i * 0.07, dur: 0.35, vol: 0.12 }));
  }

  function correct() {
    const c = audio();
    if (!c) return;
    const out = bus(c, 0.6);
    tone(c, out, { freq: 880, dur: 0.18, vol: 0.22 });
    tone(c, out, { freq: 1320, start: 0.12, dur: 0.4, vol: 0.22, hold: 0.2 });
  }

  function wrong() {
    const c = audio();
    if (!c) return;
    const out = filter(c, bus(c, 0.5), 'lowpass', 1100);
    tone(c, out, { type: 'square', freq: 196, dur: 0.35, vol: 0.12, hold: 0.5 });
  }

  // Tır ilerlerken: yumuşak, klasik "bir adım ileri" sesi (yükselen marimba + hafif hışırtı).
  function truck() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.18);
    const out = r.connect(bus(c, 0.6));
    noise(c, out, { dur: 0.35, vol: 0.05, freq: 1800, q: 0.7, attack: 0.15 });
    [659, 880, 1319].forEach((f, i) => {
      tone(c, out, { freq: f, start: i * 0.075, dur: 0.32, vol: 0.16, attack: 0.004, hold: 0.05 });
      tone(c, out, { freq: f * 4, start: i * 0.075, dur: 0.08, vol: 0.02, attack: 0.002, hold: 0.05 });
    });
  }

  // Yanlış cevapta tır titrerken: "dı-dınnn".
  function shake() {
    const c = audio();
    if (!c) return;
    const out = filter(c, bus(c, 0.6), 'lowpass', 1600);
    tone(c, out, { type: 'square', freq: 311, dur: 0.14, vol: 0.12, hold: 0.7 });
    tone(c, out, { type: 'square', freq: 233, start: 0.16, dur: 0.6, vol: 0.12, hold: 0.5, vibrato: 6 });
    noise(c, out, { dur: 0.5, vol: 0.08, type: 'lowpass', freq: 180 });
  }

  // Cezaya yaklaşırken tedirgin edici gerilim.
  function tension() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.35);
    const out = r.connect(bus(c, 0.7));
    const lp = filter(c, out, 'lowpass', 700);
    tone(c, lp, { type: 'sawtooth', freq: 55, dur: 1.6, vol: 0.18, attack: 0.5, hold: 0.7 });
    tone(c, lp, { type: 'sawtooth', freq: 77.8, dur: 1.6, vol: 0.12, attack: 0.6, hold: 0.7 });
    tone(c, out, { freq: 880, freqEnd: 932, dur: 1.5, vol: 0.03, attack: 0.6, hold: 0.6 });
    [0.2, 0.42, 0.9, 1.12].forEach((t) => tone(c, out, { freq: 60, freqEnd: 40, start: t, dur: 0.18, vol: 0.35 }));
  }

  // Ceza: kalabalıktan "offf" + geri vites bip sesi.
  function penalty() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.2);
    const out = r.connect(bus(c, 0.9));
    groan(c, out, { dur: 1.1, vol: 0.2, from: 210, drop: 0.62, f1: 600, f2: 1000 });
    [1.15, 1.6].forEach((t) => tone(c, out, { type: 'square', freq: 1050, start: t, dur: 0.22, vol: 0.05, hold: 0.8 }));
  }

  // Nezarethane: demir kapı hızla kayıp çarpar, parmaklıklar titrer, kilit döner;
  // ardından üzgün, inleyen bir kamyon kornası.
  const JAIL_HIT = 0.26;
  function jail() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.6);
    const out = r.connect(bus(c, 0.95));
    for (let t = 0; t < JAIL_HIT; t += 0.016 + Math.random() * 0.01) {
      noise(c, out, { start: t, dur: 0.02, vol: 0.12 + t * 0.6, freq: 1800 + Math.random() * 1600, q: 6 });
    }
    noise(c, out, { dur: JAIL_HIT, vol: 0.25, type: 'highpass', freq: 3000, attack: 0.2 });

    const hit = JAIL_HIT;
    noise(c, out, { start: hit, dur: 0.5, vol: 1, type: 'lowpass', freq: 380 });
    noise(c, out, { start: hit, dur: 0.15, vol: 0.7, type: 'highpass', freq: 1500 });
    tone(c, out, { freq: 70, freqEnd: 32, start: hit, dur: 0.7, vol: 1, attack: 0.002, hold: 0.04 });
    [187, 313, 497, 731, 1063, 1489, 2011, 2687].forEach((f, i) =>
      tone(c, out, { type: 'triangle', freq: f, start: hit, dur: 2.6 - i * 0.22, vol: 0.07, attack: 0.002, hold: 0.02, vibrato: 3 }));
    for (let t = 0.05; t < 0.9; t += 0.035 + t * 0.04) {
      noise(c, out, { start: hit + t, dur: 0.02, vol: 0.35 * (1 - t), freq: 2200 + Math.random() * 1200, q: 8 });
    }

    [1.35, 1.5, 1.72].forEach((t, i) => noise(c, out, { start: t, dur: 0.045, vol: 0.5, freq: i === 2 ? 1300 : 3800, q: 7 }));
    tone(c, out, { freq: 150, freqEnd: 90, start: 1.72, dur: 0.12, vol: 0.35 });

    const horn = filter(c, out, 'lowpass', 1400);
    [[233, 0], [294, 0.006]].forEach(([f, d]) => {
      const o = tone(c, horn, { type: 'sawtooth', freq: f, start: 2.1 + d, dur: 1.9, vol: 0.11, attack: 0.08, hold: 0.55, vibrato: 2 });
      o.frequency.setValueAtTime(f, c.currentTime + 2.1);
      o.frequency.linearRampToValueAtTime(f, c.currentTime + 2.6);
      o.frequency.exponentialRampToValueAtTime(f * 0.72, c.currentTime + 4.0);
    });
    noise(c, out, { start: 3.6, dur: 0.6, vol: 0.06, type: 'highpass', freq: 3500, attack: 0.05 });
  }

  // Gerçekçi ama kısa ve yumuşak polis sireni (~2.6 sn).
  function siren() {
    stopSirenNow();
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.3);
    const master = bus(c, 0.0001);
    const out = r.connect(master);
    const lp = filter(c, out, 'lowpass', 2800);
    const t0 = c.currentTime;
    const total = 2.6;
    const oscs = [['sine', 1, 1], ['triangle', 1.003, 0.6], ['sine', 2, 0.15]].map(([type, m, v]) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      g.gain.value = v;
      o.frequency.setValueAtTime(620 * m, t0);
      o.frequency.linearRampToValueAtTime(1180 * m, t0 + 0.75);
      o.frequency.linearRampToValueAtTime(700 * m, t0 + 1.3);
      o.frequency.linearRampToValueAtTime(1180 * m, t0 + 2.0);
      o.frequency.linearRampToValueAtTime(620 * m, t0 + total);
      o.connect(g);
      g.connect(lp);
      o.start(t0);
      o.stop(t0 + total + 0.1);
      return o;
    });
    master.gain.exponentialRampToValueAtTime(0.075, t0 + 0.3);
    master.gain.setValueAtTime(0.075, t0 + total - 0.6);
    master.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
    stopSiren = () => {
      const t = c.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
      master.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      oscs.forEach((o) => { try { o.stop(t + 0.3); } catch (e) { /* zaten durmuş */ } });
    };
  }

  function stopSirenNow() {
    if (stopSiren) {
      stopSiren();
      stopSiren = null;
    }
  }

  // Konfeti patlaması + zafer fanfarı.
  function victory() {
    const c = audio();
    if (!c) return;
    const r = reverb(c, 0.25);
    const out = r.connect(bus(c, 0.8));
    noise(c, out, { dur: 0.25, vol: 0.6, type: 'highpass', freq: 1800 });
    noise(c, out, { start: 0.12, dur: 0.2, vol: 0.4, type: 'highpass', freq: 2500 });
    const notes = [[523, 0.22], [659, 0.22], [784, 0.22], [1047, 0.4], [784, 0.2], [1047, 1.3]];
    let t = 0.3;
    notes.forEach(([f, d]) => {
      tone(c, out, { type: 'triangle', freq: f, start: t, dur: d + 0.1, vol: 0.24 });
      tone(c, filter(c, out, 'lowpass', 2200), { type: 'sawtooth', freq: f / 2, start: t, dur: d + 0.1, vol: 0.05 });
      t += d;
    });
    [1047, 1319, 1568].forEach((f) => tone(c, out, { freq: f, start: t - 1.3, dur: 1.7, vol: 0.09 }));
    for (let i = 0; i < 10; i++) {
      tone(c, out, { freq: 2000 + Math.random() * 2500, start: 0.3 + Math.random() * 2, dur: 0.15, vol: 0.04 });
    }
  }

  return {
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      localStorage.setItem(KEY, enabled ? 'on' : 'off');
      if (!enabled) stopSirenNow();
      return enabled;
    },
    JAIL_HIT, tick, picked, question, lucky, chance, boxOpen, correct, wrong, truck, shake,
    tension, penalty, jail, siren, stopSiren: stopSirenNow, victory,
  };
})();
