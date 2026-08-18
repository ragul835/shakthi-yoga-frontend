import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', paddingBlock: '64px' }}>
      <div>
        <p style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '.08em' }}>404</p>
        <h1>We couldn&apos;t find that page</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '52ch', margin: '16px auto 28px' }}>The page may have moved or the address may be incorrect. Continue your practice from one of these pages.</p>
        <nav aria-label="Helpful links" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px' }}>
          <Link className="btn btn-primary" href="/">Home</Link>
          <Link className="btn btn-secondary" href="/classes">Classes</Link>
          <Link className="btn btn-secondary" href="/pricing">Class Passes</Link>
          <Link className="btn btn-secondary" href="/contact">Contact</Link>
        </nav>
      </div>
    </div>
  );
}
