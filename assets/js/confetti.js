window.LP = window.LP || {};

LP.confetti = function (duration) {
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#ff7a1a', '#f5b301', '#14b8a6', '#e8366b', '#ffffff', '#5b8def'];
  const pieces = [];
  const burst = (x, count) => {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const speed = 7 + Math.random() * 9;
      pieces.push({
        x, y: innerHeight + 10,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed * 1.4,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * Math.PI,
      });
    }
  };
  const rain = (count) => {
    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.5,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
        w: 6 + Math.random() * 6, h: 8 + Math.random() * 10,
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * Math.PI,
      });
    }
  };

  burst(innerWidth * 0.15, 90);
  burst(innerWidth * 0.85, 90);
  rain(120);
  const end = performance.now() + (duration || 6000);
  let refill = 0;

  function frame(now) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    if (now < end - 2000 && now - refill > 400) {
      rain(14);
      refill = now;
    }
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.vy += 0.18;
      p.vx *= 0.99;
      p.vy = Math.min(p.vy, 5.5);
      p.x += p.vx + Math.sin(p.tilt) * 0.6;
      p.y += p.vy;
      p.rot += p.vr;
      p.tilt += 0.05;
      if (p.y > innerHeight + 30) { pieces.splice(i, 1); continue; }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (pieces.length && now < end + 4000) requestAnimationFrame(frame);
    else {
      window.removeEventListener('resize', resize);
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
};
