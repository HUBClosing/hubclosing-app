'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManagersPage() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Nav scroll effect
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 50) {
        setNavScrolled(true);
      } else {
        setNavScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Scroll reveal with IntersectionObserver
    const cards = document.querySelectorAll('.feature-card, .dashboard-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.animationPlayState = 'running';
        }
      });
    }, { threshold: 0.25 });

    cards.forEach((card) => {
      observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    (e.currentTarget as HTMLElement).style.setProperty('--x', `${x}px`);
    (e.currentTarget as HTMLElement).style.setProperty('--y', `${y}px`);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert('Merci ! Nous vous recontacterons très bientôt.');
    e.currentTarget.reset();
  };

  const handleSmoothScroll = () => {
    const element = document.getElementById('rejoindre');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
    .nav-links a.nav-active{color:var(--amber);}
    .nav-links a.nav-active::after{width:100%;}
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
    .hero-logo{display:none;}
    @keyframes fadeInDown{from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);}}
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

    /* ===== SECTION TITLE ===== */
    .section{padding:120px 24px;max-width:1200px;margin:0 auto;}
    .slabel{font-size:13px;font-weight:600;letter-spacing:0.5px;color:var(--amber);text-transform:uppercase;margin-bottom:12px;display:block;}
    .stitle{font-size:clamp(28px,4vw,48px);font-weight:800;letter-spacing:-1px;margin-bottom:24px;color:var(--cream);}
    .stitle .accent{background:linear-gradient(135deg,var(--amber-g),var(--amber),var(--amber-d));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .sdesc{font-size:clamp(16px,2vw,18px);color:var(--gray-l);max-width:600px;line-height:1.8;}

    /* ===== FEATURES GRID ===== */
    .features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;margin-top:60px;}
    .feature-card{background:var(--card);border:1px solid var(--card-b);border-radius:20px;padding:40px 28px;transition:all 0.4s cubic-bezier(0.16,1,0.3,1);position:relative;overflow:hidden;opacity:0;animation:slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards;}
    .feature-card::before{content:'';position:absolute;inset:0;background:radial-gradient(400px circle at var(--x,50%) var(--y,50%),rgba(232,145,58,0.15),transparent 50%);opacity:0;transition:opacity 0.3s;}
    .feature-card:hover{transform:translateY(-6px);border-color:rgba(232,145,58,0.3);box-shadow:0 20px 50px rgba(0,0,0,0.25);}
    .feature-card:hover::before{opacity:1;}
    .feature-icon{width:50px;height:50px;border-radius:12px;background:rgba(232,145,58,0.1);display:flex;align-items:center;justify-content:center;font-size:24px;margin-bottom:24px;transition:all 0.3s;}
    .feature-card:hover .feature-icon{transform:scale(1.1);box-shadow:0 4px 16px rgba(232,145,58,0.15);}
    .feature-icon-amber{background:rgba(232,145,58,0.1);}
    .feature-card h3{font-size:18px;font-weight:700;margin-bottom:12px;color:var(--cream);}
    .feature-card p{font-size:15px;color:var(--gray-l);line-height:1.6;}

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

    /* ===== DASHBOARD CARD ===== */
    .dashboard-card{background:var(--card);border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:40px;box-shadow:0 30px 80px rgba(0,0,0,0.3);overflow:hidden;position:relative;margin-top:40px;opacity:0;animation:slideUp 0.6s 0.2s cubic-bezier(0.16,1,0.3,1) forwards;}
    .dashboard-card::before{content:'';position:absolute;top:-40%;right:-40%;width:80%;height:80%;border-radius:50%;background:radial-gradient(circle,rgba(232,145,58,0.08),transparent 50%);pointer-events:none;}
    .dashboard-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:32px;position:relative;z-index:2;}
    .dashboard-title{font-size:18px;font-weight:700;color:var(--cream);}
    .dashboard-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;position:relative;z-index:2;}
    .stat-item{background:rgba(232,145,58,0.05);border:1px solid rgba(232,145,58,0.2);border-radius:14px;padding:24px;text-align:center;}
    .stat-number{font-size:clamp(24px,3vw,36px);font-weight:800;background:linear-gradient(135deg,var(--amber-g),var(--amber));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
    .stat-label{font-size:13px;color:var(--gray-l);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;}

    /* ===== SCROLL REVEAL ===== */
    @keyframes slideUp{from{opacity:0;transform:translateY(40px);}to{opacity:1;transform:translateY(0);}}
    .reveal{opacity:0;animation:slideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards;}

    /* ===== CTA SECTION ===== */
    .cta-section{padding:120px 24px;background:linear-gradient(135deg,rgba(232,145,58,0.08),rgba(232,145,58,0.04));border:1px solid rgba(232,145,58,0.2);border-radius:20px;max-width:900px;margin:0 auto;text-align:center;}
    .cta-section .stitle{margin-bottom:12px;}
    .cta-section .sdesc{max-width:100%;margin:0 auto 40px;font-size:16px;}
    .form-group{max-width:500px;margin:0 auto;}
    .form-input{width:100%;padding:14px 20px;background:var(--card);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:var(--cream);font-size:14px;font-family:inherit;transition:all 0.3s;margin-bottom:12px;}
    .form-input::placeholder{color:var(--gray);}
    .form-input:focus{outline:none;border-color:var(--amber);background:rgba(255,255,255,0.02);box-shadow:0 0 0 3px rgba(232,145,58,0.1);}
    .form-checkbox{display:flex;align-items:center;gap:10px;margin-bottom:20px;}
    .form-checkbox input{width:18px;height:18px;cursor:pointer;accent-color:var(--amber);}
    .form-checkbox label{font-size:13px;color:var(--gray-l);cursor:pointer;}
    .form-submit{width:100%;padding:14px 32px;background:linear-gradient(135deg,var(--amber),var(--amber-d));color:#FFF;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;transition:all 0.3s;font-family:inherit;}
    .form-submit:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(232,145,58,0.35);}

    /* ===== FOOTER ===== */
    .footer{background:var(--bg2);border-top:1px solid rgba(255,255,255,0.05);padding:80px 24px 24px;margin-top:120px;}
    .footer-inner{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;max-width:1200px;margin:0 auto;margin-bottom:40px;}
    .footer-logo{margin-bottom:16px;}
    .footer-logo svg{height:36px;}
    .footer-desc{font-size:14px;color:var(--gray-l);line-height:1.8;max-width:300px;}
    .footer-col h4{font-size:14px;font-weight:700;margin-bottom:20px;color:var(--cream);}
    .footer-col a{display:block;font-size:14px;color:var(--gray-l);margin-bottom:12px;transition:color 0.3s;}
    .footer-col a:hover{color:var(--amber);}
    .footer-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:32px;border-top:1px solid rgba(255,255,255,0.03);font-size:13px;color:var(--gray-l);}

    /* ===== RESPONSIVE ===== */
    @media(max-width:768px){
      .nav{padding:12px 20px;}
      .nav-links{display:none;position:fixed;top:56px;left:0;right:0;background:rgba(10,15,8,0.97);backdrop-filter:blur(24px);flex-direction:column;padding:24px;gap:16px;border-bottom:1px solid var(--card-b);transform:none !important;position:fixed !important;left:0 !important;}
      .nav-links.open{display:flex;}
      .nav-menu-btn{display:block;}
      .hero{padding:120px 20px 60px;}
      .section{padding:80px 20px;}
      .split-section{grid-template-columns:1fr;gap:40px;}
      .split-section.reverse{direction:ltr;}
      .dashboard-stats{grid-template-columns:1fr;}
      .footer-inner{grid-template-columns:1fr;gap:32px;}
      .footer-bottom{flex-direction:column;gap:12px;text-align:center;}
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav className={`nav nav-enter ${navScrolled ? 'scrolled' : ''}`}>
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
        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <Link href="/">Accueil</Link>
          <Link href="/closers">Closers</Link>
          <Link href="/managers" className="nav-active">Managers</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/auth/login" className="nav-cta"><span>Connexion</span></Link>
        </div>
        <button className="nav-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">&#9776;</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-pill">
          <span className="hero-pill-dot"></span>
          <span>Pour les responsables des ventes</span>
        </div>
        <h1><span className="white">Managers & HOS</span></h1>
        <p className="hero-oppo">Recrutez les meilleurs closers</p>
        <p className="hero-desc">Trouvez et attirez les closers les plus qualifiés pour vos écosystèmes d'infoproduit. Gérez vos candidatures, suivez vos conversions et construisez votre marque employeur.</p>
        <div className="hero-btns">
          <button className="btn btn-primary" onClick={handleSmoothScroll}><span>Commencer</span></button>
        </div>
      </section>

      {/* PROFILS QUALIFIÉS */}
      <section className="section">
        <span className="slabel">Qualité des candidats</span>
        <h2 className="stitle">Accédez à des <span className="accent">profils qualifiés</span></h2>
        <p className="sdesc">Recherchez et filtrez des centaines de closers par compétences, niches, expérience et taux de fermeture. Notre base de données vous donne accès aux meilleurs talents du marché.</p>

        <div className="features-grid">
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">🔍</div>
            <h3>Recherche avancée</h3>
            <p>Filtrez par spécialité, expérience, niche d'infoproduit et résultats. Trouvez exactement le profil qui correspond à vos besoins.</p>
          </div>
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">⭐</div>
            <h3>Évaluations vérifiées</h3>
            <p>Consultez les avis et la notation des closers. Vérifiez leur performance réelle sur les projets précédents.</p>
          </div>
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">📊</div>
            <h3>Statistiques détaillées</h3>
            <p>Analysez le taux de fermeture, la valeur moyenne des contrats et la spécialité de chaque closer.</p>
          </div>
        </div>
      </section>

      {/* PUBLICATION D'OFFRES */}
      <section className="split-section">
        <div className="split-text">
          <span className="slabel">Gestion des offres</span>
          <h2 className="stitle">Publiez vos <span className="accent">offres de closing</span></h2>
          <p className="sdesc">Créez des annonces détaillées et attractives. Recevez des candidatures ciblées des closers qualifiés intéressés par votre mission.</p>
          <div className="split-features">
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Créez des offres avec <strong>commissions et bonus</strong> clairs</p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Définissez vos <strong>critères de candidat idéal</strong></p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Visibilité auprès de <strong>closers qualifiés</strong> uniquement</p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Gestion <strong>centralisée</strong> de toutes vos annonces</p>
            </div>
          </div>
        </div>
        <div className="split-visual">
          <div className="split-visual-card">
            <div style={{ padding: '16px', background: 'rgba(232,145,58,0.05)', borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', color: 'var(--amber)', fontWeight: '600', marginBottom: '8px' }}>Exemple d'offre</div>
              <div style={{ fontSize: '14px', color: 'var(--cream)', fontWeight: '600', marginBottom: '4px' }}>Closer B2B SaaS - Infoproduit</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-l)', marginBottom: '12px' }}>Commission: 15-20% | Durée: 3 mois</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', background: 'rgba(232,145,58,0.2)', color: 'var(--amber-l)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}>Expérience requise</span>
                <span style={{ display: 'inline-block', background: 'rgba(232,145,58,0.2)', color: 'var(--amber-l)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px' }}>Niche SaaS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ANALYTICS */}
      <section className="section">
        <span className="slabel">Suivi de performance</span>
        <h2 className="stitle">Analytics <span className="accent">recrutement</span></h2>
        <p className="sdesc">Suivez vos candidatures, vos entretiens et vos signatures en temps réel. Mesurez votre ROI de recrutement avec des métriques claires.</p>

        <div className="features-grid">
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">👁️</div>
            <h3>Vues et clics</h3>
            <p>Voyez combien de closers voient votre offre et ceux qui cliquent pour postuler.</p>
          </div>
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">📬</div>
            <h3>Candidatures reçues</h3>
            <p>Recevez et organisez les candidatures des closers intéressés. Filtrez rapidement les meilleurs profils.</p>
          </div>
          <div className="feature-card" onMouseMove={handleMouseMove}>
            <div className="feature-icon feature-icon-amber">📈</div>
            <h3>Taux de conversion</h3>
            <p>Analysez votre taux de conversion du clic à la candidature et de la candidature au contrat signé.</p>
          </div>
        </div>

        {/* DASHBOARD */}
        <div className="dashboard-card">
          <div className="dashboard-header">
            <div className="dashboard-title">Tableau de bord recrutement</div>
          </div>
          <div className="dashboard-stats">
            <div className="stat-item">
              <div className="stat-number">247</div>
              <div className="stat-label">Candidatures reçues</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">63</div>
              <div className="stat-label">Entretiens menés</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">18</div>
              <div className="stat-label">Closers signés</div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUE EMPLOYEUR */}
      <section className="split-section reverse">
        <div className="split-text">
          <span className="slabel">Attractivité</span>
          <h2 className="stitle">Construisez votre <span className="accent">marque employeur</span></h2>
          <p className="sdesc">Créez votre page ecosystème pour mettre en avant votre culture, vos valeurs et vos opportunités. Attirez les meilleurs closers du marché.</p>
          <div className="split-features">
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Page <strong>branded</strong> dédiée à votre écosystème</p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Présentez <strong>votre équipe et vos succès</strong></p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Témoignages et retours de <strong>closers satisfaits</strong></p>
            </div>
            <div className="split-feature">
              <div className="split-check">✓</div>
              <p>Visibilité auprès des <strong>meilleurs talents</strong></p>
            </div>
          </div>
        </div>
        <div className="split-visual">
          <div className="split-visual-card">
            <div style={{ background: 'rgba(232,145,58,0.08)', border: '1px solid rgba(232,145,58,0.2)', borderRadius: '10px', padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', marginBottom: '12px' }}>🏢</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--cream)', marginBottom: '4px' }}>Votre Écosystème</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-l)' }}>Page attractive et optimisée</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section" id="rejoindre">
        <h2 className="stitle">Prêt à rejoindre une communauté d'opportunités ?</h2>
        <p className="sdesc" style={{ maxWidth: '620px', margin: '0 auto 16px', lineHeight: '1.8' }}>
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
          <span>&copy; 2026 HUBClosing Opportunités. Tous droits réservés.</span>
          <span>Fait avec ambition</span>
        </div>
      </footer>
    </>
  );
}
