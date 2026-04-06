"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ── TYPES ────────────────────────────────────────────────────────────────────
interface Feature {
  icon: string;
  num: string;
  title: string;
  desc: string;
  bg: string;
}

interface PricePlan {
  plan: string;
  amount: string;
  period: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

// ── HOOKS ────────────────────────────────────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(
      ".reveal, .reveal-left, .reveal-scale",
    );
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).classList.add("visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function useNavScroll() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function useCounterAnimation(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        const counters =
          ref.current!.querySelectorAll<HTMLElement>("[data-count]");
        counters.forEach((el) => {
          const target = Number(el.dataset.count ?? 0);
          const suffix = el.dataset.suffix ?? "";
          const dur = 1800;
          const start = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent =
              Math.floor(target * eased).toLocaleString("vi-VN") + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target.toLocaleString("vi-VN") + suffix;
          };
          requestAnimationFrame(tick);
        });
        obs.disconnect();
      },
      { threshold: 0.5 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
}

function useBarAnimation(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        ref.current!.querySelectorAll<HTMLElement>(".bar-fill").forEach((b) => {
          b.style.width = (b.dataset.w ?? "0") + "%";
        });
        obs.disconnect();
      },
      { threshold: 0.5 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref]);
}

function useCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mx = -100,
      my = -100,
      rx = -100,
      ry = -100;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    document.addEventListener("mousemove", onMove, { passive: true });

    const animate = () => {
      if (dotRef.current) {
        dotRef.current.style.left = mx + "px";
        dotRef.current.style.top = my + "px";
      }
      rx += (mx - rx) * 0.14;
      ry += (my - ry) * 0.14;
      if (ringRef.current) {
        ringRef.current.style.left = rx + "px";
        ringRef.current.style.top = ry + "px";
      }
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return { dotRef, ringRef };
}

// ── DATA ─────────────────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    icon: "⚡",
    num: "01",
    bg: "#ccfbf1",
    title: "Thu tiền tự động",
    desc: "Sinh mã VietQR riêng cho từng phòng. Khi tiền về tài khoản, hệ thống tự động xác nhận, ghi sổ và gửi biên lai — không cần làm gì thêm.",
  },
  {
    icon: "🏢",
    num: "02",
    bg: "#dbeafe",
    title: "Đa khu vực, một bảng điều khiển",
    desc: "Quản lý hàng trăm phòng trải dài nhiều quận huyện trên một giao diện duy nhất. Trực quan, nhanh chóng, không bao giờ bị lạc trong mớ sổ sách.",
  },
  {
    icon: "🤖",
    num: "03",
    bg: "#ede9fe",
    title: "Trợ lý AI không bao giờ nghỉ",
    desc: "AI tự động nhắc nợ, soạn hợp đồng, trả lời khách thuê bất cứ lúc nào. Như có thêm một nhân viên chăm chỉ làm việc 24/7 không cần lương.",
  },
  {
    icon: "📊",
    num: "04",
    bg: "#fef9c3",
    title: "Báo cáo tức thì",
    desc: "Lợi nhuận, tỷ lệ lấp đầy, dòng tiền — cập nhật ngay khi có giao dịch mới. Mọi con số đều trong tầm tay, mọi lúc mọi nơi.",
  },
];

const PLANS: PricePlan[] = [
  {
    plan: "Miễn phí",
    amount: "0đ",
    period: "Mãi mãi",
    features: [
      "Tối đa 10 phòng",
      "Thu tiền thủ công",
      "Báo cáo cơ bản",
      "Hỗ trợ email",
    ],
    cta: "Bắt đầu ngay",
  },
  {
    plan: "Chuyên nghiệp",
    amount: "299k",
    period: "/ tháng",
    features: [
      "Không giới hạn phòng",
      "Thu tiền tự động VietQR",
      "Trợ lý AI",
      "Báo cáo nâng cao",
      "Hỗ trợ 24/7",
    ],
    cta: "Dùng thử 14 ngày miễn phí",
    featured: true,
  },
  {
    plan: "Doanh nghiệp",
    amount: "999k",
    period: "/ tháng",
    features: [
      "Nhiều tài khoản",
      "API tích hợp",
      "Tùy chỉnh theo yêu cầu",
      "Dedicated support",
    ],
    cta: "Liên hệ tư vấn",
  },
];

const MARQUEE_ITEMS = [
  "Thu tiền tự động",
  "Hợp đồng thông minh",
  "Trợ lý AI 24/7",
  "Báo cáo thời gian thực",
  "VietQR tích hợp",
  "Quản lý đa khu vực",
];

// ── GLOBAL STYLES (injected once) ────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

:root {
  --ink: #0b0f0e; --ink2: #2e3532; --ink3: #6b7570;
  --paper: #f5f0e8; --paper2: #ede7d8; --paper3: #e2dace;
  --teal: #0d9488; --teal-lt: #ccfbf1;
  --amber: #d97706;
  --serif: "DM Serif Display", Georgia, serif;
  --sans: "DM Sans", system-ui, sans-serif;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}

html { scroll-behavior: smooth; }

body {
  font-family: var(--sans);
  background: var(--paper);
  color: var(--ink);
  overflow-x: hidden;
  cursor: none;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: var(--paper2); }
::-webkit-scrollbar-thumb { background: var(--teal); border-radius: 2px; }

/* Noise overlay */
body::after {
  content: '';
  position: fixed; inset: 0; z-index: 9997; pointer-events: none;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Cursor */
.cursor-dot {
  position: fixed; top: 0; left: 0; z-index: 9999;
  width: 8px; height: 8px; background: var(--teal); border-radius: 50%;
  pointer-events: none; transform: translate(-50%, -50%);
  transition: background 0.2s;
}
.cursor-ring {
  position: fixed; top: 0; left: 0; z-index: 9998;
  width: 36px; height: 36px;
  border: 1.5px solid var(--teal); border-radius: 50%;
  pointer-events: none; transform: translate(-50%, -50%);
  transition: width 0.25s var(--ease-out), height 0.25s var(--ease-out), opacity 0.25s;
  opacity: 0.5;
}

/* Scroll reveal */
.reveal {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out);
}
.reveal.visible { opacity: 1; transform: none; }
.reveal-scale {
  opacity: 0; transform: scale(0.94);
  transition: opacity 0.8s var(--ease-out), transform 0.8s var(--ease-out);
}
.reveal-scale.visible { opacity: 1; transform: scale(1); }

/* Hero circle */
@keyframes slowRotate { to { transform: rotate(360deg); } }
.hero-circle { animation: slowRotate 60s linear infinite; }

/* Hero card float */
@keyframes floatCard { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
.float-card { animation: floatCard 5s ease-in-out infinite; }

/* Pill floats */
@keyframes floatP1 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes floatP2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
.pill-p1 { animation: floatP1 4s 0.5s ease-in-out infinite; }
.pill-p2 { animation: floatP2 4.5s 1s ease-in-out infinite; }

/* Bar fill transition */
.bar-fill { height: 100%; background: var(--teal); border-radius: 3px; transition: width 1.5s var(--ease-out); width: 0; }

/* Marquee */
@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
.marquee-track { animation: marquee 22s linear infinite; }

/* Avatar float */
@keyframes avatarFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }

/* CTA pulse rings */
@keyframes pulseRing {
  0%,100%{opacity:0.5; transform:translate(-50%,-50%) scale(1)}
  50%{opacity:0.2; transform:translate(-50%,-50%) scale(1.05)}
}

/* Feature card hover */
.feat-item { transition: background 0.3s, border-color 0.3s, transform 0.3s var(--ease-spring), box-shadow 0.3s; cursor: none; }
.feat-item:hover { background: white; border-color: var(--paper3); transform: translateX(6px); box-shadow: 0 10px 40px rgba(11,15,14,0.07); }
.feat-item:hover .feat-icon-wrap { transform: scale(1.15) rotate(-5deg); }
.feat-icon-wrap { transition: transform 0.3s var(--ease-spring); }

/* Step card hover */
.step-card { transition: background 0.3s, box-shadow 0.3s; cursor: none; }
.step-card:hover { background: white; box-shadow: 0 8px 32px rgba(11,15,14,0.06); }
.step-card:hover .step-num { background: var(--teal); border-color: var(--teal); color: white; }
.step-num { transition: background 0.3s, border-color 0.3s, color 0.3s; }

/* Price card hover */
.price-card { transition: transform 0.3s var(--ease-spring), box-shadow 0.3s; cursor: none; }
.price-card:hover { transform: translateY(-8px); box-shadow: 0 24px 60px rgba(11,15,14,0.1); }
.price-card.featured { transform: scale(1.04); }
.price-card.featured:hover { transform: scale(1.04) translateY(-8px); }

/* Button transitions */
.btn-primary { transition: transform 0.25s var(--ease-spring), box-shadow 0.25s; }
.btn-primary:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 12px 40px rgba(11,15,14,0.25); }
.btn-solid { transition: background 0.2s, transform 0.2s var(--ease-spring); cursor: none; }
.btn-solid:hover { background: #2e3532; transform: scale(1.04); }
.btn-outline { transition: border-color 0.2s; cursor: none; }
.btn-outline:hover { border-color: var(--ink); }
.btn-ghost { transition: color 0.2s, text-decoration-color 0.2s; cursor: none; }
.btn-ghost:hover { color: var(--ink); text-decoration-color: rgba(107,117,112,0.5); }
.btn-price { transition: background 0.2s, transform 0.2s var(--ease-spring); }
.btn-price:hover { background: var(--paper); transform: scale(1.02); }
.btn-feat { transition: background 0.2s; }
.btn-feat:hover { background: #0b8078 !important; }

/* Nav link */
.nav-link { transition: color 0.2s; cursor: none; }
.nav-link:hover { color: var(--ink); }

/* Footer link */
.footer-link { transition: color 0.2s; cursor: none; }
.footer-link:hover { color: #f5f0e8; }

/* Pulse dot */
@keyframes pulseDot {
  0%,100%{box-shadow:0 0 0 0 rgba(13,148,136,0.7)}
  50%{box-shadow:0 0 0 6px rgba(13,148,136,0)}
}

@media (max-width: 960px) {
  body { cursor: auto; }
  .cursor-dot, .cursor-ring { display: none; }
  .hero-grid { grid-template-columns: 1fr !important; }
  .features-grid-wrap { grid-template-columns: 1fr !important; }
  .features-sticky { position: static !important; }
  .steps-grid { grid-template-columns: 1fr !important; max-width: 420px !important; }
  .steps-line { display: none !important; }
  .pricing-grid { grid-template-columns: 1fr !important; max-width: 380px !important; }
  .price-card.featured { transform: none !important; }
  .price-card.featured:hover { transform: translateY(-8px) !important; }
  .footer-grid { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 600px) {
  .nav-links-wrap { display: none !important; }
  .footer-grid { grid-template-columns: 1fr !important; }
}
`;

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const scrolled = useNavScroll();
  const { dotRef, ringRef } = useCursor();
  const trustRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useScrollReveal();
  useCounterAnimation(trustRef);
  useBarAnimation(barsRef);

  // inject global styles once
  useEffect(() => {
    const id = "landing-global-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <>
      {/* Custom cursor */}
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: scrolled ? "14px 5%" : "22px 5%",
          background: scrolled ? "rgba(245,240,232,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: `1px solid ${scrolled ? "#e2dace" : "transparent"}`,
          transition: "all 0.4s cubic-bezier(0.22,1,0.36,1)",
          boxShadow: scrolled ? "0 2px 20px rgba(11,15,14,0.06)" : "none",
        }}
      >
        <a
          href="#"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            cursor: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              background: "#0b0f0e",
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--serif)",
              fontSize: 20,
              color: "#f5f0e8",
              fontStyle: "italic",
            }}
          >
            L
          </div>
          <span
            style={{
              fontFamily: "var(--serif)",
              fontSize: 22,
              color: "#0b0f0e",
              letterSpacing: "-0.5px",
            }}
          >
            LuanEZ
          </span>
        </a>

        <ul
          className="nav-links-wrap"
          style={{ display: "flex", gap: 32, listStyle: "none" }}
        >
          {["Tính năng", "Cách dùng", "Giá cả"].map((t, i) => (
            <li key={t}>
              <a
                href={["#features", "#workflow", "#pricing"][i]}
                className="nav-link"
                style={{
                  fontSize: 14,
                  color: "#6b7570",
                  textDecoration: "none",
                  fontWeight: 400,
                }}
              >
                {t}
              </a>
            </li>
          ))}
        </ul>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="btn-outline"
            onClick={() => router.push("/login")}
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 500,
              color: "#0b0f0e",
              background: "transparent",
              border: "1px solid #6b7570",
              borderRadius: 100,
              padding: "9px 22px",
            }}
          >
            Đăng nhập
          </button>
          <button
            className="btn-solid"
            onClick={() => router.push("/login")}
            style={{
              fontFamily: "var(--sans)",
              fontSize: 14,
              fontWeight: 500,
              color: "#f5f0e8",
              background: "#0b0f0e",
              border: "1px solid #0b0f0e",
              borderRadius: 100,
              padding: "9px 22px",
            }}
          >
            Thử miễn phí →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        className="hero-grid"
        style={{
          minHeight: "100vh",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          alignItems: "center",
          padding: "100px 5% 60px",
          gap: 60,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative ring */}
        <div
          className="hero-circle"
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            border: "1px solid #e2dace",
            top: -150,
            right: -200,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 40,
              borderRadius: "50%",
              border: "1px solid #e2dace",
            }}
          />
        </div>

        {/* Left */}
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#0d9488",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 32,
                height: 1,
                background: "#0d9488",
                display: "block",
              }}
            />
            Giải pháp quản lý nhà trọ Việt Nam
          </div>

          <h1
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(52px, 6vw, 84px)",
              lineHeight: 1.0,
              letterSpacing: "-1px",
              marginBottom: 28,
            }}
          >
            Quản lý
            <br />
            nhà trọ —<br />
            <em style={{ fontStyle: "italic", color: "#0d9488" }}>đơn giản</em>
            <br />
            như EZ.
          </h1>

          <p
            style={{
              fontSize: 17,
              color: "#6b7570",
              lineHeight: 1.75,
              maxWidth: 440,
              marginBottom: 44,
              fontWeight: 300,
            }}
          >
            Tự động hóa thu tiền, hợp đồng, nhắc nợ. Trợ lý AI làm việc 24/7 để
            bạn tập trung mở rộng quy mô thay vì xử lý sổ sách.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard")}
              style={{
                fontFamily: "var(--sans)",
                fontSize: 16,
                fontWeight: 500,
                color: "#f5f0e8",
                background: "#0b0f0e",
                border: "none",
                borderRadius: 14,
                padding: "16px 36px",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 4px 24px rgba(11,15,14,0.18)",
              }}
            >
              Bắt đầu miễn phí
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="btn-ghost"
              style={{
                fontFamily: "var(--sans)",
                fontSize: 15,
                color: "#6b7570",
                background: "none",
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "underline",
                textDecorationColor: "transparent",
                textUnderlineOffset: 4,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="8"
                  r="6.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path d="M6.5 5.5 11 8l-4.5 2.5V5.5Z" fill="currentColor" />
              </svg>
              Xem demo 2 phút
            </button>
          </div>

          {/* Social proof avatars */}
          <div
            style={{
              marginTop: 44,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex" }}>
              {["#0891b2", "#2563eb", "#7c3aed", "#db2777", "#d97706"].map(
                (c, i) => (
                  <div
                    key={i}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}, ${c}88)`,
                      border: "2px solid #f5f0e8",
                      marginLeft: i === 0 ? 0 : -9,
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11,
                      color: "white",
                      fontWeight: 700,
                      animation: `avatarFloat 3s ${i * 0.3}s ease-in-out infinite`,
                    }}
                  >
                    {["V", "T", "L", "M", "N"][i]}
                  </div>
                ),
              )}
            </div>
            <span style={{ fontSize: 14, color: "#6b7570" }}>
              <strong style={{ color: "#0b0f0e" }}>2.500+</strong> chủ trọ đang
              dùng
            </span>
            <span style={{ color: "#d97706", fontSize: 13 }}>★★★★★</span>
          </div>
        </div>

        {/* Right — Dashboard card */}
        <div style={{ position: "relative" }}>
          <div
            className="float-card"
            style={{
              background: "white",
              border: "1px solid #e2dace",
              borderRadius: 24,
              padding: 28,
              boxShadow: "0 20px 60px rgba(11,15,14,0.08)",
              position: "relative",
              zIndex: 2,
            }}
          >
            {/* Card header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 22,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: "#ccfbf1",
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 18,
                  }}
                >
                  🏢
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    Bảng điều khiển
                  </div>
                  <div style={{ fontSize: 13, color: "#6b7570" }}>
                    Tháng 4, 2026
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "#0d9488",
                  background: "#ccfbf1",
                  padding: "4px 10px",
                  borderRadius: 100,
                }}
              >
                ● Trực tiếp
              </span>
            </div>

            {/* Metrics */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 14,
                marginBottom: 22,
              }}
            >
              {[
                { label: "Doanh thu", val: "48", unit: "tr" },
                { label: "Phòng trống", val: "3", unit: "" },
                { label: "Thu hôm nay", val: "6", unit: "tr" },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: "#f5f0e8",
                    borderRadius: 14,
                    padding: "14px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7570",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--serif)",
                      fontSize: 28,
                      lineHeight: 1,
                    }}
                  >
                    {m.val}
                    <span style={{ fontSize: 14, fontFamily: "var(--sans)" }}>
                      {m.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bar chart */}
            <div
              ref={barsRef}
              style={{ display: "flex", flexDirection: "column", gap: 10 }}
            >
              {[
                { label: "Phòng A", w: "92", pct: "92%" },
                { label: "Phòng B", w: "78", pct: "78%" },
                { label: "Phòng C", w: "100", pct: "100%" },
              ].map((b) => (
                <div
                  key={b.label}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "#6b7570",
                      width: 60,
                      flexShrink: 0,
                    }}
                  >
                    {b.label}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "#e2dace",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div className="bar-fill" data-w={b.w} />
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      width: 36,
                      textAlign: "right",
                    }}
                  >
                    {b.pct}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Floating pills */}
          <div
            className="pill-p1"
            style={{
              position: "absolute",
              bottom: -20,
              left: -30,
              background: "white",
              border: "1px solid #e2dace",
              borderRadius: 100,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "0 8px 24px rgba(11,15,14,0.1)",
              whiteSpace: "nowrap",
              zIndex: 3,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#0d9488",
                animation: "pulseDot 2s infinite",
                flexShrink: 0,
              }}
            />
            ✓ Thu tiền tự động
          </div>
          <div
            className="pill-p2"
            style={{
              position: "absolute",
              top: 20,
              right: -24,
              background: "white",
              border: "1px solid #e2dace",
              borderRadius: 100,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 9,
              fontSize: 13,
              fontWeight: 500,
              boxShadow: "0 8px 24px rgba(11,15,14,0.1)",
              whiteSpace: "nowrap",
              zIndex: 3,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#d97706",
                flexShrink: 0,
              }}
            />
            AI đang nhắc 3 phòng
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div
        ref={trustRef}
        style={{
          background: "#0b0f0e",
          padding: "18px 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: "rgba(245,240,232,0.4)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          Đang được tin dùng bởi
        </span>
        <div style={{ display: "flex", gap: 48 }}>
          {[
            { count: "2500", suffix: "+", label: "Chủ trọ" },
            { count: "98", suffix: "%", label: "Thu đúng hạn" },
            { count: "40", suffix: "h", label: "Tiết kiệm/tháng" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 30,
                  color: "#f5f0e8",
                }}
              >
                <span data-count={s.count} data-suffix={s.suffix}>
                  {s.count}
                  {s.suffix}
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(245,240,232,0.4)",
                  marginTop: 2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#d97706", fontSize: 16 }}>★★★★★</span>
          <span style={{ color: "rgba(245,240,232,0.4)", fontSize: 13 }}>
            4.9 / 5 sao
          </span>
        </div>
      </div>

      {/* ── MARQUEE ── */}
      <div
        style={{
          padding: "28px 0",
          overflow: "hidden",
          borderTop: "1px solid #e2dace",
          borderBottom: "1px solid #e2dace",
          background: "#ede7d8",
        }}
      >
        <div
          className="marquee-track"
          style={{ display: "flex", gap: 60, width: "max-content" }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--serif)",
                fontSize: 22,
                color: "#6b7570",
                whiteSpace: "nowrap",
                fontStyle: "italic",
                display: "inline-flex",
                alignItems: "center",
                gap: 24,
              }}
            >
              {item}
              <span style={{ color: "#0d9488" }}>·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="features-grid-wrap"
        style={{
          padding: "120px 5%",
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 80,
          alignItems: "start",
        }}
      >
        <div
          className="features-sticky"
          style={{ position: "sticky", top: 120 }}
        >
          <div
            className="reveal"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#0d9488",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            Tính năng
            <span
              style={{
                flex: 1,
                height: 1,
                background: "#e2dace",
                maxWidth: 60,
              }}
            />
          </div>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(36px, 3.5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              marginBottom: 20,
              transitionDelay: "0.1s",
            }}
          >
            Mọi thứ để
            <br />
            <em style={{ fontStyle: "italic", color: "#6b7570" }}>làm chủ</em>
            <br />
            nhà trọ của bạn
          </h2>
          <p
            className="reveal"
            style={{
              fontSize: 15,
              color: "#6b7570",
              lineHeight: 1.75,
              fontWeight: 300,
              transitionDelay: "0.2s",
            }}
          >
            Được thiết kế riêng cho thị trường Việt Nam — đơn giản, nhanh, và tự
            động hóa tối đa để bạn giải phóng hoàn toàn khỏi công việc lặp lại.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.num}
              className={`feat-item reveal`}
              style={{
                borderRadius: 18,
                padding: "28px 32px",
                border: "1px solid transparent",
                transitionDelay: `${i * 0.07}s`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 14,
                }}
              >
                <div
                  className="feat-icon-wrap"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: f.bg,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>
                <span
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 13,
                    color: "#6b7570",
                    fontStyle: "italic",
                  }}
                >
                  {f.num}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 9 }}>
                {f.title}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7570",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section id="workflow" style={{ padding: "120px 5%" }}>
        <div style={{ textAlign: "center", marginBottom: 80 }}>
          <div
            className="reveal"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#0d9488",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            Cách dùng
          </div>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(38px, 4vw, 56px)",
              lineHeight: 1.1,
              letterSpacing: "-0.5px",
              marginBottom: 18,
              transitionDelay: "0.1s",
            }}
          >
            Bắt đầu trong 5 phút
          </h2>
          <p
            className="reveal"
            style={{
              fontSize: 16,
              color: "#6b7570",
              fontWeight: 300,
              maxWidth: 460,
              margin: "0 auto",
              lineHeight: 1.7,
              transitionDelay: "0.2s",
            }}
          >
            Không cần cài đặt phức tạp. Không cần thẻ tín dụng. Ba bước đơn
            giản.
          </p>
        </div>

        <div
          className="steps-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            maxWidth: 960,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            className="steps-line"
            style={{
              position: "absolute",
              top: 38,
              left: "15%",
              right: "15%",
              height: 1,
              background:
                "linear-gradient(90deg, transparent, #e2dace 20%, #e2dace 80%, transparent)",
              pointerEvents: "none",
            }}
          />
          {[
            {
              n: "1",
              title: "Tạo tài khoản",
              desc: "Đăng ký miễn phí trong 30 giây. Không cần thông tin thẻ, không cần cài đặt bất kỳ thứ gì.",
            },
            {
              n: "2",
              title: "Thêm phòng & khách",
              desc: "Nhập thông tin phòng trọ và khách thuê. Hệ thống tự tạo hợp đồng và mã VietQR cho từng phòng.",
            },
            {
              n: "3",
              title: "Thu tiền tự động",
              desc: "Hệ thống nhắc nợ, xác nhận thanh toán và ghi sổ tự động. Bạn chỉ cần kiểm tra báo cáo.",
            },
          ].map((s, i) => (
            <div
              key={s.n}
              className={`step-card reveal`}
              style={{
                borderRadius: 20,
                padding: "32px 28px",
                transitionDelay: `${i * 0.1 + 0.1}s`,
              }}
            >
              <div
                className="step-num"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  border: "1px solid #e2dace",
                  background: "#f5f0e8",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--serif)",
                  fontSize: 20,
                  margin: "0 auto 24px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {s.n}
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  marginBottom: 10,
                  textAlign: "center",
                }}
              >
                {s.title}
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7570",
                  lineHeight: 1.65,
                  textAlign: "center",
                  fontWeight: 300,
                }}
              >
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section
        style={{
          background: "#0b0f0e",
          padding: "100px 5%",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "5%",
            top: "50%",
            transform: "translateY(-50%)",
            fontFamily: "var(--serif)",
            fontSize: 320,
            color: "rgba(255,255,255,0.03)",
            lineHeight: 1,
            pointerEvents: "none",
            fontStyle: "italic",
            userSelect: "none",
          }}
        >
        
        </div>
        <div style={{ maxWidth: 820 }}>
          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 80,
              color: "#0d9488",
              lineHeight: 0.5,
              marginBottom: 28,
            }}
          >
            
          </div>
          <p
            className="reveal"
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(26px, 3vw, 38px)",
              color: "#f5f0e8",
              lineHeight: 1.35,
              letterSpacing: "-0.3px",
              marginBottom: 36,
            }}
          >
            Trước kia tôi mất cả buổi sáng chủ nhật để đi thu tiền. Bây giờ{" "}
            <em style={{ fontStyle: "italic", color: "#0d9488" }}>
              LuanEZ làm hết
            </em>{" "}
            — tôi chỉ nhận thông báo khi tiền vào tài khoản.
          </p>
          <div
            className="reveal"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              transitionDelay: "0.15s",
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #0d9488, #2563eb)",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: 16,
                color: "white",
              }}
            >
              VT
            </div>
            <div>
              <div style={{ fontSize: 15, color: "#f5f0e8", fontWeight: 500 }}>
                Võ Thanh Tùng
              </div>
              <div style={{ fontSize: 13, color: "rgba(245,240,232,0.4)" }}>
                Chủ 24 phòng trọ tại Bình Dương
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "120px 5%" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            className="reveal"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#0d9488",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            Giá cả
          </div>
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(38px, 4vw, 54px)",
              letterSpacing: "-0.5px",
              marginBottom: 16,
              transitionDelay: "0.1s",
            }}
          >
            Minh bạch, không ẩn phí
          </h2>
          <p
            className="reveal"
            style={{
              fontSize: 16,
              color: "#6b7570",
              fontWeight: 300,
              transitionDelay: "0.2s",
            }}
          >
            Bắt đầu miễn phí mãi mãi. Nâng cấp khi bạn cần thêm.
          </p>
        </div>

        <div
          className="pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          {PLANS.map((p, i) => (
            <div
              key={p.plan}
              className={`price-card reveal-scale${p.featured ? " featured" : ""}`}
              style={{
                border: `1px solid ${p.featured ? "#0b0f0e" : "#e2dace"}`,
                borderRadius: 24,
                padding: "36px 32px",
                background: p.featured ? "#0b0f0e" : "white",
                position: "relative",
                transitionDelay: `${i * 0.1 + 0.1}s`,
              }}
            >
              {p.featured && (
                <div
                  style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#0d9488",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "5px 16px",
                    borderRadius: 100,
                    whiteSpace: "nowrap",
                  }}
                >
                  Phổ biến nhất
                </div>
              )}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: p.featured ? "rgba(245,240,232,0.45)" : "#6b7570",
                  marginBottom: 18,
                }}
              >
                {p.plan}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 48,
                  letterSpacing: "-1px",
                  color: p.featured ? "#f5f0e8" : "#0b0f0e",
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {p.amount}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: p.featured ? "rgba(245,240,232,0.4)" : "#6b7570",
                  marginBottom: 28,
                }}
              >
                {p.period}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 11,
                  marginBottom: 32,
                }}
              >
                {p.features.map((f) => (
                  <li
                    key={f}
                    style={{
                      fontSize: 14,
                      color: p.featured ? "rgba(245,240,232,0.65)" : "#6b7570",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontWeight: 300,
                    }}
                  >
                    <span style={{ color: "#0d9488", flexShrink: 0 }}>—</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={p.featured ? "btn-feat" : "btn-price"}
                onClick={() => router.push(p.featured ? "/dashboard" : "#")}
                style={{
                  width: "100%",
                  fontFamily: "var(--sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  padding: 13,
                  borderRadius: 12,
                  border: p.featured ? "none" : "1px solid #e2dace",
                  background: p.featured ? "#0d9488" : "transparent",
                  color: p.featured ? "white" : "#0b0f0e",
                  boxShadow: p.featured
                    ? "0 4px 20px rgba(13,148,136,0.35)"
                    : "none",
                }}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        style={{
          padding: "100px 5% 120px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {[600, 400].map((size, i) => (
          <div
            key={size}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: "50%",
              border: "1px solid #e2dace",
              top: "50%",
              left: "50%",
              pointerEvents: "none",
              animation: `pulseRing 4s ${i * 0.5}s ease-in-out infinite`,
            }}
          />
        ))}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          <h2
            className="reveal"
            style={{
              fontFamily: "var(--serif)",
              fontSize: "clamp(40px, 5vw, 68px)",
              lineHeight: 1.05,
              letterSpacing: "-1px",
              marginBottom: 20,
            }}
          >
            Bắt đầu
            <br />
            <em style={{ fontStyle: "italic", color: "#0d9488" }}>
              ngay hôm nay
            </em>
          </h2>
          <p
            className="reveal"
            style={{
              fontSize: 17,
              color: "#6b7570",
              fontWeight: 300,
              lineHeight: 1.7,
              marginBottom: 44,
              transitionDelay: "0.1s",
            }}
          >
            Không cần thẻ tín dụng. Không cài đặt phức tạp.
            <br />
            Chỉ 5 phút là sẵn sàng quản lý phòng trọ chuyên nghiệp.
          </p>
          <div
            className="reveal"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              flexWrap: "wrap",
              transitionDelay: "0.2s",
            }}
          >
            <button
              className="btn-primary"
              onClick={() => router.push("/dashboard")}
              style={{
                fontFamily: "var(--sans)",
                fontSize: 16,
                fontWeight: 500,
                color: "#f5f0e8",
                background: "#0b0f0e",
                border: "none",
                borderRadius: 14,
                padding: "16px 36px",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 4px 24px rgba(11,15,14,0.18)",
              }}
            >
              Vào ứng dụng ngay
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10m-4-4 4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="btn-outline"
              style={{
                fontFamily: "var(--sans)",
                fontSize: 15,
                fontWeight: 500,
                color: "#0b0f0e",
                background: "transparent",
                border: "1px solid #6b7570",
                borderRadius: 14,
                padding: "16px 36px",
              }}
            >
              Liên hệ tư vấn
            </button>
          </div>
          <p
            className="reveal"
            style={{
              color: "#6b7570",
              fontSize: 13,
              marginTop: 28,
              fontStyle: "italic",
              transitionDelay: "0.3s",
            }}
          >
            ✓ Miễn phí vĩnh viễn &nbsp;·&nbsp; ✓ Bảo mật tuyệt đối &nbsp;·&nbsp;
            ✓ Hỗ trợ tiếng Việt 24/7
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#0b0f0e", padding: "60px 5% 36px" }}>
        <div
          className="footer-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr",
            gap: 60,
            marginBottom: 56,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "rgba(245,240,232,0.08)",
                  borderRadius: 8,
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "var(--serif)",
                  fontSize: 18,
                  color: "#f5f0e8",
                  fontStyle: "italic",
                }}
              >
                L
              </div>
              <span
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 20,
                  color: "#f5f0e8",
                }}
              >
                LuanEZ
              </span>
            </div>
            <p
              style={{
                fontSize: 14,
                color: "rgba(245,240,232,0.4)",
                lineHeight: 1.7,
                maxWidth: 300,
                fontWeight: 300,
              }}
            >
              Giải pháp quản lý nhà trọ thông minh dành riêng cho thị trường
              Việt Nam.
            </p>
          </div>
          {[
            {
              title: "Sản phẩm",
              links: ["Tính năng", "Giá cả", "Tích hợp", "Changelog"],
            },
            {
              title: "Công ty",
              links: ["Về chúng tôi", "Blog", "Tuyển dụng", "Liên hệ"],
            },
            {
              title: "Hỗ trợ",
              links: ["Tài liệu", "Hướng dẫn", "Điều khoản", "Bảo mật"],
            },
          ].map((col) => (
            <div key={col.title}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(245,240,232,0.35)",
                  marginBottom: 18,
                }}
              >
                {col.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {col.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="footer-link"
                      style={{
                        fontSize: 14,
                        color: "rgba(245,240,232,0.55)",
                        textDecoration: "none",
                        fontWeight: 300,
                      }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid rgba(245,240,232,0.07)",
            paddingTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span
            style={{
              fontSize: 13,
              color: "rgba(245,240,232,0.25)",
              fontWeight: 300,
            }}
          >
            © 2026 LuanEZ SaaS · Chế tác bởi Võ Thành Luân
          </span>
          <span
            style={{
              fontSize: 13,
              color: "rgba(245,240,232,0.25)",
              fontWeight: 300,
            }}
          >
            Made with ☕ in Việt Nam
          </span>
        </div>
      </footer>
    </>
  );
}
