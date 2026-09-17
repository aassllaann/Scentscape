import Link from 'next/link';

export default function SiteHeader({ active }: { active: 'home' | 'atlas' }) {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">Scentscape</Link>
      <nav aria-label="Primary navigation">
        <Link aria-current={active === 'home' ? 'page' : undefined} href="/">Home</Link>
        <Link aria-current={active === 'atlas' ? 'page' : undefined} href="/atlas">Atlas</Link>
      </nav>
    </header>
  );
}
