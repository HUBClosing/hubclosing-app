import Link from 'next/link';

/**
 * Layout commun pour les pages légales.
 * Design cohérent avec le reste du site (dark theme + amber accents).
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0A0F08',
      color: '#F5F5F0',
      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
    }}>
      {/* Nav minimal */}
      <nav style={{
        padding: '16px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(10,15,8,0.95)',
        backdropFilter: 'blur(24px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '0' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#F5F5F0', letterSpacing: '-1px' }}>HUB</span>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#E8913A', letterSpacing: '-1px' }}>Closing</span>
        </Link>
        <Link href="/" style={{
          fontSize: '14px',
          color: '#A5A59A',
          textDecoration: 'none',
          padding: '8px 16px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.2s',
        }}>
          Retour au site
        </Link>
      </nav>

      {/* Contenu */}
      <main style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '60px 24px 100px',
      }}>
        {children}
      </main>

      {/* Footer minimal */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.04)',
        padding: '24px 40px',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '12px' }}>
          <Link href="/legal/mentions" style={{ fontSize: '13px', color: '#7A7A72', textDecoration: 'none' }}>
            Mentions l&eacute;gales
          </Link>
          <Link href="/legal/cgu" style={{ fontSize: '13px', color: '#7A7A72', textDecoration: 'none' }}>
            CGU
          </Link>
          <Link href="/legal/privacy" style={{ fontSize: '13px', color: '#7A7A72', textDecoration: 'none' }}>
            Confidentialit&eacute;
          </Link>
        </div>
        <p style={{ fontSize: '12px', color: '#4A4A42' }}>
          &copy; 2026 HUBClosing Opportunit&eacute;s. Tous droits r&eacute;serv&eacute;s.
        </p>
      </footer>
    </div>
  );
}
