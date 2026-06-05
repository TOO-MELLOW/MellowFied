/* ═══════════════════════════════════════════════════════════════
   NEW LOADER — JAVASCRIPT  (loader-replacement.js)
   
   In main.js, find and REMOVE this old teardown line (near the very end):
   
     var _l = document.getElementById('page-loader') || document.getElementById('mtLoader');
     if (_l) { _l.style.opacity = '0'; _l.style.pointerEvents = 'none';
       setTimeout(function(){ if(_l.parentNode) _l.parentNode.removeChild(_l); }, 800); }
   
   Then paste this entire block in its place (at the bottom of main.js,
   after the EmailJS contact form section).
══════════════════════════════════════════════════════════════════ */

(function() {
  // ── Hide site until loader completes ─────────────────────────────────────
  document.body.classList.add('mt-hidden');
  // ── Config ─────────────────────────────────────────────────────────────────
  const DURATION = 7000; //  7seconds
  const CX = 260, CY = 260, R = 170; // orbit centre & radius

  const services = [
    { label: 'CV Writing',        icon: '📄', angle: -90  },
    { label: 'Web Dev',           icon: '🌐', angle: -30  },
    { label: 'Assignments',       icon: '📝', angle:  30  },
    { label: 'Tech Support',      icon: '💻', angle:  90  },
    { label: 'Graphic Design',    icon: '🎨', angle:  150 },
    { label: 'Google Digital Setup', icon: '📈', angle:  210 },
  ];

  const svg = document.getElementById('scene');
  const NS = 'http://www.w3.org/2000/svg';

  function deg2rad(d) { return d * Math.PI / 180; }

  // ── Build nodes ────────────────────────────────────────────────────────────
  const nodeGroup = document.getElementById('nodes');
  const connGroup = document.getElementById('connections');
  const partGroup = document.getElementById('particles');
  const nodeEls = [];
  const lineEls = [];

  services.forEach((svc, i) => {
    const rad = deg2rad(svc.angle);
    const nx = CX + R * Math.cos(rad);
    const ny = CY + R * Math.sin(rad);
    svc.x = nx; svc.y = ny;

    // Connection line
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1', CX); line.setAttribute('y1', CY);
    line.setAttribute('x2', nx); line.setAttribute('y2', ny);
    line.setAttribute('stroke', 'url(#line-grad)');
    line.setAttribute('stroke-width', '1.2');
    line.setAttribute('opacity', '0.55');
    const totalLen = Math.hypot(nx-CX, ny-CY);
    line.setAttribute('stroke-dasharray', totalLen);
    line.setAttribute('stroke-dashoffset', totalLen); // hidden initially
    connGroup.appendChild(line);
    lineEls.push({ el: line, len: totalLen });

    // Node group
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('opacity', '0');
    g.setAttribute('transform', `translate(${nx},${ny})`);

    // Glow circle
    const glowC = document.createElementNS(NS, 'circle');
    glowC.setAttribute('r', '28');
    glowC.setAttribute('fill', 'rgba(75,207,250,0.06)');
    glowC.setAttribute('filter', 'url(#glow-node)');
    g.appendChild(glowC);

    // Node background
    const bgC = document.createElementNS(NS, 'circle');
    bgC.setAttribute('r', '24');
    bgC.setAttribute('fill', '#0E1B2E');
    bgC.setAttribute('stroke', 'rgba(75,207,250,0.25)');
    bgC.setAttribute('stroke-width', '1');
    g.appendChild(bgC);

    // Icon (foreignObject for emoji)
    const fo = document.createElementNS(NS, 'foreignObject');
    fo.setAttribute('x', '-16'); fo.setAttribute('y', '-20');
    fo.setAttribute('width', '32'); fo.setAttribute('height', '30');
    const div = document.createElement('div');
    div.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;line-height:1;';
    div.textContent = svc.icon;
    fo.appendChild(div);
    g.appendChild(fo);

    // Label
    const txt = document.createElementNS(NS, 'text');
    txt.setAttribute('y', '38');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-family', "'DM Sans', sans-serif");
    txt.setAttribute('font-size', '9');
    txt.setAttribute('font-weight', '500');
    txt.setAttribute('fill', '#cde8f8');
    txt.setAttribute('letter-spacing', '0.5');
    txt.setAttribute('opacity', '0.8');
    txt.textContent = svc.label.toUpperCase();
    g.appendChild(txt);

    nodeGroup.appendChild(g);
    nodeEls.push({ g, nx, ny, baseX: nx, baseY: ny, floatOffset: Math.random() * Math.PI * 2 });
  });

  // ── Particle pool ──────────────────────────────────────────────────────────
  const MAX_PARTICLES = 70;
  const particles = [];

  function spawnParticle(svcIdx) {
    const svc = services[svcIdx];
    const p = {
      svcIdx,
      t: 0,
      speed: 0.004 + Math.random() * 0.004,
      radius: 2 + Math.random() * 1.5,
      opacity: 0.7 + Math.random() * 0.3,
      toCenter: Math.random() > 0.5,
      el: null
    };
    const el = document.createElementNS(NS, 'circle');
    el.setAttribute('r', p.radius);
    el.setAttribute('fill', p.svcIdx % 2 === 0 ? '#4BCFFA' : '#E8B84B');
    el.setAttribute('opacity', '0');
    partGroup.appendChild(el);
    p.el = el;
    particles.push(p);
    return p;
  }

  function updateParticle(p, now) {
    p.t += p.speed;
    if (p.t >= 1) {
      p.t = 0;
      p.toCenter = !p.toCenter;
      p.opacity = 0.7 + Math.random() * 0.3;
    }
    const svc = services[p.svcIdx];
    let t = p.toCenter ? p.t : 1 - p.t;
    const px = CX + (svc.x - CX) * (1 - t);
    const py = CY + (svc.y - CY) * (1 - t);
    p.el.setAttribute('cx', px);
    p.el.setAttribute('cy', py);
    p.el.setAttribute('opacity', Math.sin(p.t * Math.PI) * p.opacity);
  }

  // ── Pulse rings ────────────────────────────────────────────────────────────
  const rings = document.querySelectorAll('.ring');
  let lastRingTime = 0;
  const RING_INTERVAL = 1500;
  let ringPhase = 0;

  function pulseRings(now) {
    if (now - lastRingTime > RING_INTERVAL) {
      lastRingTime = now;
      ringPhase = 0;
    }
    const elapsed = now - lastRingTime;
    rings.forEach((ring, i) => {
      const delay = i * 400;
      const t = Math.max(0, (elapsed - delay) / 1800);
      const op = t < 0.3 ? t/0.3 * 0.35 : (1-t) * 0.35;
      ring.setAttribute('opacity', op > 0 ? op : 0);
    });
  }

  // ── Logo pulse ─────────────────────────────────────────────────────────────
  const logoGroup = document.getElementById('logo-group');
  function pulseLogo(now) {
    const scale = 1 + 0.025 * Math.sin(now / 900);
    logoGroup.setAttribute('transform', `translate(${CX},${CY}) scale(${scale}) translate(${-CX},${-CY})`);
  }

  // ── Progress & line draw ───────────────────────────────────────────────────
  const bar = document.getElementById('progress-bar');
  const pctEl = document.getElementById('pct');
  let startTime = null;
  let particleSpawnCount = 0;

  // Faster version (starts drawing sooner):
const LINE_STARTS = [0.02, 0.08, 0.14, 0.20, 0.26, 0.32];

  function ease(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }

  // ── Main RAF loop ──────────────────────────────────────────────────────────
  function frame(now) {
    if (!startTime) startTime = now;
    const elapsed = now - startTime;
    const rawProgress = Math.min(elapsed / DURATION, 1);
    const progress = ease(rawProgress);

    // Progress bar
    bar.style.width = (rawProgress * 100) + '%';
    pctEl.textContent = Math.floor(rawProgress * 100) + '%';

    // Draw lines
    lineEls.forEach((ln, i) => {
      const lineStart = LINE_STARTS[i];
      const lineP = Math.max(0, Math.min(1, (rawProgress - lineStart) / (0.9 - lineStart)));
      const offset = ln.len * (1 - lineP);
      ln.el.setAttribute('stroke-dashoffset', offset);
    });

    // Reveal nodes
    nodeEls.forEach((n, i) => {
      const revealAt = LINE_STARTS[i] + 0.20;
      const revealP = Math.max(0, Math.min(1, (rawProgress - revealAt) / 0.08));
      n.g.setAttribute('opacity', revealP);

      // Float animation
      const floatAmp = 4 * revealP;
      const fx = n.baseX + floatAmp * Math.cos(now / 1800 + n.floatOffset);
      const fy = n.baseY + floatAmp * Math.sin(now / 1400 + n.floatOffset);
      n.g.setAttribute('transform', `translate(${fx},${fy})`);
    });

    // Spawn particles (only after 20% and when lines are being drawn)
    if (rawProgress > 0.2 && particles.length < MAX_PARTICLES && particleSpawnCount < 3000) {
      const svcIdx = Math.floor(Math.random() * 6);
      if (rawProgress > LINE_STARTS[svcIdx] + 0.2) {
        spawnParticle(svcIdx);
        particleSpawnCount++;
      }
    }
    particles.forEach(p => updateParticle(p, now));

    // Pulse rings & logo
    pulseRings(now);
    pulseLogo(now);

    if (rawProgress < 1) {
      requestAnimationFrame(frame);
    } else {
      // Done
      setTimeout(() => {
        document.getElementById('loader').classList.add('done');
        document.body.classList.remove('mt-hidden');
        document.body.classList.add('mt-reveal');
        setTimeout(function(){
          var ldr = document.getElementById('loader');
          if(ldr && ldr.parentNode) ldr.parentNode.removeChild(ldr);
          document.body.classList.remove('mt-reveal');
        }, 900);
      }, 400);
    }
  }

  requestAnimationFrame(frame);

})();
