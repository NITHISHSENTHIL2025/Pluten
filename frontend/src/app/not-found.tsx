import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="pluten-error-page">
      <section className="pluten-error-card">
        <div className="pluten-error-kicker">PLUTEN / 404</div>
        <h1>Page not found.</h1>
        <p>The page you requested does not exist or is no longer available.</p>
        <div className="pluten-error-actions">
          <Link href="/" className="pluten-error-primary">Return home</Link>
        </div>
      </section>
    </main>
  );
}
