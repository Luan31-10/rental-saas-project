'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';

// ── HOOK: Scroll Reveal ──────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay || '0';
            setTimeout(() => el.classList.add('revealed'), Number(delay));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

// ── HOOK: Counter Animation ──────────────────────────────────────────────────
function useCounterAnimation() {
  const countersStarted = useRef(false);

  useEffect(() => {
    const statsSection = document.querySelector('.stats-section');
    if (!statsSection) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !countersStarted.current) {
          countersStarted.current = true;
          const counters = document.querySelectorAll<HTMLElement>('[data-count]');
          counters.forEach((counter) => {
            const target = counter.dataset.count || '0';
            const suffix = counter.dataset.suffix || '';
            const prefix = counter.dataset.prefix || '';
            const isDecimal = target.includes('.');
            const numTarget = parseFloat(target);
            const duration = 2000;
            const startTime = performance.now();

            const tick = (now: number) => {
              const elapsed = now - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease out cubic
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = numTarget * eased;
              counter.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.floor(current).toLocaleString('vi-VN')) + suffix;
              if (progress < 1) requestAnimationFrame(tick);
              else counter.textContent = prefix + (isDecimal ? numTarget.toFixed(1) : numTarget.toLocaleString('vi-VN')) + suffix;
            };
            requestAnimationFrame(tick);
          });
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(statsSection);
    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useScrollReveal();
  useCounterAnimation();

  // Header scroll
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── THREE.JS BACKGROUND ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x03080f, 0.022);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 8, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x0a1628, 4));
    const dirLight = new THREE.DirectionalLight(0x06b6d4, 2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // ── Grid ──
    const gridSize = 100;
    const gridDivisions = 50;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x06b6d4, 0x071525);
    gridHelper.position.y = -0.01;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.5;
    scene.add(gridHelper);

    // ── Buildings ──
    const buildingGroup = new THREE.Group();
    const buildingData: [number, number, number, number, number, number][] = [
      [-12, -4, 2.5, 2, 7, 0x0ea5e9], [-8, -2, 2, 2, 5, 0x06b6d4],
      [-5, -5, 3, 2.5, 9, 0x3b82f6], [-2, -3, 2, 2, 6, 0x2563eb],
      [1, -5, 3.5, 3, 12, 0x0ea5e9], [5, -3, 2.5, 2, 8, 0x06b6d4],
      [8, -5, 2, 2, 5, 0x3b82f6], [11, -2, 2.5, 2, 7, 0x0284c7],
      [-10, -8, 2, 1.5, 4, 0x2563eb], [-3, -8, 2, 1.5, 4, 0x06b6d4],
      [6, -8, 2, 1.5, 5, 0x0ea5e9], [13, -6, 1.5, 1.5, 3, 0x3b82f6],
      [-14, -6, 1.5, 1.5, 3, 0x0284c7],
    ];

    buildingData.forEach(([bx, bz, bw, bd, floors, litColor]) => {
      const floorH = 0.9;
      const totalH = floors * floorH;
      const buildingGeo = new THREE.BoxGeometry(bw, totalH, bd);
      const building = new THREE.Mesh(buildingGeo, new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.2, metalness: 0.8 }));
      building.position.set(bx, totalH / 2, bz);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(buildingGeo), new THREE.LineBasicMaterial({ color: litColor, transparent: true, opacity: 0.35 }));
      building.add(edges);
      buildingGroup.add(building);

      const winCols = Math.floor(bw / 0.7);
      for (let row = 0; row < floors; row++) {
        for (let col = 0; col < winCols; col++) {
          if (Math.random() < 0.35) continue;
          const isWarm = Math.random() < 0.15;
          const win = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.45), new THREE.MeshBasicMaterial({ color: isWarm ? 0xfcd34d : litColor, transparent: true, opacity: 0.7 + Math.random() * 0.3 }));
          const wx = -(bw / 2) + 0.4 + col * ((bw - 0.4) / Math.max(winCols - 1, 1));
          const wy = 0.5 + row * floorH - totalH / 2 + 0.3;
          win.position.set(bx + wx, wy + totalH / 2, bz + bd / 2 + 0.01);
          buildingGroup.add(win);
        }
      }
    });
    scene.add(buildingGroup);

    // ── ENHANCED PARTICLES: two layers ──
    const createParticleLayer = (count: number, spread: number, size: number, speed: number, blueRatio: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const vel = new Float32Array(count); // individual speeds

      for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * spread;
        pos[i + 1] = Math.random() * 22;
        pos[i + 2] = (Math.random() - 0.5) * spread;
        vel[i / 3] = speed * (0.5 + Math.random());

        const isBlue = Math.random() > (1 - blueRatio);
        if (isBlue) { col[i] = 0.02; col[i + 1] = 0.75; col[i + 2] = 0.95; }
        else if (Math.random() > 0.5) { col[i] = 0.4; col[i + 1] = 0.1; col[i + 2] = 1.0; } // violet
        else { col[i] = 0.05; col[i + 1] = 0.4; col[i + 2] = 1.0; } // deep blue
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

      const points = new THREE.Points(geo, new THREE.PointsMaterial({
        size, vertexColors: true,
        blending: THREE.AdditiveBlending, transparent: true, opacity: 0.75, depthWrite: false,
      }));
      scene.add(points);
      return { geo, vel, speed };
    };

    const layer1 = createParticleLayer(900, 65, 0.18, 22, 0.7);
    const layer2 = createParticleLayer(300, 40, 0.35, 10, 0.5); // larger, slower "stars"

    // ── GLOW ORBS: 3 floating color spheres ──
    const orbData = [
      { color: 0x06b6d4, x: -8, y: 6, z: -5 },
      { color: 0x3b82f6, x: 5, y: 10, z: -8 },
      { color: 0x8b5cf6, x: 12, y: 4, z: -3 },
    ];
    const orbs = orbData.map(({ color, x, y, z }) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.2, 16, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12 })
      );
      mesh.position.set(x, y, z);
      // Glow halo
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(2.5, 16, 16),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.04, side: THREE.BackSide })
      );
      mesh.add(halo);
      scene.add(mesh);
      return mesh;
    });

    let mouseX = 0, mouseY = 0, targetScroll = 0, smoothScroll = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    const handleScroll3D = () => { targetScroll = window.scrollY; };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll3D, { passive: true });

    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      gridHelper.position.z = (time * 15) % (gridSize / gridDivisions);

      const lerpFactor = 1 - Math.exp(-8 * delta);
      smoothScroll += (targetScroll - smoothScroll) * lerpFactor;

      const scrollFactor = smoothScroll * 0.015;
      const targetZ = 28 - scrollFactor;
      const targetY = Math.max(1.5, 8 - smoothScroll * 0.004);
      const targetX = mouseX * 5 + Math.sin(time * 0.5) * 2;

      camera.position.x += (targetX - camera.position.x) * lerpFactor * 1.5;
      camera.position.y += ((targetY + mouseY * 2 + Math.sin(time * 0.3) * 1) - camera.position.y) * lerpFactor * 1.5;
      camera.position.z = targetZ;
      camera.lookAt(0, Math.max(2, 4 - smoothScroll * 0.002), targetZ - 10);

      // Layer 1 particles
      const p1 = layer1.geo.attributes.position.array as Float32Array;
      for (let i = 2; i < p1.length; i += 3) {
        p1[i] += layer1.vel[Math.floor(i / 3)] * delta;
        if (p1[i] > camera.position.z + 5) p1[i] = camera.position.z - 55;
      }
      layer1.geo.attributes.position.needsUpdate = true;

      // Layer 2 particles (drift sideways too)
      const p2 = layer2.geo.attributes.position.array as Float32Array;
      for (let i = 0; i < p2.length; i += 3) {
        p2[i + 2] += layer2.vel[Math.floor(i / 3)] * delta;
        p2[i] += Math.sin(time * 0.3 + i) * 0.005;
        if (p2[i + 2] > camera.position.z + 5) p2[i + 2] = camera.position.z - 45;
      }
      layer2.geo.attributes.position.needsUpdate = true;

      // Animate orbs: float + pulse opacity
      orbs.forEach((orb, i) => {
        orb.position.y = orbData[i].y + Math.sin(time * 0.6 + i * 2) * 1.5;
        const mat = orb.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.10 + Math.sin(time * 1.2 + i) * 0.06;
      });

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const currentMount = mountRef.current;
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll3D);
      cancelAnimationFrame(animId);
      if (currentMount) currentMount.removeChild(renderer.domElement);
      scene.traverse((obj: THREE.Object3D) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m: THREE.Material) => m.dispose());
          else (obj.material as THREE.Material)?.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  const features = [
    { icon: '⚡', accent: '#06b6d4', title: 'Thu tiền tự động', desc: 'Sinh mã VietQR cho từng phòng. Tự động xác nhận và ghi sổ khi tiền vào tài khoản — không cần làm gì thêm.' },
    { icon: '🏢', accent: '#3b82f6', title: 'Đa khu vực', desc: 'Quản lý hàng trăm phòng ở nhiều quận huyện trên một bảng điều khiển duy nhất, trực quan và nhanh.' },
    { icon: '🤖', accent: '#8b5cf6', title: 'Trợ lý AI', desc: 'AI tự động nhắc nợ, soạn hợp đồng, trả lời khách thuê 24/7. Như có thêm một nhân viên không bao giờ nghỉ.' },
    { icon: '📊', accent: '#f59e0b', title: 'Báo cáo thời gian thực', desc: 'Lợi nhuận, tỷ lệ lấp đầy, dòng tiền — cập nhật tức thì. Mọi con số đều trong tầm tay.' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#03080f', color: '#f0f6ff', fontFamily: '"Be Vietnam Pro", "Nunito", sans-serif', overflowX: 'hidden' }}>

      <div ref={mountRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'linear-gradient(to bottom, rgba(3,8,15,0.35) 0%, rgba(3,8,15,0.15) 35%, rgba(3,8,15,0.65) 70%, rgba(3,8,15,0.95) 100%)' }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── SCROLL REVEAL ── */
        .reveal {
          opacity: 0;
          transform: translateY(36px);
          transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1);
        }
        .reveal.revealed { opacity: 1; transform: translateY(0); }
        .reveal-left  { opacity: 0; transform: translateX(-40px); transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1); }
        .reveal-left.revealed  { opacity: 1; transform: translateX(0); }
        .reveal-scale { opacity: 0; transform: scale(0.88); transition: opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1); }
        .reveal-scale.revealed { opacity: 1; transform: scale(1); }

        /* ── BUTTONS ── */
        .btn-primary {
          background: linear-gradient(135deg, #0891b2 0%, #2563eb 100%);
          color: #fff; border: none; padding: 15px 36px; border-radius: 12px;
          font-weight: 700; font-size: 16px; font-family: inherit;
          cursor: pointer; letter-spacing: -0.2px; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 0 30px rgba(8,145,178,0.3), 0 4px 20px rgba(0,0,0,0.4);
          position: relative; overflow: hidden;
        }
        .btn-primary::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0; transition: opacity 0.3s;
        }
        .btn-primary:hover { transform: translateY(-4px) scale(1.03); box-shadow: 0 0 60px rgba(8,145,178,0.55), 0 12px 36px rgba(0,0,0,0.45); }
        .btn-primary:hover::after { opacity: 1; }
        .btn-primary:active { transform: translateY(-1px) scale(1.01); }

        .btn-ghost {
          background: rgba(255,255,255,0.05); color: rgba(240,246,255,0.75);
          border: 1px solid rgba(255,255,255,0.1); padding: 15px 36px; border-radius: 12px;
          font-weight: 600; font-size: 16px; font-family: inherit;
          cursor: pointer; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); backdrop-filter: blur(10px);
          position: relative; overflow: hidden;
        }
        .btn-ghost:hover {
          background: rgba(8,145,178,0.12); border-color: rgba(8,145,178,0.45);
          color: #f0f6ff; transform: translateY(-4px) scale(1.02);
          box-shadow: 0 0 30px rgba(8,145,178,0.2), 0 8px 24px rgba(0,0,0,0.35);
        }

        /* ── BADGE ── */
        .badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(8,145,178,0.1); border: 1px solid rgba(8,145,178,0.25);
          color: #22d3ee; padding: 7px 18px; border-radius: 100px;
          font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;
        }
        .badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #06b6d4; animation: pulse 2s infinite; flex-shrink: 0; }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.7); }
          50% { box-shadow: 0 0 0 6px rgba(6,182,212,0); }
        }

        /* ── TYPOGRAPHY ── */
        .hero-title { font-size: clamp(44px, 6.5vw, 78px); font-weight: 900; line-height: 1.1; letter-spacing: -1.5px; }
        .gradient-text { background: linear-gradient(90deg, #bae6fd 0%, #38bdf8 40%, #06b6d4 80%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .ez-word { background: linear-gradient(90deg, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* ── STAT ITEM ── */
        .stat-item { text-align: center; padding: 0 36px; position: relative; }
        .stat-item::after { content: ''; position: absolute; right: 0; top: 15%; height: 70%; width: 1px; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.07), transparent); }
        .stat-item:last-child::after { display: none; }
        .stat-value { font-size: 44px; font-weight: 900; letter-spacing: -2px; background: linear-gradient(135deg, #e0f2fe, #7dd3fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; min-height: 52px; display: flex; align-items: center; justify-content: center; }

        /* ── FEATURE CARD — enhanced hover ── */
        .feature-card {
          position: relative; background: rgba(7,15,28,0.7); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 36px; transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
          backdrop-filter: blur(20px); overflow: hidden; cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-12px) scale(1.02);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .card-glow { position: absolute; inset: 0; opacity: 0; transition: opacity 0.4s; pointer-events: none; border-radius: 20px; }
        .feature-card:hover .card-glow { opacity: 1; }
        .card-icon-wrap { transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .feature-card:hover .card-icon-wrap { transform: scale(1.15) rotate(-5deg); }

        /* ── LEARN MORE LINK ── */
        .learn-more {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          transition: gap 0.25s, opacity 0.25s;
        }
        .feature-card:hover .learn-more { gap: 10px; opacity: 1 !important; }

        /* ── GLOW BORDER CARD (CTA) ── */
        .glow-border {
          padding: 1.5px; border-radius: 24px;
          background: linear-gradient(135deg, rgba(8,145,178,0.5), rgba(37,99,235,0.2), rgba(124,58,237,0.3));
          transition: background 0.4s;
          display: inline-block; width: 100%;
        }
        .glow-border:hover {
          background: linear-gradient(135deg, rgba(8,145,178,0.8), rgba(37,99,235,0.4), rgba(124,58,237,0.5));
          box-shadow: 0 0 80px rgba(8,145,178,0.25);
        }

        /* ── NAV ── */
        .nav-btn { background: rgba(8,145,178,0.15); border: 1px solid rgba(8,145,178,0.3); color: #22d3ee; padding: 9px 20px; border-radius: 9px; font-weight: 700; font-size: 14px; font-family: inherit; cursor: pointer; transition: all 0.25s; white-space: nowrap; }
        .nav-btn:hover { background: rgba(8,145,178,0.28); box-shadow: 0 0 28px rgba(8,145,178,0.35); transform: translateY(-2px); }
        .nav-link-btn { background: none; border: none; color: rgba(240,246,255,0.55); font-size: 14px; font-weight: 500; font-family: inherit; cursor: pointer; transition: color 0.2s; }
        .nav-link-btn:hover { color: #f0f6ff; }

        .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent); }

        /* ── HERO ENTRY ── */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.75s ease both; }
        .d1 { animation-delay: 0.05s; } .d2 { animation-delay: 0.15s; }
        .d3 { animation-delay: 0.25s; } .d4 { animation-delay: 0.4s; }
        .d5 { animation-delay: 0.55s; }

        /* ── AVATAR PULSE ── */
        @keyframes avatarFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
        .avatar-item { animation: avatarFloat 3s ease-in-out infinite; }
        .avatar-item:nth-child(2){animation-delay:0.3s}
        .avatar-item:nth-child(3){animation-delay:0.6s}
        .avatar-item:nth-child(4){animation-delay:0.9s}
        .avatar-item:nth-child(5){animation-delay:1.2s}

        /* ── FOOTER LINK ── */
        .footer-link { color: rgba(240,246,255,0.3); font-size: 13px; text-decoration: none; transition: color 0.2s; }
        .footer-link:hover { color: rgba(240,246,255,0.7); }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <header style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          width: 'min(calc(100% - 40px), 1080px)', zIndex: 100,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 24px',
          background: scrolled ? 'rgba(3,8,15,0.88)' : 'rgba(3,8,15,0.45)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
          borderRadius: 14, transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
          boxShadow: scrolled ? '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(6,182,212,0.05)' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, color: '#fff', boxShadow: '0 0 20px rgba(6,182,212,0.5)' }}>L</div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.5px' }}>LuanEZ</span>
          </div>
          <nav style={{ display: 'flex', gap: 28 }}>
            {['Tính năng', 'Báo cáo', 'Giá cả'].map(t => (
              <button key={t} className="nav-link-btn">{t}</button>
            ))}
          </nav>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="nav-link-btn" onClick={() => router.push('/login')}>Đăng nhập</button>
            <button className="nav-btn" onClick={() => router.push('/dashboard')}>Dùng thử miễn phí →</button>
          </div>
        </header>

        {/* ── HERO ── */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '140px 5% 80px', textAlign: 'center' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div className="badge fade-up d1" style={{ marginBottom: 28 }}>
              <span className="badge-dot" /> Giải pháp quản lý nhà trọ tại Việt Nam
            </div>
            <h1 className="hero-title fade-up d2" style={{ marginBottom: 24 }}>
              Quản lý phòng trọ<br /> chưa bao giờ <span className="ez-word">EZ</span> đến thế.
            </h1>
            <p className="fade-up d3" style={{ fontSize: 17, color: 'rgba(240,246,255,0.5)', lineHeight: 1.8, maxWidth: 500, margin: '0 auto 44px', fontWeight: 400 }}>
              Tự động hóa thu tiền, hợp đồng, nhắc nợ. Giải phóng bạn khỏi sổ sách để tập trung mở rộng quy mô.
            </p>
            <div className="fade-up d4" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => router.push('/dashboard')}>Bắt đầu miễn phí</button>
              <button className="btn-ghost">▶ Xem demo 2 phút</button>
            </div>
            <div className="fade-up d5" style={{ marginTop: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {['#0891b2', '#2563eb', '#7c3aed', '#db2777', '#d97706'].map((c, i) => (
                  <div key={i} className="avatar-item" style={{ width: 30, height: 30, borderRadius: '50%', background: `linear-gradient(135deg, ${c}, ${c}88)`, border: '2px solid #03080f', marginLeft: i === 0 ? 0 : -9, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                    {['V', 'T', 'L', 'M', 'N'][i]}
                  </div>
                ))}
              </div>
              <span style={{ color: 'rgba(240,246,255,0.45)', fontSize: 14 }}>
                <strong style={{ color: 'rgba(240,246,255,0.8)', fontWeight: 700 }}>2,500+</strong> chủ trọ đang sử dụng
              </span>
              <div>{[1, 2, 3, 4, 5].map(s => <span key={s} style={{ color: '#f59e0b', fontSize: 13 }}>★</span>)}</div>
            </div>
          </div>
        </section>

        {/* ── STATS — counter animation ── */}
        <section className="stats-section" style={{ padding: '20px 5% 80px' }}>
          <div className="reveal reveal-scale" style={{ maxWidth: 960, margin: '0 auto', background: 'rgba(7,15,28,0.65)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '44px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', backdropFilter: 'blur(20px)' }}>
            {[
              { count: '2500', suffix: '+', label: 'Chủ trọ tin dùng' },
              { count: '98', suffix: '%', label: 'Thu tiền đúng hạn' },
              { count: '40', suffix: 'h', label: 'Tiết kiệm / tháng' },
              { count: '0', suffix: 'đ', prefix: '', label: 'Chi phí bắt đầu' },
            ].map((s, i) => (
              <div key={i} className="stat-item">
                <div className="stat-value">
                  <span data-count={s.count} data-suffix={s.suffix} data-prefix={s.prefix || ''}>
                    {s.prefix || ''}{s.count}{s.suffix}
                  </span>
                </div>
                <div style={{ color: 'rgba(240,246,255,0.38)', fontSize: 13, marginTop: 7 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="divider" style={{ margin: '0 5%' }} />

        {/* ── FEATURES — scroll reveal + enhanced hover ── */}
        <section style={{ padding: '90px 5%' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div className="badge reveal" data-delay="0" style={{ marginBottom: 18 }}>Tính năng nổi bật</div>
              <h2 className="reveal" data-delay="100" style={{ fontSize: 'clamp(30px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', lineHeight: 1.15, marginBottom: 14 }}>
                Mọi thứ bạn cần để <span className="gradient-text">làm chủ nhà trọ</span>
              </h2>
              <p className="reveal" data-delay="180" style={{ color: 'rgba(240,246,255,0.4)', fontSize: 15, maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
                Được thiết kế riêng cho thị trường Việt Nam — đơn giản, nhanh và tự động hóa tối đa.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              {features.map((feat, idx) => (
                <div key={idx} className="feature-card reveal" data-delay={`${idx * 100}`}>
                  <div className="card-glow" style={{ background: `radial-gradient(ellipse at 50% 0%, ${feat.accent}22 0%, transparent 65%)` }} />
                  <div className="card-icon-wrap" style={{ width: 52, height: 52, borderRadius: 13, background: `${feat.accent}18`, border: `1px solid ${feat.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 22 }}>
                    {feat.icon}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 10 }}>{feat.title}</h3>
                  <p style={{ color: 'rgba(240,246,255,0.42)', fontSize: 14.5, lineHeight: 1.7 }}>{feat.desc}</p>
                  <div className="learn-more" style={{ marginTop: 24, color: feat.accent, opacity: 0.7 }}>
                    Tìm hiểu thêm <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="divider" style={{ margin: '0 5%' }} />

        {/* ── CTA ── */}
        <section style={{ padding: '100px 5%', textAlign: 'center' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="glow-border reveal reveal-scale">
              <div style={{ background: 'rgba(3,8,15,0.95)', borderRadius: 23, padding: '56px 52px' }}>
                <h2 className="reveal" data-delay="80" style={{ fontSize: 'clamp(32px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.1, marginBottom: 16 }}>
                  Bắt đầu ngay.<br /><span className="gradient-text">Miễn phí mãi mãi.</span>
                </h2>
                <p className="reveal" data-delay="160" style={{ color: 'rgba(240,246,255,0.42)', fontSize: 15, marginBottom: 36, lineHeight: 1.7 }}>
                  Không cần thẻ tín dụng. Không cài đặt phức tạp.<br />Chỉ 5 phút là sẵn sàng quản lý.
                </p>
                <div className="reveal" data-delay="240" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button className="btn-primary" onClick={() => router.push('/dashboard')} style={{ fontSize: 15, padding: '14px 36px' }}>Vào ứng dụng ngay →</button>
                  <button className="btn-ghost" style={{ fontSize: 15, padding: '14px 36px' }}>Liên hệ tư vấn</button>
                </div>
                <p className="reveal" data-delay="320" style={{ color: 'rgba(240,246,255,0.22)', fontSize: 12.5, marginTop: 22 }}>
                  ✓ Miễn phí vĩnh viễn &nbsp;·&nbsp; ✓ Hỗ trợ 24/7 &nbsp;·&nbsp; ✓ Bảo mật dữ liệu 100%
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '36px 5%' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: 'linear-gradient(135deg, #06b6d4, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, color: '#fff' }}>L</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'rgba(240,246,255,0.6)' }}>LuanEZ</span>
            </div>
            <p style={{ color: 'rgba(240,246,255,0.2)', fontSize: 13 }}>© 2026 LuanEZ SaaS · Chế tác bởi Võ Thành Luân</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Điều khoản', 'Bảo mật', 'Hỗ trợ'].map(l => (
                <a key={l} href="#" className="footer-link">{l}</a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}