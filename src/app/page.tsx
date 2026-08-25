'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const HOME = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const heroCanvasRef = useRef<HTMLCanvasElement>(null);
  const heroParticlesRef = useRef<HTMLDivElement>(null);
  const sphereCanvasRef = useRef<HTMLCanvasElement>(null);

  const cssStyles = `
/* ===== RESET & VARIABLES ===== */
:root {
  --bg: #0A0F08; --bg2: #0F1A0A; --card: #141F0E; --card-h: #1A2814; --card-b: rgba(255,255,255,0.04);
  --amber-d: #B03008; --amber: #D04510; --amber-l: #F05A28; --amber-g: #F57A4A;
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
.nav{position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:100;padding:10px 12px 10px 20px;display:flex;align-items:center;justify-content:space-between;width:92%;max-width:1100px;background:rgba(20,31,14,0.5);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.08);border-radius:60px;transition:all 0.5s cubic-bezier(0.16,1,0.3,1);}
.nav.nav-hidden{opacity:0;transform:translateX(-50%) translateY(-30px);pointer-events:none;}
.nav.nav-enter{opacity:1;transform:translateX(-50%) translateY(0);transition:opacity 0.6s 0.2s ease,transform 0.6s 0.2s cubic-bezier(0.16,1,0.3,1);}
.nav.scrolled{top:12px;padding:8px 10px 8px 18px;background:rgba(10,15,8,0.92);backdrop-filter:blur(30px);border-color:rgba(255,255,255,0.06);box-shadow:0 8px 40px rgba(0,0,0,0.4),0 0 0 1px rgba(255,255,255,0.03);}
.nav-logo{display:flex;align-items:center;gap:0;transition:transform 0.3s;flex-shrink:0;}
.nav-logo:hover{transform:scale(1.02);}
.nav-logo svg{height:36px;width:auto;}
.nav.scrolled .nav-logo svg{height:32px;}
.nav-links{display:flex;gap:28px;align-items:center;flex:1;justify-content:center;}
.nav-links a{font-size:13.5px;font-weight:500;color:var(--gray-l);transition:color 0.3s;position:relative;}
.nav-links a::after{content:'';position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:0;height:2px;background:var(--amber);border-radius:1px;transition:width 0.3s;}
.nav-links a:hover{color:var(--cream);}
.nav-links a:hover::after{width:100%;}
.nav-cta{padding:10px 24px;border-radius:30px;font-weight:700;font-size:13px;background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;transition:all 0.3s;position:relative;overflow:hidden;}
.nav-cta::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--amber-g),var(--amber));opacity:0;transition:opacity 0.3s;border-radius:30px;}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 24px rgba(240,90,40,0.35);}
.nav-cta:hover::before{opacity:1;}
.nav-cta span{position:relative;z-index:1;}
.nav-cta-ghost{padding:10px 24px;border-radius:30px;font-weight:700;font-size:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--cream-d);transition:all 0.3s;}
.nav-cta-ghost:hover{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.2);transform:translateY(-1px);}
.nav-menu-btn{display:none;background:none;border:none;color:var(--cream);font-size:24px;cursor:pointer;}

/* ===== HERO ===== */
.hero{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:160px 24px 80px;position:relative;overflow:hidden;background:linear-gradient(180deg,var(--bg) 0%,#0D1209 50%,#12180D 100%);}
.hero::before{content:'';position:absolute;top:-20%;left:50%;transform:translateX(-50%);width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(240,90,40,0.08) 0%,rgba(240,90,40,0.03) 30%,transparent 55%);pointer-events:none;animation:heroGlow 8s ease-in-out infinite alternate;}
.hero::after{content:'';position:absolute;bottom:-10%;right:-10%;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(240,90,40,0.04) 0%,transparent 50%);pointer-events:none;}
@keyframes heroGlow{0%{transform:translateX(-50%) scale(1);opacity:0.8;}100%{transform:translateX(-50%) scale(1.15);opacity:1;}}
.hero-network{position:absolute;inset:0;z-index:0;}
.hero-network canvas{width:100%;height:100%;display:block;}
.hero>*:not(.hero-network):not(.hero-particles):not(.hero-rays):not(.hero-flare){position:relative;z-index:3;}
.hero-rays{position:absolute;bottom:0;left:0;right:0;height:70%;background:conic-gradient(from 180deg at 50% 100%,transparent 120deg,rgba(240,90,40,0.03) 138deg,transparent 145deg,rgba(176,48,8,0.05) 152deg,transparent 157deg,rgba(245,122,74,0.04) 163deg,transparent 168deg,rgba(240,90,40,0.07) 173deg,rgba(245,122,74,0.1) 177deg,rgba(240,90,40,0.13) 180deg,rgba(245,122,74,0.1) 183deg,rgba(240,90,40,0.07) 187deg,transparent 192deg,rgba(245,122,74,0.04) 197deg,transparent 203deg,rgba(176,48,8,0.05) 208deg,transparent 215deg,rgba(240,90,40,0.03) 222deg,transparent 240deg);pointer-events:none;z-index:1;opacity:0;animation:raysIn 2s 1.8s ease forwards;}
@keyframes raysIn{from{opacity:0;}to{opacity:1;}}
.hero-flare{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:800px;height:400px;background:radial-gradient(ellipse at 50% 100%,rgba(240,90,40,0.18) 0%,rgba(245,122,74,0.06) 35%,transparent 70%);pointer-events:none;z-index:2;opacity:0;animation:flareIn 2.5s 2s ease forwards;}
@keyframes flareIn{from{opacity:0;}to{opacity:1;}}

.hero-sphere{position:relative;width:340px;height:340px;margin:40px auto 10px;z-index:4;opacity:0;animation:fadeInUp 1s 2.6s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-sphere canvas{width:100%;height:100%;display:block;}
.hero-particles{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.particle{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--amber);opacity:0;animation:floatUp var(--dur) var(--delay) infinite;}
@keyframes floatUp{0%{opacity:0;transform:translateY(100vh) scale(0);}15%{opacity:0.85;}85%{opacity:0.5;}100%{opacity:0;transform:translateY(-20vh) scale(1);}}

.hero-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(240,90,40,0.2);border-radius:30px;padding:7px 20px;margin-bottom:36px;background:rgba(240,90,40,0.04);opacity:0;animation:fadeInUp 0.8s 2.0s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-pill-dot{width:8px;height:8px;border-radius:50%;background:var(--amber);animation:pulse 2s infinite;}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.4;transform:scale(0.8);}}
.hero-pill span{font-size:14px;font-weight:500;color:var(--amber-l);}

.hero h1{font-size:clamp(34px,5.5vw,72px);font-weight:800;letter-spacing:-3px;line-height:1.05;margin-bottom:20px;max-width:900px;opacity:0;animation:fadeInUp 0.8s 2.2s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero h1 .white{color:var(--cream);}
.hero h1 .accent{background:linear-gradient(135deg,var(--amber-g),var(--amber-l),var(--amber),var(--amber-d));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;background-size:200% 200%;animation:fadeInUp 0.8s 2.2s cubic-bezier(0.16,1,0.3,1) forwards,gradientShift 6s 3s ease-in-out infinite;}
@keyframes gradientShift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
.hero-desc{font-size:clamp(15px,1.8vw,18px);color:var(--gray);max-width:540px;line-height:1.7;margin-bottom:40px;opacity:0;animation:fadeInUp 0.8s 2.35s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;opacity:0;animation:fadeInUp 0.8s 2.5s cubic-bezier(0.16,1,0.3,1) forwards;}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px);}to{opacity:1;transform:translateY(0);}}

.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 32px;border-radius:12px;font-weight:700;font-size:15px;border:none;cursor:pointer;font-family:inherit;transition:all 0.35s cubic-bezier(0.16,1,0.3,1);letter-spacing:0.3px;position:relative;overflow:hidden;}
.btn-primary{background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;box-shadow:0 4px 24px rgba(240,90,40,0.2);}
.btn-primary::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,var(--amber-g),var(--amber));opacity:0;transition:opacity 0.3s;}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(240,90,40,0.35);}
.btn-primary:hover::before{opacity:1;}
.btn-primary span{position:relative;z-index:1;}
.btn-ghost{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--cream-d);}
.btn-ghost:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);transform:translateY(-3px);}

.hero-stats{display:flex;gap:48px;margin-top:72px;flex-wrap:wrap;justify-content:center;opacity:0;animation:fadeInUp 0.8s 2.65s cubic-bezier(0.16,1,0.3,1) forwards;}
.hero-stat{text-align:center;position:relative;}
.hero-stat:not(:last-child)::after{content:'';position:absolute;right:-24px;top:50%;transform:translateY(-50%);width:1px;height:30px;background:rgba(255,255,255,0.06);}
.hero-stat-num{font-size:30px;font-weight:800;letter-spacing:-1px;background:linear-gradient(135deg,var(--amber-g),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero-stat-label{font-size:13px;color:var(--gray);margin-top:4px;}

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
.band-light .testimonial-card:hover{border-color:rgba(240,90,40,0.2);}
.band-light .testimonial-text{color:#5A5A52;}
.band-light .testimonial-name{color:#1A1A18;}
.band-light .testimonial-role{color:#7A7A72;}
.band-light .testimonial-card::before{color:rgba(240,90,40,0.1);}
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
.nav.nav-white .nav-logo svg circle[fill="#F57A4A"]{fill:#B03008;}
.nav.nav-white .nav-logo svg circle[fill="#F05A28"]{fill:#B03008;}
.nav.nav-white .nav-logo svg text[fill="url(#navClosingG)"]{fill:#B03008;}
.nav.nav-white .nav-logo svg text[fill="url(#navOppoG)"]{fill:#B0650F;}
.nav.nav-white .nav-logo svg text[fill="rgba(255,255,255,0.3)"]{fill:rgba(26,26,24,0.3);}
.nav.nav-white .nav-links a{color:#5A5A52;}
.nav.nav-white .nav-links a:hover{color:#1A1A18;}
.nav.nav-white .nav-menu-btn{color:#1A1A18;}
.nav.nav-white .nav-cta{background:linear-gradient(135deg,var(--amber-d),#C06A20);color:#FFF;}
.nav.nav-white .nav-cta-ghost{background:rgba(0,0,0,0.04);border-color:rgba(0,0,0,0.1);color:#1A1A18;}
.nav.nav-white .nav-cta-ghost:hover{background:rgba(0,0,0,0.08);border-color:rgba(0,0,0,0.15);}

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
.steps-grid::before{content:'';position:absolute;top:50%;left:10%;right:10%;height:1px;background:linear-gradient(90deg,transparent,rgba(240,90,40,0.15),transparent);pointer-events:none;}
.step-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:36px 28px;text-align:center;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;}
.step-card::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 50% 0%,rgba(240,90,40,0.06) 0%,transparent 60%);opacity:0;transition:opacity 0.4s;}
.step-card:hover{background:var(--card-h);transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,0.25);border-color:rgba(240,90,40,0.1);}
.step-card:hover::before{opacity:1;}
.step-num{width:52px;height:52px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;color:#FFF;margin-bottom:20px;background:linear-gradient(135deg,var(--amber),var(--amber-d));box-shadow:0 4px 20px rgba(240,90,40,0.2);transition:transform 0.3s;}
.step-card:hover .step-num{transform:scale(1.1) rotate(-5deg);}
.step-card h3{font-size:18px;font-weight:700;margin-bottom:10px;color:var(--cream);position:relative;}
.step-card p{font-size:14px;color:var(--gray-l);line-height:1.6;position:relative;}

/* ===== FEATURES ===== */
.features-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;}
.feature-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:32px 28px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;}
.feature-card::before{content:'';position:absolute;top:-50%;right:-50%;width:100%;height:100%;background:radial-gradient(circle,rgba(240,90,40,0.04) 0%,transparent 60%);opacity:0;transition:opacity 0.4s;}
.feature-card:hover{background:var(--card-h);transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.2);border-color:rgba(240,90,40,0.08);}
.feature-card:hover::before{opacity:1;}
.feature-icon{width:48px;height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:22px;transition:transform 0.3s,box-shadow 0.3s;}
.feature-card:hover .feature-icon{transform:scale(1.1);box-shadow:0 4px 16px rgba(240,90,40,0.15);}
.feature-icon-amber{background:rgba(240,90,40,0.1);}
.feature-icon-blue{background:rgba(43,94,158,0.15);}
.feature-card h3{font-size:16px;font-weight:700;margin-bottom:8px;color:var(--cream);position:relative;}
.feature-card p{font-size:14px;color:var(--gray-l);line-height:1.6;position:relative;}

/* ===== TESTIMONIALS MARQUEE ===== */
.testimonials-marquee-wrap{overflow:hidden;position:relative;width:100vw;margin-left:calc(-50vw + 50%);padding:0 0;}
.testimonials-marquee-wrap::before,.testimonials-marquee-wrap::after{content:'';position:absolute;top:0;bottom:0;width:120px;z-index:2;pointer-events:none;}
.testimonials-marquee-wrap::before{left:0;background:linear-gradient(to right,#F5F0E8,transparent);}
.testimonials-marquee-wrap::after{right:0;background:linear-gradient(to left,#F5F0E8,transparent);}
.testimonials-marquee{display:flex;gap:20px;animation:marquee-scroll 60s linear infinite;width:max-content;}
.testimonials-marquee:hover{animation-play-state:paused;}
.testimonials-marquee-row2{animation:marquee-scroll-reverse 55s linear infinite;}
.testimonials-marquee-row2:hover{animation-play-state:paused;}
@keyframes marquee-scroll{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
@keyframes marquee-scroll-reverse{0%{transform:translateX(-50%);}100%{transform:translateX(0);}}
.testimonial-card{background:var(--card);border:1px solid var(--card-b);border-radius:18px;padding:28px 24px;transition:all 0.4s;position:relative;overflow:hidden;min-width:340px;max-width:340px;flex-shrink:0;}
.testimonial-card:hover{transform:translateY(-4px);border-color:rgba(240,90,40,0.1);}
.testimonial-card::before{content:'\\201C';position:absolute;top:12px;right:20px;font-size:60px;color:rgba(240,90,40,0.06);font-family:Georgia,serif;line-height:1;}
.testimonial-text{font-size:14px;color:var(--gray-l);line-height:1.7;margin-bottom:18px;font-style:italic;position:relative;}
.testimonial-badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:3px 10px;border-radius:20px;margin-bottom:14px;}
.badge-closer{background:rgba(240,90,40,0.12);color:#B03008;}
.badge-setter{background:rgba(43,94,158,0.12);color:#2B5E9E;}
.badge-recruteur{background:rgba(139,92,246,0.12);color:#7C3AED;}
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
.faq-item.open .faq-arrow{transform:rotate(45deg);color:var(--amber);background:rgba(240,90,40,0.1);}
.faq-answer{max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.16,1,0.3,1),padding 0.4s;font-size:15px;color:var(--gray-l);line-height:1.7;}
.faq-item.open .faq-answer{max-height:300px;padding-top:14px;}

/* ===== CTA SECTION ===== */
.cta-section{text-align:center;padding:120px 24px;position:relative;overflow:hidden;}
.cta-section::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(240,90,40,0.07) 0%,transparent 55%);pointer-events:none;}
.cta-section h2{font-size:clamp(28px,4vw,52px);font-weight:800;letter-spacing:-2px;margin-bottom:16px;}
.cta-section p{font-size:17px;color:var(--gray);max-width:480px;margin:0 auto 40px;line-height:1.7;}

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

/* ===== POUR QUI PAIN POINTS ===== */
.pain-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.pain-card{background:#FFFFFF;border:1px solid rgba(0,0,0,0.06);border-radius:18px;padding:36px 28px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);}
.pain-card:hover{transform:translateY(-4px);box-shadow:0 16px 40px rgba(0,0,0,0.08);}
.pain-icon{font-size:28px;margin-bottom:14px;}
.pain-title{font-size:18px;font-weight:700;color:#1A1A18;margin-bottom:10px;line-height:1.3;}
.pain-desc{font-size:14px;color:#5A5A52;line-height:1.6;margin-bottom:16px;}
.pain-label{font-size:13px;font-weight:700;color:var(--amber);margin-bottom:10px;}
.pain-check{font-size:13px;color:#5A5A52;line-height:2;padding-left:2px;}
.pain-check-icon{color:var(--success);margin-right:6px;font-weight:700;}

/* ===== FEATURES 3-COL ===== */
.features-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}

/* ===== OPTIONNEL BADGE ===== */
.opt-badge{display:inline-block;font-size:10px;font-weight:600;background:rgba(251,190,94,0.12);color:var(--amber-g);padding:2px 8px;border-radius:10px;margin-left:6px;vertical-align:middle;}

/* ===== DASHBOARD PREVIEW ===== */
.dash-preview{border-radius:20px;border:1px solid rgba(255,255,255,0.06);background:var(--card);overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.4),0 0 80px rgba(240,90,40,0.05);}
.dash-topbar{display:flex;align-items:center;gap:8px;padding:14px 20px;background:rgba(0,0,0,0.3);border-bottom:1px solid rgba(255,255,255,0.04);}
.dash-toggle{display:flex;gap:8px;margin-bottom:20px;}
.dash-toggle-btn{flex:1;text-align:center;padding:10px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.3s;}
.dash-toggle-active{background:rgba(240,90,40,0.12);color:var(--amber-l);}
.dash-toggle-inactive{background:rgba(255,255,255,0.03);color:var(--gray);}
.dash-toggle-inactive:hover{background:rgba(255,255,255,0.06);color:var(--gray-l);}
.dash-view{display:none;min-height:340px;animation:fadeIn 0.4s ease;}
.dash-view.active{display:flex;}
@keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
.dash-body{display:flex;min-height:340px;}
.dash-sidebar{width:180px;padding:16px;border-right:1px solid rgba(255,255,255,0.04);}
.dash-sidebar-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:10px;font-size:13px;color:var(--gray-l);margin-bottom:4px;transition:all 0.3s;}
.dash-sidebar-item.active{background:rgba(240,90,40,0.1);color:var(--amber-l);}
.dash-sidebar-icon{font-size:16px;width:20px;text-align:center;}
.dash-main{flex:1;padding:20px;}
.dash-welcome{font-size:16px;font-weight:600;margin-bottom:16px;}
.dash-welcome span{font-size:12px;font-weight:400;color:var(--gray);margin-left:6px;}
.dash-stats{display:flex;gap:12px;margin-bottom:20px;}
.dash-stat-card{flex:1;border-radius:12px;padding:14px;text-align:center;}
.dash-stat-num{font-size:24px;font-weight:800;}
.dash-stat-label{font-size:11px;opacity:0.6;margin-top:2px;}
.dash-offers-title{font-size:13px;font-weight:600;color:var(--gray-l);margin-bottom:10px;}
.dash-offer{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.04);border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;transition:all 0.3s;}
.dash-offer:hover{background:rgba(255,255,255,0.04);border-color:rgba(240,90,40,0.15);transform:translateX(4px);}
.dash-offer-title{font-size:14px;font-weight:600;color:var(--cream);}
.dash-offer-sub{font-size:12px;color:var(--gray);margin-top:2px;}
.dash-offer-badge{padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;}

/* ===== COMMUNITY REF ===== */
.community-ref-box{background:rgba(240,90,40,0.06);border:1px solid rgba(240,90,40,0.12);border-radius:14px;padding:18px 24px;display:flex;align-items:center;gap:16px;}
.band-light .community-ref-box{background:rgba(240,90,40,0.06);border-color:rgba(240,90,40,0.12);}

/* ===== APP PREVIEW ===== */
.app-preview-section{padding:40px 24px 100px;position:relative;overflow:hidden;}
.app-preview-section::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:100%;height:200px;background:linear-gradient(to bottom,var(--bg),transparent);pointer-events:none;z-index:1;}
.app-preview-wrap{max-width:1000px;margin:0 auto;position:relative;}
.app-preview-label{text-align:center;margin-bottom:28px;}
.app-preview-label span{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--amber);font-weight:600;padding:6px 16px;border:1px solid rgba(240,90,40,0.2);border-radius:20px;background:rgba(240,90,40,0.04);}
.app-dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,0.08);}
.app-dot:first-child{background:#FF5F56;}
.app-dot:nth-child(2){background:#FFBD2E;}
.app-dot:nth-child(3){background:#27C93F;}

/* ===== RESPONSIVE ===== */
@media(max-width:900px){
  .steps-grid{grid-template-columns:1fr;}
  .testimonial-card{min-width:280px;max-width:280px;}
  .features-grid{grid-template-columns:1fr;}
  .footer-inner{grid-template-columns:1fr 1fr;}
  .hero-stats{gap:28px;}
  .hero-stat:not(:last-child)::after{display:none;}
  .pain-grid{grid-template-columns:1fr;}
  .features-grid-3{grid-template-columns:1fr 1fr;}
  .dash-body,.dash-view.active{flex-direction:column;}
  .dash-sidebar{width:100%;border-right:none;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;flex-wrap:wrap;gap:4px;padding:10px;}
  .dash-sidebar-item{padding:8px 12px;font-size:12px;}
}
@media(max-width:700px){
  .nav{padding:8px 10px 8px 14px;width:96%;border-radius:24px;top:10px;}
  .nav.scrolled{top:8px;padding:6px 8px 6px 12px;}
  .nav-logo{flex-shrink:0;}
  .nav-links{display:none;position:fixed;top:70px;left:4%;right:4%;width:92%;background:rgba(10,15,8,0.97);backdrop-filter:blur(24px);flex-direction:column;padding:24px;gap:16px;border:1px solid rgba(255,255,255,0.06);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.5);justify-content:flex-start;}
  .nav-links.open{display:flex;}
  .nav-menu-btn{display:block;font-size:20px;padding:4px 6px;line-height:1;}
  .nav-cta-ghost{padding:7px 14px;font-size:11px;border-radius:20px;}
  .nav-cta{padding:7px 14px;font-size:11px;border-radius:20px;}
  .nav-logo svg{height:28px !important;}
  .hero{padding:120px 20px 60px;}
  .hero h1{letter-spacing:-2px;font-size:clamp(28px,6vw,48px);}
  .hero-sphere{width:240px;height:240px;margin:24px auto 6px;}
  .hero-logo svg{height:56px;}
  .section,.section-alt{padding:80px 20px;}
  .cta-section{padding:80px 20px;}
  .footer-inner{grid-template-columns:1fr;}
  .footer-bottom{flex-direction:column;gap:8px;text-align:center;}
  .steps-grid::before{display:none;}
  .band{border-radius:24px 24px 0 0;margin-top:-24px;}
  .splash-logo svg{height:80px !important;}
  .features-grid-3{grid-template-columns:1fr;}
  .dash-stats{flex-direction:column;}
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

    // === NETWORK PARTICLES ===
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 150;
    const MOUSE_RADIUS = 200;

    const mouse = { x: -9999, y: -9999 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = hc.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => { mouse.x = -9999; mouse.y = -9999; };
    hc.parentElement?.addEventListener('mousemove', handleMouseMove);
    hc.parentElement?.addEventListener('mouseleave', handleMouseLeave);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      radius: number; hue: number; alpha: number;
    }> = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * hc.width,
        y: Math.random() * hc.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: 1.5 + Math.random() * 2.5,
        hue: 15 + Math.random() * 25,
        alpha: 0.4 + Math.random() * 0.5,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, hc.width, hc.height);

      for (const p of particles) {
        const dxM = mouse.x - p.x;
        const dyM = mouse.y - p.y;
        const distM = Math.sqrt(dxM * dxM + dyM * dyM);
        if (distM < MOUSE_RADIUS && distM > 0) {
          const force = (MOUSE_RADIUS - distM) / MOUSE_RADIUS * 0.02;
          p.vx += dxM / distM * force;
          p.vy += dyM / distM * force;
        }
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = hc.width + 20;
        if (p.x > hc.width + 20) p.x = -20;
        if (p.y < -20) p.y = hc.height + 20;
        if (p.y > hc.height + 20) p.y = -20;
      }

      // Draw connections between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const opacity = (1 - dist / CONNECTION_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(240,90,40,${opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw mouse connections
      if (mouse.x > 0 && mouse.y > 0) {
        for (const p of particles) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            const opacity = (1 - dist / MOUSE_RADIUS) * 0.4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(245,166,35,${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // Draw particle nodes
      for (const p of particles) {
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4);
        glow.addColorStop(0, `hsla(${p.hue},85%,60%,${p.alpha * 0.15})`);
        glow.addColorStop(1, `hsla(${p.hue},85%,60%,0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(p.x - p.radius * 4, p.y - p.radius * 4, p.radius * 8, p.radius * 8);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.alpha})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
      hc.parentElement?.removeEventListener('mousemove', handleMouseMove);
      hc.parentElement?.removeEventListener('mouseleave', handleMouseLeave);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    const particlesEl = heroParticlesRef.current;
    if (!particlesEl) return;

    particlesEl.innerHTML = '';
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const dur = 6 + Math.random() * 8;
      const delay = Math.random() * 8;
      const size = 2 + Math.random() * 5;
      p.style.cssText = `left:${Math.random() * 100}%;--dur:${dur}s;--delay:${delay}s;width:${size}px;height:${size}px;`;
      particlesEl.appendChild(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // === SPINNING WIREFRAME SPHERE ===
  useEffect(() => {
    if (loading) return;
    const sc = sphereCanvasRef.current;
    if (!sc) return;
    const ctx = sc.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const SIZE = 340;
    sc.width = SIZE * dpr;
    sc.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R = 130;
    const MERIDIANS = 14;
    const PARALLELS = 10;
    const FOV = 600;
    const STEPS = 60;

    let rotation = 0;
    let sphereAnim: number;

    const project = (x3: number, y3: number, z3: number) => {
      const scale = FOV / (FOV + z3);
      return { x: cx + x3 * scale, y: cy + y3 * scale, s: scale, z: z3 };
    };

    const drawSphere = () => {
      ctx.clearRect(0, 0, SIZE, SIZE);

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 1.35);
      outerGlow.addColorStop(0, 'rgba(240,90,40,0.06)');
      outerGlow.addColorStop(0.5, 'rgba(240,90,40,0.03)');
      outerGlow.addColorStop(1, 'rgba(240,90,40,0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, SIZE, SIZE);

      // Gradient ring
      const ringWidth = 2.5;
      for (let a = 0; a < Math.PI * 2; a += 0.02) {
        const rx = cx + (R + 8) * Math.cos(a);
        const ry = cy + (R + 8) * Math.sin(a);
        const t = (a + Math.PI) / (Math.PI * 2);
        let r2: number, g: number, b: number;
        if (t < 0.5) {
          const p = t * 2;
          r2 = 240 + (208 - 240) * p;
          g = 90 + (65 - 90) * p;
          b = 40 + (8 - 40) * p;
        } else {
          const p = (t - 0.5) * 2;
          r2 = 208 + (245 - 208) * p;
          g = 65 + (122 - 65) * p;
          b = 8 + (74 - 8) * p;
        }
        const alpha = 0.6 + 0.3 * Math.sin(a * 2 + rotation * 0.5);
        ctx.beginPath();
        ctx.arc(rx, ry, ringWidth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${Math.round(r2)},${Math.round(g)},${Math.round(b)},${alpha})`;
        ctx.fill();
      }

      // Collect all wireframe segments with depth for sorting
      const lines: Array<{x1:number;y1:number;x2:number;y2:number;z:number;type:string}> = [];
      const nodes: Array<{x:number;y:number;z:number;s:number}> = [];

      // Meridians (longitude lines)
      for (let m = 0; m < MERIDIANS; m++) {
        const phi = (m / MERIDIANS) * Math.PI * 2 + rotation;
        let prev: {x:number;y:number;s:number;z:number} | null = null;
        for (let s = 0; s <= STEPS; s++) {
          const theta = (s / STEPS) * Math.PI;
          const x3 = R * Math.sin(theta) * Math.cos(phi);
          const y3 = R * Math.cos(theta);
          const z3 = R * Math.sin(theta) * Math.sin(phi);
          const pt = project(x3, y3, z3);
          if (prev) {
            lines.push({ x1: prev.x, y1: prev.y, x2: pt.x, y2: pt.y, z: (prev.z + pt.z) / 2, type: 'meridian' });
          }
          prev = pt;
          // Node at intersections with parallels
          if (s > 0 && s < STEPS && s % (STEPS / PARALLELS) === 0) {
            nodes.push(pt);
          }
        }
      }

      // Parallels (latitude lines)
      for (let p = 1; p < PARALLELS; p++) {
        const theta = (p / PARALLELS) * Math.PI;
        let prev: {x:number;y:number;s:number;z:number} | null = null;
        for (let s = 0; s <= STEPS; s++) {
          const phi = (s / STEPS) * Math.PI * 2 + rotation;
          const x3 = R * Math.sin(theta) * Math.cos(phi);
          const y3 = R * Math.cos(theta);
          const z3 = R * Math.sin(theta) * Math.sin(phi);
          const pt = project(x3, y3, z3);
          if (prev) {
            lines.push({ x1: prev.x, y1: prev.y, x2: pt.x, y2: pt.y, z: (prev.z + pt.z) / 2, type: 'parallel' });
          }
          prev = pt;
        }
      }

      // Sort back to front
      lines.sort((a2, b2) => b2.z - a2.z);
      nodes.sort((a2, b2) => b2.z - a2.z);

      // Draw wireframe
      for (const l of lines) {
        const depth = (l.z + R) / (2 * R);
        const alpha = 0.05 + depth * 0.35;
        ctx.beginPath();
        ctx.moveTo(l.x1, l.y1);
        ctx.lineTo(l.x2, l.y2);
        ctx.strokeStyle = `rgba(245,122,74,${alpha})`;
        ctx.lineWidth = 0.4 + depth * 0.6;
        ctx.stroke();
      }

      // Draw nodes
      for (const n of nodes) {
        const depth = (n.z + R) / (2 * R);
        const alpha = 0.15 + depth * 0.6;
        const nr = 1 + depth * 2;
        // Glow
        const ng = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, nr * 4);
        ng.addColorStop(0, `rgba(245,166,35,${alpha * 0.3})`);
        ng.addColorStop(1, 'rgba(245,166,35,0)');
        ctx.fillStyle = ng;
        ctx.fillRect(n.x - nr * 4, n.y - nr * 4, nr * 8, nr * 8);
        // Dot
        ctx.beginPath();
        ctx.arc(n.x, n.y, nr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,166,35,${alpha})`;
        ctx.fill();
      }

      // Center glow
      const cGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6);
      cGlow.addColorStop(0, 'rgba(255,255,255,0.35)');
      cGlow.addColorStop(0.2, 'rgba(245,166,35,0.12)');
      cGlow.addColorStop(0.5, 'rgba(240,90,40,0.04)');
      cGlow.addColorStop(1, 'rgba(240,90,40,0)');
      ctx.fillStyle = cGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.6, 0, Math.PI * 2);
      ctx.fill();

      rotation += 0.004;
      sphereAnim = requestAnimationFrame(drawSphere);
    };

    drawSphere();

    return () => { cancelAnimationFrame(sphereAnim); };
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
        const suffix = (el as HTMLElement).getAttribute('data-suffix') || '+';
        const duration = 1800;
        const start = performance.now();

        const update = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.floor(eased * target);

          if (target >= 2000) {
            (el as HTMLElement).textContent = current.toLocaleString('fr-FR') + '+';
          } else {
            (el as HTMLElement).textContent = current + suffix;
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
      const item = question.closest('.faq-item');
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

    // Dashboard preview tabs
    const handleTabClick = (e: Event) => {
      const btn = (e.target as HTMLElement).closest('[data-tab]') as HTMLElement | null;
      if (!btn) return;
      const tab = btn.dataset.tab;
      document.querySelectorAll('#dash-toggle .dash-toggle-btn').forEach((b) => {
        b.classList.remove('dash-toggle-active');
        b.classList.add('dash-toggle-inactive');
      });
      btn.classList.remove('dash-toggle-inactive');
      btn.classList.add('dash-toggle-active');
      document.querySelectorAll('.dash-view').forEach((v) => v.classList.remove('active'));
      const target = document.getElementById(`dash-${tab}`);
      if (target) target.classList.add('active');
    };

    document.querySelectorAll('#dash-toggle .dash-toggle-btn').forEach((b) => {
      b.addEventListener('click', handleTabClick);
    });

    return () => {
      document.querySelectorAll('.faq-question').forEach((q) => {
        q.removeEventListener('click', handleFaqClick);
      });
      document.querySelectorAll('#dash-toggle .dash-toggle-btn').forEach((b) => {
        b.removeEventListener('click', handleTabClick);
      });
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
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (menuBtn && navLinks) {
      const toggleMenu = () => navLinks.classList.toggle('open');
      menuBtn.addEventListener('click', toggleMenu);

      // Close mobile menu when a link is clicked
      navLinks.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => navLinks.classList.remove('open'));
      });

      return () => {
        menuBtn.removeEventListener('click', toggleMenu);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 200" height="120" style={{ filter: 'drop-shadow(0 8px 60px rgba(240,90,40,0.25))' }}>
            <defs>
              <linearGradient id="sClosG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F57A4A" />
                <stop offset="40%" stopColor="#F05A28" />
                <stop offset="100%" stopColor="#D04510" />
              </linearGradient>
              <linearGradient id="sHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E8E6DF" />
              </linearGradient>
              <linearGradient id="sOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F57A4A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F05A28" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g transform="translate(58, 78)">
              <circle cx="0" cy="0" r="30" fill="url(#sHubG)" />
              <circle cx="0" cy="0" r="30" fill="none" stroke="#F05A28" strokeWidth="0.8" opacity="0.15" />
              <path d="M-11,-13 L-11,13 M-11,0 L11,0 M11,-13 L11,13" stroke="url(#sClosG)" strokeWidth="3.8" strokeLinecap="round" fill="none" />
              <line x1="26" y1="-16" x2="44" y2="-30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <line x1="30" y1="0" x2="48" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <line x1="26" y1="16" x2="44" y2="30" stroke="rgba(255,255,255,0.15)" strokeWidth="1.3" />
              <circle cx="48" cy="-34" r="6" fill="#F57A4A" />
              <circle cx="52" cy="0" r="6" fill="#F05A28" />
              <circle cx="48" cy="34" r="6" fill="#F57A4A" />
            </g>
            <text x="125" y="100" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="68" fill="url(#sHubG)" letterSpacing="-2.5">HUB</text>
            <text x="305" y="100" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="68" fill="url(#sClosG)" letterSpacing="-2.5">Closing</text>
            <text x="127" y="134" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="20" fill="url(#sOppoG)" letterSpacing="1">Opportunités</text>
            <circle cx="272" cy="128" r="2.5" fill="#F05A28" opacity="0.3" />
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
                <stop offset="0%" stopColor="#F57A4A" />
                <stop offset="40%" stopColor="#F05A28" />
                <stop offset="100%" stopColor="#D04510" />
              </linearGradient>
              <linearGradient id="navHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E8E6DF" />
              </linearGradient>
              <linearGradient id="navOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F57A4A" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#F05A28" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <g transform="translate(28, 48)">
              <circle cx="0" cy="0" r="18" fill="url(#navHubG)" />
              <circle cx="0" cy="0" r="18" fill="none" stroke="#F05A28" strokeWidth="0.5" opacity="0.15" />
              <path d="M-7,-8 L-7,8 M-7,0 L7,0 M7,-8 L7,8" stroke="url(#navClosingG)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <line x1="16" y1="-10" x2="26" y2="-18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="18" y1="0" x2="28" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="16" y1="10" x2="26" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <circle cx="28" cy="-20" r="3.5" fill="#F57A4A" />
              <circle cx="31" cy="0" r="3.5" fill="#F05A28" />
              <circle cx="28" cy="20" r="3.5" fill="#F57A4A" />
            </g>
            <text x="72" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#navHubG)" letterSpacing="-1.5">HUB</text>
            <text x="172" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#navClosingG)" letterSpacing="-1.5">Closing</text>
            <text x="73" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="12" fill="url(#navOppoG)" letterSpacing="0.8">Opportunités</text>
            <circle cx="128" cy="78" r="1.5" fill="#F05A28" opacity="0.3" />
            <text x="138" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="400" fontSize="8" fill="rgba(255,255,255,0.3)" letterSpacing="2">CONNECTEZ . CLOSEZ . ÉVOLUEZ</text>
          </svg>
        </Link>
        <div className="nav-links" id="navLinks">
          <a href="#features">Fonctionnalités</a>
          <a href="#comment">Comment ça marche</a>
          <a href="#faq">FAQ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/auth/login" className="nav-cta-ghost">Connexion</Link>
          <Link href="/auth/register" className="nav-cta"><span>S&apos;inscrire</span></Link>
          <button className="nav-menu-btn" id="menuBtn" aria-label="Menu">⋮</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-network"><canvas ref={heroCanvasRef} id="heroCanvas" /></div>
        <div className="hero-rays" />
        <div className="hero-flare" />
        <div className="hero-particles" ref={heroParticlesRef} id="heroParticles" />

        <div className="hero-pill">
          <span className="hero-pill-dot" />
          <span>La 1ère plateforme dédiée au closing</span>
        </div>
        <h1>
          <span className="white">Vous avez du mal à trouver des closers performants ?</span><br />
          <span className="accent">Vous cherchez votre prochaine mission ?</span>
        </h1>
        <p className="hero-desc">
          HUBClosing connecte les candidats (closers et setters) avec les recruteurs qui ont besoin d&apos;eux. Marketplace, outils de suivi, coaching — tout en un.
        </p>
        <div className="hero-sphere"><canvas ref={sphereCanvasRef} /></div>
        <div className="hero-btns">
          <Link href="/auth/register" className="btn btn-primary"><span>Je suis candidat</span></Link>
          <Link href="/auth/register" className="btn btn-ghost">Je suis recruteur</Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><div className="hero-stat-num" data-count="2800" data-suffix="+">0</div><div className="hero-stat-label">Professionnels réunis</div></div>
          <div className="hero-stat"><div className="hero-stat-num" data-count="250" data-suffix="+">0</div><div className="hero-stat-label">Offres publiées</div></div>
          <div className="hero-stat"><div className="hero-stat-num" data-count="98" data-suffix="%">0</div><div className="hero-stat-label">Satisfaction</div></div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <div className="band band-light" data-nav-theme="white">
        <section className="section-alt" id="pourqui" style={{ background: 'transparent' }}>
          <div className="section-inner">
            <div className="slabel reveal">Pour qui ?</div>
            <div className="stitle reveal">Identifiez-vous <span className="accent">en un instant</span></div>
            <div className="sdesc reveal">Que vous soyez candidat ou recruteur, HUBClosing résout vos problèmes concrets.</div>
            <div className="pain-grid">
              <div className="pain-card reveal reveal-delay-1">
                <div className="pain-icon">🎯</div>
                <div className="pain-title">Vous êtes candidat et vous ne trouvez pas de mission ?</div>
                <div className="pain-desc">Marre de chercher des offres sur 10 groupes différents ? De ne pas savoir si votre candidature a été vue ? De ne pas avoir de retour ?</div>
                <div className="pain-label">HUBClosing vous donne :</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Des offres qualifiées au même endroit</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Un profil visible par les recruteurs</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Un suivi de vos performances</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Une réputation qui vous suit</div>
              </div>
              <div className="pain-card reveal reveal-delay-2">
                <div className="pain-icon">📋</div>
                <div className="pain-title">Vous êtes recruteur et vous ne trouvez pas de top profils ?</div>
                <div className="pain-desc">Vous perdez du temps à filtrer des candidats non qualifiés ? Impossible de vérifier leur track record ? Vos closers partent au bout de 2 semaines ?</div>
                <div className="pain-label">HUBClosing vous donne :</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Un questionnaire qui cible vos besoins précis</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Des candidats avec réputation vérifiée</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Un dashboard de suivi en temps réel</div>
                <div className="pain-check"><span className="pain-check-icon">✓</span> Les meilleures data pour trouver vos pépites</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* PLATFORM PREVIEW */}
      <div className="app-preview-section">
        <div className="app-preview-wrap reveal scale-in">
          <div className="app-preview-label"><span>Aperçu de la plateforme</span></div>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="stitle" style={{ color: 'var(--cream)' }}>Un aperçu de votre futur <span className="accent">dashboard</span></div>
          </div>
          <div className="dash-preview">
            <div className="dash-topbar">
              <div className="app-dot" />
              <div className="app-dot" />
              <div className="app-dot" />
              <div style={{ flex: 1, textAlign: 'center', fontSize: '12px', color: 'var(--gray-s)', fontWeight: 500, letterSpacing: '0.5px' }}>hubclosing.fr/dashboard</div>
            </div>
            <div style={{ padding: '20px 20px 0' }}>
              <div className="dash-toggle" id="dash-toggle">
                <div className="dash-toggle-btn dash-toggle-active" data-tab="candidat">Vue candidat</div>
                <div className="dash-toggle-btn dash-toggle-inactive" data-tab="recruteur">Vue recruteur</div>
              </div>
            </div>

            {/* ── Vue Candidat ── */}
            <div className="dash-view active" id="dash-candidat">
              <div className="dash-sidebar">
                <div className="dash-sidebar-item active"><span className="dash-sidebar-icon">📊</span>Dashboard</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">💼</span>Offres</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">📈</span>Tracking</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">💬</span>Messages</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">👤</span>Profil</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">🎓</span>Coaching</div>
              </div>
              <div className="dash-main">
                <div className="dash-welcome">Bonjour Julien <span>— Closer Elite</span></div>
                <div className="dash-stats">
                  <div className="dash-stat-card" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: 'var(--success)' }}>12</div>
                    <div className="dash-stat-label" style={{ color: 'var(--success)' }}>Calls ce mois</div>
                  </div>
                  <div className="dash-stat-card" style={{ background: 'rgba(240,90,40,0.08)', border: '1px solid rgba(240,90,40,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: 'var(--amber-l)' }}>67%</div>
                    <div className="dash-stat-label" style={{ color: 'var(--amber-l)' }}>Taux de closing</div>
                  </div>
                  <div className="dash-stat-card" style={{ background: 'rgba(251,190,94,0.08)', border: '1px solid rgba(251,190,94,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: 'var(--amber-g)' }}>3</div>
                    <div className="dash-stat-label" style={{ color: 'var(--amber-g)' }}>Médailles</div>
                  </div>
                </div>
                <div className="dash-offers-title">Offres recommandées</div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Closer Coaching Business</div>
                    <div className="dash-offer-sub">MindSet Academy — 15-20% commission — Paris</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Nouveau</div>
                </div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Setter E-commerce Premium</div>
                    <div className="dash-offer-sub">ScaleUp Pro — 8-12% commission — Remote</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>Urgent</div>
                </div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Closer Formation Santé</div>
                    <div className="dash-offer-sub">VitaLife — 20-25% commission — Remote</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>Remote</div>
                </div>
              </div>
            </div>

            {/* ── Vue Recruteur ── */}
            <div className="dash-view" id="dash-recruteur">
              <div className="dash-sidebar">
                <div className="dash-sidebar-item active"><span className="dash-sidebar-icon">📊</span>Dashboard</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">📝</span>Mes offres</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">👥</span>Candidatures</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">📂</span>CVthèque</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">💬</span>Messages</div>
                <div className="dash-sidebar-item"><span className="dash-sidebar-icon">⭐</span>Réputation</div>
              </div>
              <div className="dash-main">
                <div className="dash-welcome">Bonjour Sarah <span>— Recruteur Pro</span></div>
                <div className="dash-stats">
                  <div className="dash-stat-card" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: '#818CF8' }}>3</div>
                    <div className="dash-stat-label" style={{ color: '#818CF8' }}>Offres actives</div>
                  </div>
                  <div className="dash-stat-card" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: 'var(--success)' }}>18</div>
                    <div className="dash-stat-label" style={{ color: 'var(--success)' }}>Candidatures reçues</div>
                  </div>
                  <div className="dash-stat-card" style={{ background: 'rgba(240,90,40,0.08)', border: '1px solid rgba(240,90,40,0.12)' }}>
                    <div className="dash-stat-num" style={{ color: 'var(--amber-l)' }}>4.8</div>
                    <div className="dash-stat-label" style={{ color: 'var(--amber-l)' }}>Score réputation</div>
                  </div>
                </div>
                <div className="dash-offers-title">Dernières candidatures</div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Julien M. — Closer</div>
                    <div className="dash-offer-sub">A postulé à &quot;Closer Coaching Business&quot; — il y a 2h</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Nouveau</div>
                </div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Emma R. — Setter</div>
                    <div className="dash-offer-sub">A postulé à &quot;Setter E-commerce Premium&quot; — il y a 5h</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(240,90,40,0.1)', color: 'var(--amber-l)' }}>En attente</div>
                </div>
                <div className="dash-offer">
                  <div>
                    <div className="dash-offer-title">Thomas K. — Closer</div>
                    <div className="dash-offer-sub">A postulé à &quot;Closer Formation Santé&quot; — hier</div>
                  </div>
                  <div className="dash-offer-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#818CF8' }}>Vu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="band band-dark" data-nav-theme="dark">
        <section className="section" id="features">
          <div className="slabel reveal">Fonctionnalités</div>
          <div className="stitle reveal">Tout ce dont vous avez besoin, <span className="accent">au même endroit</span></div>
          <div className="sdesc reveal">Plus qu&apos;une marketplace — un écosystème complet pour réussir.</div>
          <div className="features-grid-3">
            <div className="feature-card reveal reveal-delay-1">
              <div className="feature-icon feature-icon-amber">🏢</div>
              <h3>Marketplace</h3>
              <p>Publiez et postulez aux offres. Matching candidats × recruteurs.</p>
            </div>
            <div className="feature-card reveal reveal-delay-2">
              <div className="feature-icon feature-icon-amber">🎯</div>
              <h3>Tracking calls</h3>
              <p>Suivez vos appels, taux de closing et performances en temps réel.</p>
            </div>
            <div className="feature-card reveal reveal-delay-3">
              <div className="feature-icon feature-icon-amber">🏅</div>
              <h3>Médailles <span className="opt-badge">Optionnel</span></h3>
              <p>Activez les badges de performance si vous le souhaitez. Visibles sur votre profil.</p>
            </div>
            <div className="feature-card reveal reveal-delay-1">
              <div className="feature-icon feature-icon-amber">🎓</div>
              <h3>Coaching</h3>
              <p>Réservez des sessions avec des coachs experts en closing.</p>
            </div>
            <div className="feature-card reveal reveal-delay-2">
              <div className="feature-icon feature-icon-amber">📄</div>
              <h3>CVthèque</h3>
              <p>Créez votre profil candidat. Les recruteurs vous trouvent directement.</p>
            </div>
            <div className="feature-card reveal reveal-delay-3">
              <div className="feature-icon feature-icon-amber">💬</div>
              <h3>Messagerie</h3>
              <p>Échangez directement avec les recruteurs ou candidats.</p>
            </div>
            <div className="feature-card reveal reveal-delay-1">
              <div className="feature-icon feature-icon-amber">⭐</div>
              <h3>Avis et notation</h3>
              <p>Évaluez et soyez évalué après chaque collaboration.</p>
            </div>
            <div className="feature-card reveal reveal-delay-2">
              <div className="feature-icon feature-icon-amber">📋</div>
              <h3>Questionnaire recruteur</h3>
              <p>Recueillez les meilleures data pour trouver vos pépites.</p>
            </div>
            <div className="feature-card reveal reveal-delay-3">
              <div className="feature-icon feature-icon-amber">📊</div>
              <h3>Dashboard analytics</h3>
              <p>Tableaux de bord complets pour candidats et recruteurs.</p>
            </div>
          </div>
        </section>
      </div>

      {/* COMMENT CA MARCHE */}
      <div className="band band-light" data-nav-theme="white">
        <section className="section-alt" id="comment" style={{ background: 'transparent' }}>
          <div className="section-inner">
            <div className="slabel reveal">Comment ça marche</div>
            <div className="stitle reveal">Opérationnel en <span className="accent">3 étapes</span></div>
            <div className="sdesc reveal">Candidat ou recruteur, démarrez en moins de 5 minutes.</div>
            <div className="steps-grid">
              <div className="step-card reveal reveal-delay-1">
                <div className="step-num">1</div>
                <h3>Créez votre compte gratuit</h3>
                <p>Inscription en 30 secondes. Accédez immédiatement aux offres.</p>
              </div>
              <div className="step-card reveal reveal-delay-2">
                <div className="step-num">2</div>
                <h3>Complétez votre profil</h3>
                <p>Renseignez votre expérience et vos spécialités pour un meilleur matching.</p>
              </div>
              <div className="step-card reveal reveal-delay-3">
                <div className="step-num">3</div>
                <h3>Trouvez votre match</h3>
                <p>Postulez aux offres ou recevez des candidatures qualifiées.</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* TEMOIGNAGES */}
      <div className="band band-light" data-nav-theme="white">
        <section className="section-alt" id="temoignages" style={{ background: 'transparent' }}>
          <div className="section-inner">
            <div className="slabel reveal">Témoignages</div>
            <div className="stitle reveal">Ils nous font <span className="accent">déjà confiance</span></div>
            <div className="sdesc reveal">Plus de 2 500 professionnels font confiance à HUBClosing.</div>
          </div>

          {/* Rangée 1 */}
          <div className="testimonials-marquee-wrap" style={{ marginBottom: '20px' }}>
            <div className="testimonials-marquee">
              {[...Array(2)].map((_, dup) => (
                <div key={`r1-${dup}`} style={{ display: 'flex', gap: '20px' }}>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-closer">Closer</div>
                    <div className="testimonial-text">{`"Avant je passais des heures à chercher des offres sur les groupes Facebook. Maintenant j'ai tout au même endroit, avec des infos claires sur les commissions."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),var(--amber-d))' }}>M</div>
                      <div><div className="testimonial-name">Julien R.</div><div className="testimonial-role">Closer — Niche coaching</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-recruteur">Recruteur</div>
                    <div className="testimonial-text">{`"En tant que recruteur, trouver un bon closer c'est le nerf de la guerre. Avoir une base de profils qualifiés, c'est exactement ce qu'il nous manquait."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>S</div>
                      <div><div className="testimonial-name">Sophie L.</div><div className="testimonial-role">Head of Sales — E-commerce</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-setter">Setter</div>
                    <div className="testimonial-text">{`"Grâce à HUBClosing, j'ai trouvé 3 programmes à setter en moins d'une semaine. Les fiches sont complètes et je sais exactement à quoi m'attendre avant de postuler."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#2B5E9E,#1A3F6F)' }}>A</div>
                      <div><div className="testimonial-name">Anaïs D.</div><div className="testimonial-role">Setter — Bien-être</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-recruteur">Recruteur</div>
                    <div className="testimonial-text">{`"J'ai posté une offre le lundi, j'avais 12 candidatures qualifiées le mercredi. Le gain de temps est énorme par rapport aux recrutements classiques."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#059669,#047857)' }}>T</div>
                      <div><div className="testimonial-name">Thomas V.</div><div className="testimonial-role">Recruteur — Formation trading</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-closer">Closer</div>
                    <div className="testimonial-text">{`"Ce qui me plaît c'est la transparence. On voit les commissions, le panier moyen, le type de produit. Plus de mauvaises surprises en entretien."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),#C06A20)' }}>J</div>
                      <div><div className="testimonial-name">Julien M.</div><div className="testimonial-role">Closer — Immobilier digital</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-recruteur">Recruteur</div>
                    <div className="testimonial-text">{`"On a structuré toute notre équipe sales grâce à HUBClosing. 4 closers recrutés en un mois, tous encore en poste 6 mois plus tard. La qualité est là."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)' }}>N</div>
                      <div><div className="testimonial-name">Nicolas P.</div><div className="testimonial-role">Recruteur — Agence marketing</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rangée 2 */}
          <div className="testimonials-marquee-wrap">
            <div className="testimonials-marquee testimonials-marquee-row2">
              {[...Array(2)].map((_, dup) => (
                <div key={`r2-${dup}`} style={{ display: 'flex', gap: '20px' }}>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-setter">Setter</div>
                    <div className="testimonial-text">{`"La communauté WhatsApp est un vrai plus. On échange les tips, on se recommande des programmes. C'est un réseau de confiance entre setters."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#2B5E9E,#1E40AF)' }}>L</div>
                      <div><div className="testimonial-name">Laura C.</div><div className="testimonial-role">Setter — Développement personnel</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-closer">Closer</div>
                    <div className="testimonial-text">{`"La communauté est incroyable. On s'entraide, on partage les bons plans. HUBClosing c'est plus qu'une plateforme, c'est une famille de sales."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),var(--amber-d))' }}>K</div>
                      <div><div className="testimonial-name">Karim B.</div><div className="testimonial-role">Closer — Formation en ligne</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-recruteur">Recruteur</div>
                    <div className="testimonial-text">{`"Fini le temps où je devais poster dans 15 groupes Telegram pour trouver un closer. Ici tout est centralisé et pro. C'est le LinkedIn du closing."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#059669,#10B981)' }}>E</div>
                      <div><div className="testimonial-name">Emma G.</div><div className="testimonial-role">Recruteur — SaaS B2B</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-recruteur">Recruteur</div>
                    <div className="testimonial-text">{`"Le dashboard analytics est top. Je suis mes KPIs de recrutement, le taux de conversion des candidatures. Ça professionnalise tout le process."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}>R</div>
                      <div><div className="testimonial-name">Romain A.</div><div className="testimonial-role">Recruteur — Programme high-ticket</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-setter">Setter</div>
                    <div className="testimonial-text">{`"En 3 mois sur HUBClosing, j'ai doublé mes revenus. Les opportunités sont mieux qualifiées qu'ailleurs et les managers sont sérieux."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,#2B5E9E,#1A3F6F)' }}>Y</div>
                      <div><div className="testimonial-name">Yasmine H.</div><div className="testimonial-role">Setter — Coaching business</div></div>
                    </div>
                  </div>
                  <div className="testimonial-card">
                    <div className="testimonial-badge badge-closer">Closer</div>
                    <div className="testimonial-text">{`"J'étais sceptique au début, encore une plateforme... Mais la qualité des offres m'a convaincu. Maintenant c'est mon outil n°1 pour trouver des missions."`}</div>
                    <div className="testimonial-author">
                      <div className="testimonial-avatar" style={{ background: 'linear-gradient(135deg,var(--amber),#B8651A)' }}>D</div>
                      <div><div className="testimonial-name">Dylan F.</div><div className="testimonial-role">Closer — Crypto & finance</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ maxWidth: '1100px', margin: '32px auto 0', padding: '0 24px' }}>
            <div className="reveal" style={{
              background: 'rgba(240,90,40,0.06)',
              border: '1px solid rgba(240,90,40,0.12)',
              borderRadius: '14px',
              padding: '18px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <span style={{ fontSize: '28px' }}>👥</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#1A1A18' }}>+2 500 professionnels du closing</div>
                <div style={{ fontSize: '13px', color: '#5A5A52' }}>issus du groupe WhatsApp Opportunités, désormais regroupés sur HUBClosing.</div>
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
                <span>HUBClosing, c&apos;est quoi exactement ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">HUBClosing est la première plateforme dédiée au closing. Nous connectons les candidats (closers et setters) avec les recruteurs qui recherchent des talents pour vendre leurs formations, coachings et programmes.</div>
            </div>
            <div className="faq-item reveal reveal-delay-2">
              <div className="faq-question">
                <span>C&apos;est gratuit ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">L&apos;inscription est 100% gratuite. Créez votre profil, parcourez les offres et postulez sans frais. Des fonctionnalités premium sont disponibles pour booster votre visibilité.</div>
            </div>
            <div className="faq-item reveal reveal-delay-3">
              <div className="faq-question">
                <span>Je suis débutant, c&apos;est pour moi ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Absolument. HUBClosing accueille tous les niveaux. Le système de médailles est optionnel et le coaching vous aide à progresser à votre rythme.</div>
            </div>
            <div className="faq-item reveal reveal-delay-4">
              <div className="faq-question">
                <span>Comment fonctionne le système de réputation ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Après chaque collaboration, candidats et recruteurs s&apos;évaluent mutuellement. Votre score de réputation est visible sur votre profil et vous aide à décrocher de meilleures opportunités.</div>
            </div>
            <div className="faq-item reveal">
              <div className="faq-question">
                <span>Je suis recruteur, comment publier une offre ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Inscrivez-vous, complétez le questionnaire recruteur qui nous aide à comprendre vos besoins précis, puis publiez votre offre en quelques clics. Vous recevrez des candidatures qualifiées directement.</div>
            </div>
            <div className="faq-item reveal">
              <div className="faq-question">
                <span>Mes données sont-elles sécurisées ?</span>
                <div className="faq-arrow">+</div>
              </div>
              <div className="faq-answer">Oui. Vos données sont hébergées en Europe, chiffrées et ne sont jamais partagées avec des tiers. Nous respectons le RGPD.</div>
            </div>
          </div>
        </section>
      </div>

      {/* CTA FINAL */}
      <div className="band band-dark" data-nav-theme="dark">
        <section className="cta-section" id="rejoindre">
          <div className="slabel reveal">REJOIGNEZ-NOUS</div>
          <h2 className="reveal"><span style={{ color: 'var(--cream)' }}>Prêt à trouver votre prochain </span><span className="accent" style={{ background: 'linear-gradient(135deg,var(--amber-g),var(--amber),var(--amber-d))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>match</span><span style={{ color: 'var(--cream)' }}> ?</span></h2>
          {isLoggedIn ? (
            <Link href="/dashboard" className="btn btn-primary reveal" style={{ marginTop: '32px' }}>
              <span>Accéder au Dashboard</span>
            </Link>
          ) : (
            <>
              <p className="reveal" style={{ maxWidth: '520px', margin: '0 auto 32px', lineHeight: '1.8' }}>
                Inscription gratuite — accédez aux offres en quelques clics.
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
                    <stop offset="0%" stopColor="#F57A4A" />
                    <stop offset="40%" stopColor="#F05A28" />
                    <stop offset="100%" stopColor="#D04510" />
                  </linearGradient>
                  <linearGradient id="fHubG" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="100%" stopColor="#E8E6DF" />
                  </linearGradient>
                  <linearGradient id="fOppoG" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F57A4A" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#F05A28" stopOpacity="0.9" />
                  </linearGradient>
                </defs>
                <g transform="translate(28, 48)">
                  <circle cx="0" cy="0" r="18" fill="url(#fHubG)" />
                  <circle cx="0" cy="0" r="18" fill="none" stroke="#F05A28" strokeWidth="0.5" opacity="0.15" />
                  <path d="M-7,-8 L-7,8 M-7,0 L7,0 M7,-8 L7,8" stroke="url(#fClosG)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <line x1="16" y1="-10" x2="26" y2="-18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <line x1="18" y1="0" x2="28" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <line x1="16" y1="10" x2="26" y2="18" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
                  <circle cx="28" cy="-20" r="3.5" fill="#F57A4A" />
                  <circle cx="31" cy="0" r="3.5" fill="#F05A28" />
                  <circle cx="28" cy="20" r="3.5" fill="#F57A4A" />
                </g>
                <text x="72" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#fHubG)" letterSpacing="-1.5">HUB</text>
                <text x="172" y="60" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="800" fontSize="40" fill="url(#fClosG)" letterSpacing="-1.5">Closing</text>
                <text x="73" y="82" fontFamily="'Plus Jakarta Sans','DM Sans','Inter',sans-serif" fontWeight="600" fontSize="12" fill="url(#fOppoG)" letterSpacing="0.8">Opportunités</text>
              </svg>
            </div>
            <p className="footer-desc">La première plateforme qui connecte les candidats avec les recruteurs dans l&apos;univers du closing.</p>
          </div>
          <div className="footer-col">
            <h4>Plateforme</h4>
            <Link href="/closers">Candidats (closers, setters)</Link>
            <Link href="/managers">Recruteurs (HOS, managers, infopreneurs)</Link>
            <a href="#faq">FAQ</a>
            <Link href="/auth/login">Connexion</Link>
          </div>
          <div className="footer-col">
            <h4>Légal</h4>
            <Link href="/legal/mentions">Mentions légales</Link>
            <Link href="/legal/cgu">CGU</Link>
            <Link href="/legal/privacy">Politique de confidentialité</Link>
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

        </div>
      </footer>
    </>
  );
};

export default HOME;
