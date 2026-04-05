'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

const cssStyles = `
/* ===== RESET & VARIABLES ===== */
:root {
  --bg: #0A0F08; --bg2: #0F1A0A; --card: #141F0E; --card-h: #1A2814; --card-b: rgba(255,255,255,0.04);
  --amber-d: #D4782E; --amber: #E8913A; --amber-l: #F5A623; --amber-g: #FBBE5E;
  --cream: #F5F5F0; --cream-d: #D8D5CC; --gray: #7A7A72; --gray-l: #A5A59A; --gray-s: #4A4A42;
  --success: #22C55E; --radius: 14px;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',sans-serif;background:var(--bg);color:var(--cream);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
a{color:inherit;text-decoration:none;}
img{max-width:100%;height:auto;}

/* ===== NAV ===== */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:12px 40px;display:flex;align-items:center;justify-content:space-between;background:transparent;backdrop-filter:blur(0px);border-bottom:1px solid transparent;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);}
.nav.nav-hidden{opacity:0;transform:translateY(-20px);pointer-events:none;}
.nav.nav-enter{opacity:1;transform:translateY(0);transition:opacity 0.6s 0.2s ease,transform 0.6s 0.2s cubic-bezier(0.16,1,0.3,1);}
.nav.scrolled{background:rgba(10,15,8,0.92);backdrop-filter:blur(24px);border-bottom-color:rgba(255,255,255,0.05);padding:10px 40px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);}
.nav-logo{display:flex;align-items:center;gap:0;transition:transform 0.3s;}
.nav-logo:hover{transform:scale(1.02);}
.nav-logo svg{height:38px;width:auto;}
.nav.scrolled .nav-logo svg{height:34px;}
.nav-links{display:flex;gap:32px;align-items:center;position:absolute;left:50%;transform:translateX(-50%);}
.nav-links a{font-size:14px;font-weight:500;color:var(--gray-l);transition:color 0.3s,transform 0.2s;position:relative;}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:0;width:0;height:2px;background:var(--amber);border-radius:1px;transition:width 0.3s;}
.nav-links a:hover{color:var(--cream);}
.nav-links a:hover::after{width:100%;}
.nav-links a.nav-active::after{width:100%;background:var(--amber);}
.nav-cta{padding:10px 22px;border-radius:10px;font-weight:700;font-size:13px;background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;transition:all 0.3s;position:relative;overflow:hidden;}
.nav-cta::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--amber-g),var(--amber));opacity:0;transition:opacity 0.3s;}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 24px rgba(232,145,58,0.35);}
.nav-cta:hover::before{opacity:1;}
.nav-cta span{position:relative;z-index:1;}
.nav-menu-btn{display:none;background:none;border:none;color:var(--cream);font-size:24px;cursor:pointer;}

/* ===== HERO ===== */
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:140px 24px 80px;position:relative;overflow:hidden;}
.hero::before{content:'';position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(232,145,58,0.08) 0%,rgba(232,145,58,0.03) 30%,transparent 55%);pointer-events:none;animation:heroGlow 8s ease-in-out infinite alternate;}
.hero::after{content:'';position:absolute;bottom:-10%;right:-10%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(232,145,58,0.04) 0%,transparent 50%);pointer-events:none;}
@keyframes heroGlow{0%{transform:translateX(-50%) scale(1);opacity:0.8;}100%{transform:translateX(-50%) scale(1.15);opacity:1;}}
.hero>*{position:relative;z-index:2;}

.hero-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(232,145,58,0.2);border-radius:30px;padding:7px 20px;margin-bottom:36px;background:rgba(232,145,58,0.04);opacity:0;animation:fadeInUp 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}
.hero-pill span{font-size:14px;font-weight:500;color:var(--amber-l);}

.hero h1{font-size:clamp(36px,6vw,76px);font-weight:800;letter-spacing:-3px;line-height:0.95;margin-bottom:12px;max-width:820px;opacity:0;animation:fadeInUp 0.8s 0.4s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero h1 .white{color:var(--cream);}
.hero h1 .accent{background:linear-gradient(135deg,var(--amber-g),var(--amber),var(--amber-d));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-subtitle{font-size:clamp(15px,1.8vw,18px);color:var(--gray);max-width:540px;line-height:1.7;margin-bottom:40px;opacity:0;animation:fadeInUp 0.8s 0.55s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;opacity:0;animation:fadeInUp 0.8s 0.7s cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 32px;border-radius:12px;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);letter-spacing:0.3px;position:relative;overflow:hidden;}
.btn-primary{background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;box-shadow:0 4px 24px rgba(232,145,58,0.2);}
.btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--amber-g),var(--amber));opacity:0;transition:opacity 0.3s;}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(232,145,58,0.35);}
.btn-primary:hover::before{opacity:1;}
.btn-primary span{position:relative;z-index:1;}
.btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--cream-d);}
.btn-ghost:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateY(-3px);}

/* ===== BAND OVERLAY SECTIONS ===== */
.band{position:relative;z-index:2;border-radius:32px 32px 0 0;margin-top:-32px;overflow:hidden;}
.band:first-of-type{margin-top:0;}
.band-dark{background:var(--bg2);}
.band-light{background:#F5F0E8;color:#1A1A18;}
.band-light .slabel{color:var(--amber-d);}
.band-light .stitle{color:#1A1A18;}
.band-light .stitle .accent{background:linear-gradient(135deg,var(--amber-d),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.band-light .sdesc{color:#5A5A52;}
.band-light .step-card{background:#FFFFFF;border-color:rgba(0,0,0,0.06);}
.band-light .step-card:hover{background:#FAFAF7;box-shadow:0 20px 50px rgba(0,0,0,0.08);}
.band-light .step-card h3{color:#1A1A18;}
.band-light .step-card p{color:#5A5A52;}
.band-light .reveal{color:#1A1A18;}
.band-light .split-feature p{color:#5A5A52;}
.band-light .split-feature p strong{color:#1A1A18;}
.band-light .feature-card{background:#FFFFFF;border-color:rgba(0,0,0,0.06);}
.band-light .feature-card:hover{background:#FAFAF7;box-shadow:0 16px 40px rgba(0,0,0,0.06);}
.band-light .feature-card h3{color:#1A1A18;}
.band-light .feature-card p{color:#5A5A52;}

/* ===== NAV WHITE MODE ===== */
.nav.nav-white{background:rgba(245,240,232,0.95);backdrop-filter:blur(24px);border-bottom-color:rgba(0,0,0,0.06);}
.nav.nav-white .nav-logo svg text[fill="url(#navHubG)"]{fill:#1A1A18;}
.nav.nav-white .nav-logo svg circle[fill="url(#navHubG)"]{fill:#1A1A18;}
.nav.nav-white .nav-logo svg path{stroke:#1A1A18;}
.nav.nav-white .nav-logo svg line{stroke:rgba(26,26,24,0.15);}
.nav.nav-white .nav-logo svg circle[fill="#FBBE5E"]{fill:#D4782E;}
.nav.nav-white .nav-logo svg circle[fill="#F5A623"]{fill:#D4782E;}
.nav.nav-white .nav-logo svg text[fill="url(#navClosingG)"]{fill:#D4782E;}
.nav.nav-white .nav-logo svg text[fill="url(#navOppoG)"]{fill:#B0650F;}
.nav.nav-white .nav-logo svg text[fill="rgba(255,255,255,0.3)"]{fill:rgba(26,26,24,0.3);}
.nav.nav-white .nav-links a{color:#5A5A52;}
.nav.nav-white .nav-links a:hover{color:#1A1A18;}
.nav.nav-white .nav-menu-btn{color:#1A1A18;}
.nav.nav-white .nav-cta{background:linear-gradient(135deg,var(--amber-d),#C06A20);color:#FFF;}

/* ===== SECTIONS ===== */
.section{padding:120px 24px;max-width:1100px;margin:0 auto;}
.section-alt{background:var(--bg2);padding:120px 24px;}
.section-alt .section-inner{max-width:1100px;margin:0 auto;}
.slabel{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);font-weight:600;margin-bottom:12px;}
.stitle{font-size:clamp(28px,4vw,46px);font-weight:800;letter-spacing:-2px;margin-bottom:14px;line-height:1.1;}
.stitle .accent{background:linear-gradient(135deg,var(--amber-g),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sdesc{font-size:17px;color:var(--gray);max-width:580px;margin-bottom:56px;line-height:1.7;}

/* ===== SCROLL REVEAL SYSTEM ===== */
.reveal{opacity:0;transform:translateY(40px);transition:all 0.8s cubic-bezier(0.16,1,0.3,1);}
.reveal.from-left{transform:translateX(-40px);}
.reveal.from-right{transform:translateX(40px);}
.reveal.scale-in{transform:scale(0.95);}
.reveal.visible{opacity:1;transform:translate(0) scale(1);}
.reveal-delay-1{transition-delay:0.1s;}
.reveal-delay-2{transition-delay:0.2s;}
.reveal-delay-3{transition-delay:0.3s;}
.reveal-delay-4{transition-delay:0.4s;}

/* ===== FEATURES ===== */
.features-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.feature-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:32px 28px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;}
.feature-card::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(232,145,58,0.04) 0%,transparent 60%);opacity:0;transition:opacity 0.4s;}
.feature-card:hover{background:var(--card-h);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.2);border-color:rgba(232,145,58,0.08);}
.feature-card:hover::before{opacity:1;}
.feature-icon{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px;transition:transform 0.3s,box-shadow 0.3s;}
.feature-card:hover .feature-icon{transform:scale(1.1);box-shadow:0 4px 16px rgba(232,145,58,0.15);}
.feature-icon-amber{background:rgba(232,145,58,0.1);}
.feature-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:var(--cream);position:relative;}
.feature-card p{font-size:14px;color:var(--gray-l);line-height:1.6;position:relative;}

/* ===== STEPS ===== */
.steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;position:relative;}
.steps-grid::before{content:'';position:absolute;top:50%;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(232,145,58,0.15),transparent);pointer-events:none;}
.step-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:36px 28px;text-align:center;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;}
.step-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(232,145,58,0.06) 0%,transparent 60%);opacity:0;transition:opacity 0.4s;}
.step-card:hover{background:var(--card-h);transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,0.25);border-color:rgba(232,145,58,0.1);}
.step-card:hover::before{opacity:1;}
.step-num{width:52px;height:52px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#FFF;margin-bottom:20px;background:linear-gradient(135deg,var(--amber),var(--amber-d));box-shadow:0 4px 20px rgba(232,145,58,0.2);transition:transform 0.3s;}
.step-card:hover .step-num{transform:scale(1.1) rotate(-5deg);}
.step-card h3{font-size:18px;font-weight:700;margin-bottom:10px;color:var(--cream);position:relative;}
.step-card p{font-size:14px;color:var(--gray-l);line-height:1.6;position:relative;}

/* ===== TWO-COLUMN SECTION ===== */
.split-section{padding:120px 24px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
.split-section.reverse{direction:rtl;}
.split-section.reverse>*{direction:ltr;}
.split-text .slabel{margin-bottom:12px;}
.split-text .stitle{margin-bottom:16px;}
.split-text .sdesc{margin-bottom:32px;}
.split-features{display:flex;flex-direction:column;gap:16px;}
.split-feature{display:flex;align-items:flex-start;gap:14px;}
.split-check{width:24px;height:24px;border-radius:8px;background:rgba(34,197,94,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--success);font-size:13px;font-weight:700;margin-top:2px;}
.split-feature p{font-size:15px;color:var(--gray-l);line-height:1.6;}
.split-feature p strong{color:var(--cream);font-weight:600;}
.split-visual{position:relative;}
.split-visual-card{background:var(--card);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;box-shadow:0 30px 80px rgba(0,0,0,0.3);overflow:hidden;}
.split-visual-card::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;border-radius:50%;background:radial-gradient(circle,rgba(232,145,58,0.06),transparent 60%);pointer-events:none;}

/* ===== TESTIMONIALS ===== */
.testimonials-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
.testimonial-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:28px 24px;transition:all 0.4s;position:relative;overflow:hidden;}
.testimonial-card:hover{transform:translateY(-4px);border-color:rgba(232,145,58,0.1);}
.testimonial-card::before{content:'\\201C';position:absolute;top:12px;right:20px;font-size:60px;color:rgba(232,145,58,0.06);font-family:Georgia,serif;line-height:1;}
.testimonial-text{font-size:14px;color:var(--gray-l);line-height:1.7;margin-bottom:18px;font-style:italic;position:relative;}
.testimonial-author{display:flex;align-items:center;gap:12px;}
.testimonial-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#FFF;}
.testimonial-name{font-size:14px;font-weight:600;color:var(--cream);}
.testimonial-role{font-size:12px;color:var(--gray);}

/* ===== CTA SECTION ===== */
.cta-section{text-align:center;padding:120px 24px;position:relative;overflow:hidden;}
.cta-section::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(232,145,58,0.07) 0%,transparent 55%);pointer-events:none;}
.cta-section h2{font-size:clamp(28px,4vw,52px);font-weight:800;letter-spacing:-2px;margin-bottom:16px;}
.cta-section p{font-size:17px;color:var(--gray);max-width:480px;margin:0 auto 40px;line-height:1.7;}

/* ===== FORM ===== */
.form-inline{display:flex;gap:10px;max-width:520px;margin:0 auto;flex-wrap:wrap;justify-content:center;}
.form-input{padding:15px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:var(--card);color:var(--cream);font-family:inherit;font-size:15px;flex:1;min-width:200px;outline:none;transition:all 0.3s;}
.form-input:focus{border-color:var(--amber);box-shadow:0 0 20px rgba(232,145,58,0.1);}
.form-input::placeholder{color:var(--gray-s);}
.form-select{padding:15px 20px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:var(--card);color:var(--cream);font-family:inherit;font-size:15px;outline:none;cursor:pointer;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A7A72' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 16px center;padding-right:40px;transition:all 0.3s;}
.form-select:focus{border-color:var(--amber);box-shadow:0 0 20px rgba(232,145,58,0.1);}
.form-success{display:none;padding:20px;border-radius:12px;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.15);text-align:center;color:var(--success);font-weight:600;max-width:520px;margin:20px auto 0;}

/* ===== FOOTER ===== */
.footer{border-top:1px solid var(--card-b);padding:60px 24px 40px;margin-top:0;}
.footer-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;}
.footer-logo{margin-bottom:16px;}
.footer-logo svg{height:36px;width:auto;opacity:0.8;}
.footer-desc{font-size:13px;color:var(--gray);line-height:1.6;max-width:280px;}
.footer-col h4{font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--amber);margin-bottom:16px;}
.footer-col a{display:block;font-size:13px;color:var(--gray-l);padding:5px 0;transition:all 0.2s;}
.footer-col a:hover{color:var(--cream);transform:translateX(4px);}
.footer-bottom{max-width:1100px;margin:30px auto 0;padding-top:24px;border-top:1px solid var(--card-b);display:flex;justify-content:space-between;align-items:center;font-size:12px;color:var(--gray-s);}

/* ===== SCROLL PROGRESS BAR ===== */
.scroll-progress{position:fixed;top:0;left:0;height:2px;background:linear-gradient(90deg,var(--amber),var(--amber-g));z-index:200;transition:width 0.1s linear;width:0;}

/* ===== RESPONSIVE ===== */
@media(max-width:900px){
  .steps-grid,.testimonials-grid{grid-template-columns:1fr;}
  .features-grid{grid-template-columns:1fr;}
  .split-section{grid-template-columns:1fr;gap:40px;}
  .split-section.reverse{direction:ltr;}
  .footer-inner{grid-template-columns:1fr 1fr;}
  .section,.section-alt{padding:80px 24px;}
  .cta-section{padding:80px 24px;}
}
@media(max-width:700px){
  .nav{padding:12px 20px;justify-content:space-between !important;}
  .nav-logo{position:static !important;left:auto !important;}
  .nav-links{display:none;position:fixed;top:56px;left:0;right:0;background:rgba(10,15,8,0.97);backdrop-filter:blur(24px);flex-direction:column;padding:24px;gap:16px;border-bottom:1px solid var(--card-b);transform:none !important;position:fixed !important;left:0 !important;}
  .nav-links.open{display:flex;}
  .nav-menu-btn{display:block;}
  .hero{padding:100px 20px 60px;}
  .hero h1{letter-spacing:-2px;font-size:clamp(28px,5vw,48px);}
  .section,.section-alt{padding:80px 20px;}
  .cta-section{padding:80px 20px;}
  .footer-inner{grid-template-columns:1fr;}
  .footer-bottom{flex-direction:column;gap:8px;text-align:center;}
  .form-inline{flex-direction:column;}
  .form-input,.form-select{width:100%;min-width:auto;}
  .steps-grid::before{display:none;}
  .band{border-radius:24px 24px 0 0;margin-top:-24px;}
}
`;

export default function ClosersPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    // ===== MOBILE MENU =====
    const handleMenuClick = () => {
      setMenuOpen(!menuOpen);
    };

    const handleNavLinkClick = () => {
      setMenuOpen(false);
    };

    // ===== SCROLL REVEAL (IntersectionObserver) =====
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    } else {
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
    }

    // ===== SCROLL EVENTS =====
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;
          setIsScrolled(scrollY > 60);

          const progressBar = document.getElementById('scrollProgress');
          if (progressBar) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = (docH > 0 ? (scrollY / docH) * 100 : 0) + '%';
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // ===== SMOOTH ANCHOR SCROLL =====
    const handleAnchorClick = (e: Event) => {
      const a = e.target as HTMLAnchorElement;
      const href = a.getAttribute('href');
      if (href && href.startsWith('#')) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', handleAnchorClick);
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, [menuOpen]);

  // ===== EMAIL VALIDATION =====
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const sanitize = (str: string) => {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  };

  // ===== FORM SUBMIT =====
  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.querySelector('#emailInput') as HTMLInputElement;
    const roleSelect = form.querySelector('#roleSelect') as HTMLSelectElement;

    if (!emailInput || !roleSelect) return;

    const email = sanitize(emailInput.value.trim());
    const role = roleSelect.value;

    if (!isValidEmail(email)) {
      emailInput.setCustomValidity('Veuillez entrer un email valide');
      emailInput.reportValidity();
      return;
    }

    const allowedRoles = ['closer', 'setter', 'autre'];
    if (allowedRoles.indexOf(role) === -1) return;

    const lastSubmit = parseInt(sessionStorage.getItem('hc_last_submit') || '0', 10);
    if (Date.now() - lastSubmit < 30000) {
      alert('Merci de patienter avant de soumettre à nouveau.');
      return;
    }

    sessionStorage.setItem('hc_last_submit', String(Date.now()));

    try {
      let entries = JSON.parse(localStorage.getItem('hubclosing_waitlist') || '[]');
      if (entries.length > 500) entries = entries.slice(-200);
      entries.push({ email, role, date: new Date().toISOString() });
      localStorage.setItem('hubclosing_waitlist', JSON.stringify(entries));
    } catch (err) {}

    setFormSubmitted(true);
    form.style.display = 'none';
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* SCROLL PROGRESS */}
      <div className="scroll-progress" id="scrollProgress"></div>

      {/* NAV */}
      <nav className={`nav nav-enter ${isScrolled ? 'scrolled' : ''}`} id="nav">
        <Link href="/" className="nav-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" height="38">
            <defs>
              <linearGradient id="navClosingG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBE5E" />
                <stop offset="40%" stopColor="#F5A623" />
                <stop offset="100%" stopColor="#E8913A" />
              </linearGradient>
              <linearGradient id="navHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E8E6DF" />
              </linearGradient>
              <linearGradient id="navOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FBBE5E" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g transform="translate(28, 48)">
              <circle cx="0" cy="0" r="18" fill="url(#navHubG)" />
              <circle cx="0" cy="0" r="18" fill="none" stroke="#F5A623" strokeWidth="0.5" opacity="0.15" />
              <path d="M-7,-8 L-7,8 M-7,0 L7,0 M7,-8 L7,8" stroke="url(#navClosingG)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <line x1="16" y1="-10" x2="26" y2="-18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="18" y1="0" x2="28" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="16" y1="10" x2="26" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <circle cx="28" cy="-20" r="3.5" fill="#FBBE5E" />
              <circle cx="31" cy="0" r="3.5" fill="#F5A623" />
              <circle cx="28" cy="20" r="3.5" fill="#FBBE5E" />
            </g>
            <text x="72" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#navHubG)" letterSpacing="-1.5">HUB</text>
            <text x="172" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#navClosingG)" letterSpacing="-1.5">Closing</text>
            <text x="73" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="12" fill="url(#navOppoG)" letterSpacing="0.8">Opportunités</text>
            <circle cx="128" cy="78" r="1.5" fill="#F5A623" opacity="0.3" />
            <text x="138" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="400" fontSize="8" fill="rgba(255,255,255,0.3)" letterSpacing="2">CONNECTEZ . CLOSEZ . ÉVOLUEZ</text>
          </svg>
        </Link>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`} id="navLinks">
          <Link href="/">Accueil</Link>
          <Link href="/closers" className="nav-active">Closers</Link>
          <Link href="/managers">Managers</Link>
          <Link href="/faq">FAQ</Link>
          <a href="#rejoindre" className="nav-cta"><span>Connexion</span></a>
        </div>
        <button className="nav-menu-btn" id="menuBtn" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>&#9776;</button>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-pill"><span className="hero-pill-dot"></span><span>Trouvez votre prochaine opportunité</span></div>
        <h1>Closers & <span className="accent">Setters</span></h1>
        <p className="hero-subtitle">Accédez à un catalogue d'opportunités filtrées par niche, type de commission et volume de leads. Connectez-vous avec les meilleures missions de closing.</p>
        <div className="hero-btns">
          <a href="#rejoindre" className="btn btn-primary"><span>Rejoindre maintenant</span></a>
          <a href="#catalogue" className="btn btn-ghost">Découvrir les opportunités</a>
        </div>
      </section>

      {/* CATALOGUE OPPORTUNITÉS */}
      <section className="band band-dark">
        <div className="section-alt">
          <div className="section-inner">
            <span className="slabel">Catalogue d'opportunités</span>
            <h2 className="stitle">Filtrez par vos <span className="accent">critères</span></h2>
            <p className="sdesc">Chaque opportunité est documentée avec des informations précises pour que vous puissiez évaluer le fit avant d'accepter la mission.</p>
            <div className="features-grid">
              <div className="feature-card reveal">
                <div className="feature-icon feature-icon-amber">🎯</div>
                <h3>Filtres par niche</h3>
                <p>Ciblage par secteur d'infoproduit : formations, coaching, mastermind, communautés, etc.</p>
              </div>
              <div className="feature-card reveal reveal-delay-1">
                <div className="feature-icon feature-icon-amber">💰</div>
                <h3>Types de commission</h3>
                <p>Commission à la vente, part revenue share, rémunération fixe, ou modèles hybrides.</p>
              </div>
              <div className="feature-card reveal reveal-delay-2">
                <div className="feature-icon feature-icon-amber">📊</div>
                <h3>Volume de leads</h3>
                <p>Filtrez par volume quotidien, hebdomadaire ou mensuel selon votre capacité.</p>
              </div>
              <div className="feature-card reveal reveal-delay-3">
                <div className="feature-icon feature-icon-amber">🔍</div>
                <h3>Détails complets</h3>
                <p>Visibilité sur les prix, les objections courantes, les scripts et les ressources.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MATCHING INTELLIGENT */}
      <section className="band band-dark">
        <div className="split-section">
          <div className="split-text reveal from-left">
            <span className="slabel">Matching intelligent</span>
            <h2 className="stitle">Suggestions <span className="accent">personnalisées</span></h2>
            <p className="sdesc">Notre algorithme analyse votre profil, vos skills et votre historique pour vous recommander les meilleures opportunités.</p>
            <div className="split-features">
              <div className="split-feature">
                <div className="split-check">✓</div>
                <p>Recommandations basées sur <strong>vos compétences</strong></p>
              </div>
              <div className="split-feature">
                <div className="split-check">✓</div>
                <p>Matchs alignés avec <strong>vos objectifs de commission</strong></p>
              </div>
              <div className="split-feature">
                <div className="split-check">✓</div>
                <p>Suggestions actualisées <strong>chaque semaine</strong></p>
              </div>
              <div className="split-feature">
                <div className="split-check">✓</div>
                <p>Exclusivité avec <strong>les meilleures missions</strong></p>
              </div>
            </div>
          </div>
          <div className="split-visual reveal from-right">
            <div className="split-visual-card">
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: 'var(--cream)' }}>Profil optimisé</h3>
                <p style={{ fontSize: '14px', color: 'var(--gray-l)' }}>Vos meilleures opportunités basées sur votre expertise et vos préférences</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVIS ET TRANSPARENCE */}
      <section className="band band-dark">
        <div className="section-alt">
          <div className="section-inner">
            <span className="slabel">Transparence & Avis</span>
            <h2 className="stitle">Avis sur les <span className="accent">écosystèmes</span></h2>
            <p className="sdesc">Lisez les retours authentiques d'autres closers sur chaque opportunité. Qualité du support, conversion moyenne, sérieux du partenaire.</p>
            <div className="testimonials-grid">
              <div className="testimonial-card reveal">
                <p className="testimonial-text">"Excellente opportunité avec un support réactif. Les leads sont qualifiés et les conversions sont supérieures à mes attentes."</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#E8913A,#F5A623)' }}>MA</div>
                  <div>
                    <p className="testimonial-name">Marc A.</p>
                    <p className="testimonial-role">Closer senior</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card reveal reveal-delay-1">
                <p className="testimonial-text">"J'ai trouvé une mission stable avec des revenus prévisibles. La communauté d'autres closers sur HUBClosing m'a beaucoup aidé."</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#D4782E,#E8913A)' }}>SL</div>
                  <div>
                    <p className="testimonial-name">Sarah L.</p>
                    <p className="testimonial-role">Setter convertie</p>
                  </div>
                </div>
              </div>
              <div className="testimonial-card reveal reveal-delay-2">
                <p className="testimonial-text">"Les avis sur les écosystèmes m'ont permis d'éviter deux mauvaises collaborations. Vraiment utile pour sélectionner les bonnes opportunités."</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#F5A623,#FBBE5E)' }}>CZ</div>
                  <div>
                    <p className="testimonial-name">Charles Z.</p>
                    <p className="testimonial-role">Closer fulltime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MONTÉE EN COMPÉTENCE */}
      <section className="band band-dark">
        <div className="section-alt">
          <div className="section-inner">
            <span className="slabel">Montée en compétence</span>
            <h2 className="stitle">Programmes de <span className="accent">développement</span></h2>
            <p className="sdesc">Participez à un programme structuré pour améliorer vos skills et vos performances, directement depuis la plateforme.</p>
            <div className="steps-grid">
              <div className="step-card reveal">
                <div className="step-num">1</div>
                <h3>RP Collectifs hebdomadaires</h3>
                <p>Échanges en live avec d'autres closers, partage de scripts et de stratégies gagnantes.</p>
              </div>
              <div className="step-card reveal reveal-delay-1">
                <div className="step-num">2</div>
                <h3>Coaching de groupe</h3>
                <p>Sessions mensuelles animées par des top closers pour travailler les points clés de vos missions.</p>
              </div>
              <div className="step-card reveal reveal-delay-2">
                <div className="step-num">3</div>
                <h3>Masterclass Mindset A-Player</h3>
                <p>Développez le mindset de champion : résilience, gestion du rejet, confiance en soi.</p>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: '56px' }}>
              <p style={{ fontSize: '16px', color: 'var(--gray)', marginBottom: '24px' }}>Programme d'accompagnement mis à jour chaque semaine</p>
              <div className="feature-card reveal" style={{ maxWidth: '500px', margin: '0 auto', display: 'inline-block', width: '100%' }}>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--cream)', marginBottom: '12px' }}>📅 Calendrier hebdomadaire</h3>
                  <p style={{ fontSize: '14px', color: 'var(--gray-l)', marginBottom: '16px' }}>Jeudi 18h : RP Collectif | Samedi 10h : Coaching de groupe | Mardi 19h : Masterclass</p>
                  <a href="#rejoindre" className="btn btn-primary" style={{ width: '100%' }}><span>Accéder au programme</span></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMMUNAUTÉ D'EXCELLENCE */}
      <section className="band band-dark">
        <div className="section-alt">
          <div className="section-inner">
            <span className="slabel">Communauté</span>
            <h2 className="stitle">Réseau d'<span className="accent">excellence</span></h2>
            <p className="sdesc">Rejoignez une communauté de 2000+ closers et setters motivés, partageant leurs stratégies, leurs wins et leurs défis.</p>
            <div className="features-grid">
              <div className="feature-card reveal">
                <div className="feature-icon feature-icon-amber">👥</div>
                <h3>2000+ Closers actifs</h3>
                <p>Réseau vivant de professionnels engagés dans leur croissance.</p>
              </div>
              <div className="feature-card reveal reveal-delay-1">
                <div className="feature-icon feature-icon-amber">💬</div>
                <h3>Canaux privés</h3>
                <p>Discussions par niche, par niveau d'expérience et par objectifs.</p>
              </div>
              <div className="feature-card reveal reveal-delay-2">
                <div className="feature-icon feature-icon-amber">🏆</div>
                <h3>Leaderboards</h3>
                <p>Défi mensuel pour les closers : meilleur taux de conversion, plus de revenus, etc.</p>
              </div>
              <div className="feature-card reveal reveal-delay-3">
                <div className="feature-icon feature-icon-amber">🤝</div>
                <h3>Partenariats</h3>
                <p>Collaborations entre closers et managers pour construire des équipes performantes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section" id="rejoindre">
        <h2>Prêt à rejoindre une communauté d'opportunités ?</h2>
        <p style={{ maxWidth: '620px', margin: '0 auto 16px', lineHeight: '1.8' }}>
          <strong style={{ color: 'var(--amber-l)' }}>Closers & Setters</strong> — trouvez des missions qualifiées, filtrez par niche et commission, et gagnez du temps sur votre recherche d'opportunités.<br />
          <strong style={{ color: 'var(--amber-l)' }}>Managers & HOS</strong> — accédez à un vivier de closers vérifiés, publiez vos offres et recrutez les meilleurs profils en quelques clics.
        </p>
        <div style={{ marginTop: '24px' }}>
          <Link href="/auth/register" className="btn btn-primary" style={{ padding: '18px 40px', fontSize: '16px' }}>
            <span>Créer mon compte gratuitement</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <div className="footer-logo">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 120" height="36">
                <defs>
                  <linearGradient id="fClosG" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FBBE5E" />
                    <stop offset="40%" stopColor="#F5A623" />
                    <stop offset="100%" stopColor="#E8913A" />
                  </linearGradient>
                  <linearGradient id="fHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E8E6DF" />
                  </linearGradient>
                  <linearGradient id="fOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FBBE5E" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#F5A623" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <g transform="translate(28, 48)">
                  <circle cx="0" cy="0" r="18" fill="url(#fHubG)" />
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#F5A623" strokeWidth="0.5" opacity="0.15" />
                  <path d="M-7,-8 L-7,8 M-7,0 L7,0 M7,-8 L7,8" stroke="url(#fClosG)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <line x1="16" y1="-10" x2="26" y2="-18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <line x1="18" y1="0" x2="28" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <line x1="16" y1="10" x2="26" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <circle cx="28" cy="-20" r="3.5" fill="#FBBE5E" />
                  <circle cx="31" cy="0" r="3.5" fill="#F5A623" />
                  <circle cx="28" cy="20" r="3.5" fill="#FBBE5E" />
                </g>
                <text x="72" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#fHubG)" letterSpacing="-1.5">HUB</text>
                <text x="172" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#fClosG)" letterSpacing="-1.5">Closing</text>
                <text x="73" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="12" fill="url(#fOppoG)" letterSpacing="0.8">Opportunités</text>
              </svg>
            </div>
            <p className="footer-desc">La première marketplace qui connecte les closers aux écosystèmes d'infoproduit. Connectez. Closez. Évoluez.</p>
          </div>
          <div className="footer-col">
            <h4>Plateforme</h4>
            <Link href="/closers">Pour les closers</Link>
            <Link href="/managers">Pour les managers</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div className="footer-col">
            <h4>Légal</h4>
            <a href="#">Mentions légales</a>
            <a href="#">CGU</a>
            <a href="#">Politique de confidentialité</a>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="mailto:contact@hubclosing.fr">contact@hubclosing.fr</a>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 HUBClosing. Tous droits réservés.</p>
          <p>Fait avec passion pour les closers.</p>
        </div>
      </footer>
    </>
  );
}
