'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const HOME = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const heroParticlesRef = useRef<HTMLDivElement>(null);

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

/* ===== SPLASH INTRO ===== */
.splash{position:fixed;inset:0;z-index:9999;background:var(--bg);display:flex;align-items:center;justify-content:center;pointer-events:none;}
.splash-logo{opacity:0;transform:scale(0.8);animation:splashIn 0.8s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes splashIn{from{opacity:0;transform:scale(0.8);}to{opacity:1;transform:scale(1);}}
.splash.animate .splash-logo{animation:splashFly 1s cubic-bezier(0.7,0,0.3,1) forwards;}
.splash.done{opacity:0;transition:opacity 0.4s 0.1s ease;pointer-events:none;}
@keyframes splashFly{0%{transform:translate(0,0) scale(1);opacity:1;}100%{transform:translate(var(--tx),var(--ty)) scale(0.42);opacity:0;}}

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
.hero-video{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0.35;}
.hero-video canvas{width:100%;height:100%;display:block;}
.hero>*:not(.hero-video):not(.hero-particles){position:relative;z-index:2;}

.hero-particles{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.particle{position:absolute;width:3px;height:3px;border-radius:50%;background:var(--amber);opacity:0;animation:floatUp var(--dur) var(--delay) infinite;}
@keyframes floatUp{0%{opacity:0;transform:translateY(100vh) scale(0);}15%{opacity:0.6;}85%{opacity:0.3;}100%{opacity:0;transform:translateY(-20vh) scale(1);}}

.hero-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(232,145,58,0.2);border-radius:30px;padding:7px 20px;margin-bottom:36px;background:rgba(232,145,58,0.04);opacity:0;animation:fadeInUp 0.8s 2.0s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}
.hero-pill span{font-size:14px;font-weight:500;color:var(--amber-l);}

.hero h1{font-size:clamp(36px,6vw,76px);font-weight:800;letter-spacing:-3px;line-height:0.95;margin-bottom:12px;max-width:820px;opacity:0;animation:fadeInUp 0.8s 2.2s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero h1 .white{color:var(--cream);}
.hero h1 .accent{background:linear-gradient(135deg,var(--amber-g),var(--amber),var(--amber-d));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-oppo{font-size:clamp(18px,2.5vw,24px);font-weight:600;letter-spacing:1px;background:linear-gradient(90deg,var(--amber),var(--amber-g));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:24px;opacity:0;animation:fadeInUp 0.8s 2.35s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-desc{font-size:clamp(15px,1.8vw,18px);color:var(--gray);max-width:540px;line-height:1.7;margin-bottom:40px;opacity:0;animation:fadeInUp 0.8s 2.5s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;opacity:0;animation:fadeInUp 0.8s 2.65s cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 32px;border-radius:12px;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);letter-spacing:0.3px;position:relative;overflow:hidden;}
.btn-primary{background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;box-shadow:0 4px 24px rgba(232,145,58,0.2);}
.btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--amber-g),var(--amber));opacity:0;transition:opacity 0.3s;}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(232,145,58,0.35);}
.btn-primary:hover::before{opacity:1;}
.btn-primary span{position:relative;z-index:1;}
.btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--cream-d);}
.btn-ghost:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateY(-3px);}

.hero-stats{display:flex;gap:48px;margin-top:72px;flex-wrap:wrap;justify-content:center;opacity:0;animation:fadeInUp 0.8s 2.8s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-stat{text-align:center;position:relative;}
.hero-stat:not(:last-child)::after{content:'';position:absolute;right:-24px;top:50%;transform:translateY(-50%);width:1px;height:30px;background:rgba(255,255,255,0.06);}
.hero-stat-num{font-size:36px;font-weight:800;letter-spacing:-1px;background:linear-gradient(135deg,var(--amber-g),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-stat-label{font-size:13px;color:var(--gray);margin-top:4px;}

/* ===== APP PREVIEW ===== */
.app-preview-section{padding:40px 24px 100px;position:relative;overflow:hidden;}
.app-preview-section::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:100%;height:200px;background:linear-gradient(to bottom,var(--bg),transparent);pointer-events:none;z-index:1;}
.app-preview-wrap{max-width:1000px;margin:0 auto;position:relative;}
.app-preview-label{text-align:center;margin-bottom:28px;}
.app-preview-label span{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);font-weight:600;padding:6px 16px;border:1px solid rgba(232,145,58,0.2);border-radius:20px;background:rgba(232,145,58,0.04);}
.app-preview{border-radius:20px;border:1px solid rgba(255,255,255,0.06);background:var(--card);overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.4),0 0 80px rgba(232,145,58,0.05);position:relative;}
.app-preview-bar{display:flex;align-items:center;gap:8px;padding:14px 20px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.04);}
.app-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.08);}
.app-dot:first-child{background:#FF5F56;}
.app-dot:nth-child(2){background:#FFBD2E;}
.app-dot:nth-child(3){background:#27C93F;}
.app-preview-url{flex:1;text-align:center;font-size:12px;color:var(--gray-s);font-weight:500;letter-spacing:0.5px;}
.app-preview-content{padding:40px;display:grid;grid-template-columns:220px 1fr;gap:24px;min-height:340px;}
.app-sidebar-mock{display:flex;flex-direction:column;gap:12px;}
.app-sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:13px;color:var(--gray-l);transition:all 0.3s;}
.app-sidebar-item.active{background:rgba(232,145,58,0.1);color:var(--amber-l);}
.app-sidebar-icon{width:18px;height:18px;border-radius:5px;background:rgba(255,255,255,0.06);display:flex;align-items:center;justify-content:center;font-size:11px;}
.app-sidebar-item.active .app-sidebar-icon{background:rgba(232,145,58,0.2);}
.app-main-mock{display:flex;flex-direction:column;gap:16px;}
.app-card-mock{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:18px;display:flex;align-items:center;gap:14px;transition:all 0.3s;}
.app-card-mock:hover{background:rgba(255,255,255,0.04);border-color:rgba(232,145,58,0.15);transform:translateX(4px);}
.app-card-avatar{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#FFF;flex-shrink:0;}
.app-card-info{flex:1;}
.app-card-title{font-size:14px;font-weight:600;color:var(--cream);margin-bottom:2px;}
.app-card-sub{font-size:12px;color:var(--gray);}
.app-card-badge{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;}

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
.band-light .split-visual-card{background:#FFFFFF;border-color:rgba(0,0,0,0.08);box-shadow:0 30px 80px rgba(0,0,0,0.08);}
.band-light .testimonial-card{background:#FFFFFF;border-color:rgba(0,0,0,0.06);}
.band-light .testimonial-card:hover{border-color:rgba(232,145,58,0.2);}
.band-light .testimonial-text{color:#5A5A52;}
.band-light .testimonial-name{color:#1A1A18;}
.band-light .testimonial-role{color:#7A7A72;}
.band-light .testimonial-card::before{color:rgba(232,145,58,0.1);}
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

/* ===== HOW IT WORKS ===== */
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

/* ===== FEATURES ===== */
.features-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.feature-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:32px 28px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;}
.feature-card::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(232,145,58,0.04) 0%,transparent 60%);opacity:0;transition:opacity 0.4s;}
.feature-card:hover{background:var(--card-h);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.2);border-color:rgba(232,145,58,0.08);}
.feature-card:hover::before{opacity:1;}
.feature-icon{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px;transition:transform 0.3s,box-shadow 0.3s;}
.feature-card:hover .feature-icon{transform:scale(1.1);box-shadow:0 4px 16px rgba(232,145,58,0.15);}
.feature-icon-amber{background:rgba(232,145,58,0.1);}
.feature-icon-blue{background:rgba(43,94,158,0.15);}
.feature-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:var(--cream);position:relative;}
.feature-card p{font-size:14px;color:var(--gray-l);line-height:1.6;position:relative;}

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

/* ===== FAQ ===== */
.faq-list{max-width:700px;}
.faq-item{border-bottom:1px solid rgba(255,255,255,0.04);padding:22px 0;}
.faq-question{font-size:16px;font-weight:600;color:var(--cream);cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:16px;transition:color 0.3s;}
.faq-question:hover{color:var(--amber-l);}
.faq-arrow{font-size:18px;color:var(--gray);transition:transform 0.4s cubic-bezier(0.16,1,0.3,1),color 0.3s;flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.03);}
.faq-item.open .faq-arrow{transform:rotate(45deg);color:var(--amber);background:rgba(232,145,58,0.1);}
.faq-answer{max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1),padding 0.4s;font-size:15px;color:var(--gray-l);line-height:1.7;}
.faq-item.open .faq-answer{max-height:300px;padding-top:14px;}

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
  .footer-inner{grid-template-columns:1fr 1fr;}
  .hero-stats{gap:28px;}
  .hero-stat:not(:last-child)::after{display:none;}
  .app-preview-content{grid-template-columns:1fr;min-height:auto;}
  .app-sidebar-mock{flex-direction:row;flex-wrap:wrap;gap:6px;}
  .app-sidebar-item{padding:8px 12px;font-size:12px;}
}
@media(max-width:700px){
  .nav{padding:12px 20px;justify-content:space-between !important;}
  .nav-logo{position:static !important;left:auto !important;}
  .nav-links{display:none;position:fixed;top:56px;left:0;right:0;background:rgba(10,15,8,0.97);backdrop-filter:blur(24px);flex-direction:column;padding:24px;gap:16px;border-bottom:1px solid var(--card-b);transform:none !important;position:fixed !important;left:0 !important;}
  .nav-links.open{display:flex;}
  .nav-menu-btn{display:block;}
  .hero{padding:100px 20px 60px;}
  .hero h1{letter-spacing:-2px;font-size:clamp(28px,5vw,48px);}
  .hero-oppo{font-size:clamp(16px,2vw,20px);}
  .hero-logo svg{height:56px;}
  .section,.section-alt{padding:80px 20px;}
  .cta-section{padding:80px 20px;}
  .footer-inner{grid-template-columns:1fr;}
  .footer-bottom{flex-direction:column;gap:8px;text-align:center;}
  .form-inline{flex-direction:column;}
  .form-input,.form-select{width:100%;min-width:auto;}
  .steps-grid::before{display:none;}
  .band{border-radius:24px 24px 0 0;margin-top:-24px;}
  .splash-logo svg{height:80px !important;}
}
  `;

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (loading) return;

    const splash = document.getElementById('splash');
    const splashLogo = document.getElementById('splashLogo');
    const nav = document.getElementById('nav');

    if (splash && splashLogo && nav) {
      const navLogo = nav.querySelector('.nav-logo');
      setTimeout(() => {
        if (navLogo) {
          const logoRect = splashLogo.getBoundingClientRect();
          const navRect = navLogo.getBoundingClientRect();
          const cx = logoRect.left + logoRect.width / 2;
          const cy = logoRect.top + logoRect.height / 2;
          const tx = navRect.left + navRect.width / 2 - cx;
          const ty = navRect.top + navRect.height / 2 - cy;

          splashLogo.style.setProperty('--tx', tx + 'px');
          splashLogo.style.setProperty('--ty', ty + 'px');
          splash.classList.add('animate');

          setTimeout(() => {
            splash.classList.add('done');
            nav.classList.remove('nav-hidden');
            nav.classList.add('nav-enter');
            setTimeout(() => {
              splash.style.display = 'none';
            }, 500);
          }, 900);
        }
      }, 1200);
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const hc = heroCanvasRef.current;
    if (!hc) return;

    const ctx = hc.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      hc.width = hc.offsetWidth;
      hc.height = hc.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const orbs: Array<{
      x: number;
      y: number;
      r: number;
      vx: number;
      vy: number;
      hue: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 6; i++) {
      orbs.push({
        x: Math.random() * hc.width,
        y: Math.random() * hc.height,
        r: 120 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        hue: 25 + Math.random() * 15,
        alpha: 0.03 + Math.random() * 0.04
      });
    }

    const drawOrbs = (t: number) => {
      ctx.clearRect(0, 0, hc.width, hc.height);

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        o.x += o.vx + Math.sin(t * 0.0003 + i) * 0.3;
        o.y += o.vy + Math.cos(t * 0.0004 + i) * 0.2;

        if (o.x < -o.r) o.x = hc.width + o.r;
        if (o.x > hc.width + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = hc.height + o.r;
        if (o.y > hc.height + o.r) o.y = -o.r;

        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},80%,55%,${o.alpha})`);
        g.addColorStop(1, `hsla(${o.hue},80%,55%,0)`);
        ctx.fillStyle = g;
        ctx.fillRect(o.x - o.r, o.y - o.r, o.r * 2, o.r * 2);
      }

      const sweep = ((t * 0.05) % hc.width) * 2 - hc.width * 0.5;
      const sg = ctx.createLinearGradient(sweep, 0, sweep + 400, hc.height);
      sg.addColorStop(0, 'rgba(251,190,94,0)');
      sg.addColorStop(0.5, 'rgba(251,190,94,0.015)');
      sg.addColorStop(1, 'rgba(251,190,94,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, hc.width, hc.height);

      requestAnimationFrame(() => drawOrbs(performance.now()));
    };

    requestAnimationFrame(() => drawOrbs(performance.now()));

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const particlesEl = heroParticlesRef.current;
    if (!particlesEl) return;

    particlesEl.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const dur = 6 + Math.random() * 8;
      const delay = Math.random() * 8;
      const size = 2 + Math.random() * 3;
      p.style.cssText = `left:${Math.random() * 100}%;--dur:${dur}s;--delay:${delay}s;width:${size}px;height:${size}px;`;
      particlesEl.appendChild(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    let countersAnimated = false;

    const animateCounters = () => {
      if (countersAnimated) return;
      const nums = document.querySelectorAll('.hero-stat-num[data-count]');
      if (!nums.length) return;

      countersAnimated = true;
      nums.forEach((el) => {
        const target = parseInt((el as HTMLElement).getAttribute('data-count') || '0', 10);
        const duration = 1800;
        const start = performance.now();

        const update = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);

          if (target >= 2000) {
            (el as HTMLElement).textContent = current.toLocaleString('fr-FR') + '+';
          } else if (target === 100) {
            (el as HTMLElement).textContent = current + '%';
          } else {
            (el as HTMLElement).textContent = current + '+';
          }

          if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
      });
    };

    const onScroll = () => {
      if (!countersAnimated && (window.scrollY > 100)) {
        animateCounters();
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const progressBar = document.getElementById('scrollProgress');
    const nav = document.getElementById('nav');
    const bands = document.querySelectorAll('.band[data-nav-theme]');

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY || window.pageYOffset;

          if (nav) {
            if (scrollY > 60) {
              nav.classList.add('scrolled');
            } else {
              nav.classList.remove('scrolled');
            }

            let navTheme = 'dark';
            for (let i = 0; i < bands.length; i++) {
              const br = bands[i].getBoundingClientRect();
              if (br.top <= 100 && br.bottom > 60) {
                navTheme = bands[i].getAttribute('data-nav-theme') || 'dark';
              }
            }

            if (navTheme === 'white') {
              nav.classList.add('nav-white');
            } else {
              nav.classList.remove('nav-white');
            }
          }

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
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const handleFaqClick = (e: Event) => {
      const question = e.target as HTMLElement;
      const item = question.parentElement;
      if (!item) return;

      const wasOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach((i) => {
        i.classList.remove('open');
      });

      if (!wasOpen) {
        item.classList.add('open');
      }
    };

    document.querySelectorAll('.faq-question').forEach((q) => {
      q.addEventListener('click', handleFaqClick);
    });

    return () => {
      document.querySelectorAll('.faq-question').forEach((q) => {
        q.removeEventListener('click', handleFaqClick);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const form = document.getElementById('waitlistForm') as HTMLFormElement;
    if (!form) return;

    const handleSubmit = (e: Event) => {
      e.preventDefault();
      const emailInput = document.getElementById('emailInput') as HTMLInputElement;
      const roleSelect = document.getElementById('roleSelect') as HTMLSelectElement;
      const formSuccess = document.getElementById('formSuccess');

      if (!emailInput || !roleSelect) return;

      const email = emailInput.value.trim();
      const role = roleSelect.value;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        emailInput.setCustomValidity('Veuillez entrer un email valide');
        emailInput.reportValidity();
        return;
      }

      const allowedRoles = ['closer', 'manager', 'autre'];
      if (!allowedRoles.includes(role)) return;

      const lastSubmit = parseInt(sessionStorage.getItem('hc_last_submit') || '0', 10);
      if (Date.now() - lastSubmit < 30000) {
        alert('Merci de patienter avant de soumettre à nouveau.');
        return;
      }

      sessionStorage.setItem('hc_last_submit', String(Date.now()));

      try {
        const entries = JSON.parse(localStorage.getItem('hubclosing_waitlist') || '[]');
        if (entries.length > 500) entries.splice(0, entries.length - 200);
        entries.push({ email, role, date: new Date().toISOString() });
        localStorage.setItem('hubclosing_waitlist', JSON.stringify(entries));
      } catch (err) {
        console.error('Storage error:', err);
      }

      form.style.display = 'none';
      if (formSuccess) formSuccess.style.display = 'block';
    };

    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;

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

      document.querySelectorAll('.reveal').forEach((el) => {
        observer.observe(el);
      });

      return () => {
        document.querySelectorAll('.reveal').forEach((el) => {
          observer.unobserve(el);
        });
      };
    } else {
      document.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('visible');
      });
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const handleAnchorClick = (e: Event) => {
      const link = e.target as HTMLAnchorElement;
      const href = link.getAttribute('href');
      if (!href?.startsWith('#')) return;

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', handleAnchorClick);
    });

    return () => {
      document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.removeEventListener('click', handleAnchorClick);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return <div style={{ background: 'var(--bg)' }} />;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* SPLASH INTRO */}
      <div className="splash" id="splash">
        <div className="splash-logo" id="splashLogo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" height="120" style={{ filter: 'drop-shadow(0 8px 60px rgba(232,145,58,0.25))' }}>
            <defs>
              <linearGradient id="sClosG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBE5E" />
                <stop offset="40%" stopColor="#F5A623" />
                <stop offset="100%" stopColor="#E8913A" />
              </linearGradient>
              <linearGradient id="sHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E8E6DF" />
              </linearGradient>
              <linearGradient id="sOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FBBE5E" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F5A623" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g transform="translate(58, 78)">
              <circle cx="0" cy="0" r="30" fill="url(#sHubG)" />
              <circle cx="0" cy="0" r="30" fill="none" stroke="#F5A623" strokeWidth="0.8" opacity="0.15" />
              <path d="M-11,-13 L-11,13 M-11,0 L11,0 M11,-13 L11,13" stroke="url(#sClosG)" strokeWidth="3.8" strokeLinecap="round" fill="none" />
              <line x1="26" y1="-16" x2="44" y2="-30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <line x1="30" y1="0" x2="48" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <line x1="26" y1="16" x2="44" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <circle cx="48" cy="-34" r="6" fill="#FBBE5E" />
              <circle cx="52" cy="0" r="6" fill="#F5A623" />
              <circle cx="48" cy="34" r="6" fill="#FBBE5E" />
            </g>
            <text x="125" y="100" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="68" fill="url(#sHubG)" letterSpacing="-2.5">HUB</text>
            <text x="305" y="100" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="68" fill="url(#sClosG)" letterSpacing="-2.5">Closing</text>
            <text x="127" y="134" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="20" fill="url(#sOppoG)" letterSpacing="1">Opportunités</text>
            <circle cx="272" cy="128" r="2.5" fill="#F5A623" opacity="0.3" />
            <text x="288" y="134" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="400" fontSize="13" fill="rgba(255,255,255,0.35)" letterSpacing="3">CONNECTEZ . CLOSEZ . ÉVOLUEZ</text>
          </svg>
        </div>
      </div>

      {/* SCROLL PROGRESS */}
      <div className="scroll-progress" id="scrollProgress" />

      {/* NAV */}
      <nav className="nav nav-hidden" id="nav">
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
        <div className="nav-links" id="navLinks">
          <a href="#comment">Comment ça marche</a>
          <Link href="/closers">Closers</Link>
          <Link href="/managers">Managers</Link>
          <a href="#faq">FAQ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/auth/login" className="nav-cta"><span>Connexion</span></Link>
          <button className="nav-menu-btn" id="menuBtn" aria-label="Menu">☰</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-video"><canvas ref={heroCanvasRef} id="heroCanvas" /></div>
        <div className="hero-particles" ref={heroParticlesRef} id="heroParticles" />

        <div className="hero-pill">
          <span className="hero-pill-dot" />
          <span>Marketplace pour closers & managers</span>
        </div>
        <h1>
          <span className="white">Connectez, closez</span> —<br />
          <span className="accent">une seule plateforme</span>
        </h1>
        <div className="hero-oppo">Opportunités</div>
        <p className="hero-desc">
          La première marketplace qui met en relation les closers avec les écosystèmes d'infoproduit. Accédez à des opportunités qualifiées, trouvez les meilleurs profils.
        </p>
        <div className="hero-btns">
          <Link href="/auth/login" className="btn btn-primary"><span>S'inscrire gratuitement</span></Link>
          <a href="#comment" className="btn btn-ghost">Découvrir</a>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-num" data-count="2000">0</div><div className="hero-stat-label">Membres dans la communauté</div></div>
          <div className="hero-stat"><div className="hero-stat-num" data-count="150">0</div><div className="hero-stat-label">Opportunités à venir</div></div>
          <div className="hero-stat"><div className="hero-stat-num" data-count="100">0</div><div className="hero-stat-label">Dédié à l'infoproduit</div></div>
        </div>
      </section>

      {/* APP PREVIEW */}
      <div className="app-preview-section">
        <div className="app-preview-wrap reveal scale-in">
          <div className="app-preview-label"><span>Aperçu de la plateforme</span></div>
          <div className="app-preview">
            <div className="app-preview-bar">
              <div className="app-dot" />
              <div className="app-dot" />
              <div className="app-dot" />
              <div className="app-preview-url">app.hubclosing.fr/marketplace</div>
            </div>
            <div className="app-preview-content">
              <div className="app-sidebar-mock">
                <div className="app-sidebar-item"><div className="app-sidebar-icon">☰</div>Dashboard</div>
                <div className="app-sidebar-item active"><div className="app-sidebar-icon">🔍</div>Marketplace</div>
                <div className="app-sidebar-item"><div className="app-sidebar-icon">💬</div>Messages</div>
                <div className="app-sidebar-item"><div className="app-sidebar-icon">👤</div>Profil</div>
                <div className="app-sidebar-item"><div className="app-sidebar-icon">⚙</div>Paramètres</div>
              </div>
              <div className="app-main-mock">
                <div className="app-card-mock">
                  <div className="app-card-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),var(--amber-d))' }}>M</div>
                  <div className="app-card-info">
                    <div className="app-card-title">Closer Coaching Business</div>
                    <div className="app-card-sub">MindSet Academy • 15-20% commission • Paris</div>
                  </div>
                  <div className="app-card-badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Nouveau</div>
                </div>
                <div className="app-card-mock">
                  <div className="app-card-avatar" style={{ background: 'linear-gradient(135deg,#2B5E9E,#1A3F6F)' }}>S</div>
                  <div className="app-card-info">
                    <div className="app-card-title">Setter E-commerce</div>
                    <div className="app-card-sub">ScaleUp Pro • 8-12% commission • Remote</div>
                  </div>
                  <div className="app-card-badge" style={{ background: 'rgba(232,145,58,0.1)', color: 'var(--amber-l)' }}>Premium</div>
                </div>
                <div className="app-card-mock">
                  <div className="app-card-avatar" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>L</div>
                  <div className="app-card-info">
                    <div className="app-card-title">Closer Formation Santé</div>
                    <div className="app-card-sub">VitaLife • 20-25% commission • Remote</div>
                  </div>
                  <div className="app-card-badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Nouveau</div>
                </div>
                <div className="app-card-mock">
                  <div className="app-card-avatar" style={{ background: 'linear-gradient(135deg,var(--success),#16A34A)' }}>K</div>
                  <div className="app-card-info">
                    <div className="app-card-title">HOS Crypto / Finance</div>
                    <div className="app-card-sub">CryptoMastery • Salaire + bonus • Dubai</div>
                  </div>
                  <div className="app-card-badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#A78BFA' }}>VIP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMMENT CA MARCHE */}
      <div className="band band-light" data-nav-theme="white">
        <section className="section-alt" id="comment" style={{ background: 'transparent' }}>
          <div className="section-inner">
            <div className="slabel reveal">Comment ça marche</div>
            <div className="stitle reveal">Trois étapes pour <span className="accent">transformer votre carrière</span></div>
            <div className="sdesc reveal">Que vous soyez closer ou manager, HUBClosing simplifie la mise en relation en 3 étapes.</div>
            <div className="steps-grid">
              <div className="step-card reveal reveal-delay-1">
                <div className="step-num">1</div>
                <h3>Créez votre profil</h3>
                <p>Inscrivez-vous gratuitement et complétez votre profil en 5 minutes. Niches, expérience, résultats, disponibilité.</p>
              </div>
              <div className="step-card reveal reveal-delay-2">
                <div className="step-num">2</div>
                <h3>Découvrez les opportunités</h3>
                <p>Parcourez les offres filtrées par niche, commission et type de vente. Ou laissez notre matching vous suggérer les meilleures.</p>
              </div>
              <div className="step-card reveal reveal-delay-3">
                <div className="step-num">3</div>
                <h3>Closez & évoluez</h3>
                <p>Candidatez, échangez avec les managers, et décrochez votre prochaine mission. Évoluez au sein de la communauté.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* POUR QUI ? */}
      <div className="band band-dark" data-nav-theme="dark">
        <section className="section" id="pourqui">
          <div className="slabel reveal">Pour qui ?</div>
          <div className="stitle reveal">Une plateforme pour <span className="accent">chaque profil</span></div>
          <div className="sdesc reveal">Que vous soyez closer, setter, manager ou HOS, HUBClosing a été conçu pour vous.</div>
          <div className="features-grid">
            <Link href="/closers" className="feature-card reveal reveal-delay-1" style={{ cursor: 'pointer' }}>
              <div className="feature-icon feature-icon-amber">🏆</div>
              <h3>Closers & Setters</h3>
              <p>Accédez à des opportunités qualifiées, un matching intelligent, des formations exclusives et une communauté d'A-Players pour booster votre carrière.</p>
              <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--amber-l)' }}>Découvrir →</div>
            </Link>
            <Link href="/managers" className="feature-card reveal reveal-delay-2" style={{ cursor: 'pointer' }}>
              <div className="feature-icon feature-icon-blue">📋</div>
              <h3>Managers & HOS</h3>
              <p>Recrutez les meilleurs closers du marché grâce à des profils qualifiés, un système de candidatures ciblées et des analytics de recrutement.</p>
              <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '700', color: 'var(--amber-l)' }}>Découvrir →</div>
            </Link>
          </div>
        </section>
      </div>

      {/* TEMOIGNAGES */}
      <div className="band band-light" data-nav-theme="white">
        <section className="section-alt" id="temoignages" style={{ background: 'transparent' }}>
          <div className="section-inner">
            <div className="slabel reveal">Témoignages</div>
            <div className="stitle reveal">Ils nous font <span className="accent">déjà confiance</span></div>
            <div className="sdesc reveal">Plus de 2 000 membres dans notre communauté WhatsApp. Voici leurs retours.</div>
            <div className="testimonials-grid">
              <div className="testimonial-card reveal reveal-delay-1">
                <div className="testimonial-text">"Avant je passais des heures à chercher des offres sur les groupes Facebook. Maintenant j'ai tout au même endroit, avec des infos claires sur les commissions."</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),var(--amber-d))' }}>M</div>
                  <div><div className="testimonial-name">Maxime R.</div><div className="testimonial-role">Closer — Niche coaching</div></div>
                </div>
              </div>
              <div className="testimonial-card reveal reveal-delay-2">
                <div className="testimonial-text">"En tant que HOS, recruter un bon closer c'est le nerf de la guerre. Avoir une base de profils qualifiés, c'est exactement ce qu'il nous manquait."</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#2B5E9E,#1A3F6F)' }}>S</div>
                  <div><div className="testimonial-name">Sophie L.</div><div className="testimonial-role">Head of Sales — E-commerce</div></div>
                </div>
              </div>
              <div className="testimonial-card reveal reveal-delay-3">
                <div className="testimonial-text">"La communauté est incroyable. On s'entraide, on partage les bons plans. HUBClosing c'est plus qu'une plateforme, c'est une famille de sales."</div>
                <div className="testimonial-author">
                  <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--success),#16A34A)' }}>K</div>
                  <div><div className="testimonial-name">Karim B.</div><div className="testimonial-role">Closer & Setter — Formation</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* FAQ */}
      <div className="band band-dark" data-nav-theme="dark">
        <section className="section" id="faq">
          <div className="slabel reveal">FAQ</div>
          <div className="stitle reveal">Questions <span className="accent">fréquentes</span></div>
          <div className="sdesc reveal">Tout ce que vous devez savoir sur HUBClosing avant de vous lancer.</div>
          <div className="faq-list">
            <div className="faq-item reveal reveal-delay-1">
              <div className="faq-question">
                <span>HUBClosing, c'est quoi exactement ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">HUBClosing est la première marketplace dédiée au closing et à la vente dans l'univers de l'infoproduit. Nous connectons les closers et setters freelance avec les managers et HOS (Head of Sales) qui recherchent des talents pour vendre leurs formations, coachings et programmes en ligne.</div>
            </div>
            <div className="faq-item reveal reveal-delay-2">
              <div className="faq-question">
                <span>C'est gratuit ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">L'inscription et la création de profil sont 100% gratuites. Vous pouvez parcourir les opportunités, postuler et échanger avec les managers sans frais. Des fonctionnalités premium seront disponibles pour ceux qui veulent booster leur visibilité.</div>
            </div>
            <div className="faq-item reveal reveal-delay-3">
              <div className="faq-question">
                <span>Je suis closer / setter, comment ça marche ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Créez votre profil en indiquant vos niches, votre expérience et vos résultats. Parcourez ensuite les offres de la marketplace, filtrées par commission, niche et type de vente. Postulez en un clic et échangez directement avec les managers via la messagerie intégrée.</div>
            </div>
            <div className="faq-item reveal reveal-delay-4">
              <div className="faq-question">
                <span>Je suis manager / HOS, comment recruter ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Publiez vos offres avec les détails de la mission (niche, commission, conditions). Recevez des candidatures de closers qualifiés, consultez leurs profils détaillés et statistiques, puis échangez avec eux. Tout est centralisé sur votre dashboard.</div>
            </div>
            <div className="faq-item reveal">
              <div className="faq-question">
                <span>Quelle est la différence avec les groupes Facebook ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Contrairement aux groupes Facebook où les offres se perdent dans le fil d'actualité, HUBClosing offre une plateforme structurée avec des profils vérifiés, un système de filtres, une messagerie dédiée et un dashboard de suivi. Plus de temps perdu à chercher : tout est organisé et transparent.</div>
            </div>
            <div className="faq-item reveal">
              <div className="faq-question">
                <span>Comment rejoindre la communauté ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Inscrivez-vous gratuitement sur la plateforme et rejoignez notre communauté WhatsApp de plus de 2 000 membres. Vous aurez accès à des partages d'opportunités, des conseils entre closers, et des événements exclusifs.</div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA FINAL */}
      <div className="band band-dark" data-nav-theme="dark">
        <section className="cta-section" id="rejoindre">
          <div className="slabel reveal">REJOIGNEZ-NOUS</div>
          <h2 className="reveal"><span style={{ color: 'var(--cream)' }}>Prêt à rejoindre une communauté </span><span className="accent" style={{ background: 'linear-gradient(135deg,var(--amber-g),var(--amber),var(--amber-d))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>d'opportunités</span><span style={{ color: 'var(--cream)' }}> ?</span></h2>
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary reveal" style={{ marginTop: '32px' }}>
              <span>Accéder au Dashboard</span>
            </Link>
          ) : (
            <>
              <p className="reveal" style={{ maxWidth: '620px', margin: '0 auto 32px', lineHeight: '1.8' }}>
                <strong style={{ color: 'var(--amber-l)' }}>Closers & Setters</strong> — trouvez des missions qualifiées, filtrez par niche et commission, et gagnez du temps sur votre recherche d'opportunités.<br />
                <strong style={{ color: 'var(--amber-l)' }}>Managers & HOS</strong> — accédez à un vivier de closers vérifiés, publiez vos offres et recrutez les meilleurs profils en quelques clics.
              </p>
              <div className="reveal" style={{ marginTop: '24px' }}>
                <Link href="/auth/register" className="btn btn-primary" style={{ padding: '18px 40px', fontSize: '16px' }}>
                  <span>Créer mon compte gratuitement</span>
                </Link>
              </div>
            </>
          )}
        </section>
      </div>

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
            <a href="#faq">FAQ</a>
            <Link href="/auth/login">Connexion</Link>
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
          <span>&copy; 2026 HUBClosing Opportunités. Tous droits réservés.</span>
          <span>Fait avec ambition</span>
        </div>
      </footer>
    </>
  );
};

export default HOME;
