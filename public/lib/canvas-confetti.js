// Simple and lightweight canvas confetti celebration library
(function() {
  function createConfetti() {
    let canvas = document.getElementById('confetti-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'confetti-canvas';
      canvas.style.position = 'fixed';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.width = '100vw';
      canvas.style.height = '100vh';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#fbbf24'];
    let particles = [];

    function addParticles(count = 80) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: width * (0.2 + Math.random() * 0.6),
          y: height * 0.4 + (Math.random() - 0.5) * 50,
          vx: (Math.random() - 0.5) * 16,
          vy: -Math.random() * 18 - 8,
          gravity: 0.35 + Math.random() * 0.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 12 + 6,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          opacity: 1,
          decay: 0.006 + Math.random() * 0.008
        });
      }
    }

    let isRunning = false;

    function loop() {
      if (!isRunning && particles.length === 0) {
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.rotation += p.rotSpeed;
        p.opacity -= p.decay;

        if (p.opacity <= 0 || p.y > height + 20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      requestAnimationFrame(loop);
    }

    window.triggerConfetti = function(count = 100) {
      addParticles(count);
      if (!isRunning) {
        isRunning = true;
        loop();
        setTimeout(() => { isRunning = false; }, 4000);
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createConfetti);
  } else {
    createConfetti();
  }
})();
