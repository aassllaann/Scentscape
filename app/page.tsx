import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { FAMILY_COLORS, FAMILY_LABELS, FAMILY_ORDER } from '@/lib/fragranceData';
import { getPerfumes } from '@/lib/perfumeServer';

const FAMILY_DESCRIPTIONS: Record<string, string> = {
  Oriental: 'Amber, resin, spice, and enveloping warmth.',
  Woody: 'Cedar, vetiver, moss, and grounded calm.',
  Fougere: 'Aromatic herbs, lavender, and green structure.',
  Leather: 'Smoke, suede, tobacco, and polished depth.',
  Gourmand: 'Vanilla, caramel, cacao, and edible comfort.',
  Citrus: 'Bergamot, lemon, zest, and radiant clarity.',
  Fresh: 'Green leaves, herbs, air, and crisp energy.',
  Aquatic: 'Marine air, rain, minerals, and cool distance.',
  Floral: 'Petals, powder, bloom, and luminous softness.',
};

export default function Home() {
  const totalCount = getPerfumes().length;

  return (
    <div className="home-page">
      <SiteHeader active="home" />
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow">An olfactory atlas</p>
          <h1>A landscape<br />for every scent.</h1>
          <p className="home-intro">Explore fragrance families, discover perfume notes, and see scent translated into visual form.</p>
          <Link className="primary-link" href="/atlas">Explore the atlas <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="home-visual" aria-label="Nine fragrance families represented as a color spectrum">
          <div className="home-wheel" aria-hidden="true">
            <div className="home-wheel-core"><span>9 families</span><strong>{totalCount.toLocaleString()}</strong><span>fragrances</span></div>
          </div>
          <p className="visual-caption">A living taxonomy of scent</p>
        </div>
      </section>
      <section className="family-index" aria-labelledby="family-index-title">
        <div className="section-heading"><p className="eyebrow">Begin anywhere</p><h2 id="family-index-title">Start with a scent family</h2></div>
        <div className="family-grid">
          {FAMILY_ORDER.map((family, index) => (
            <Link key={family} className="family-card" href={`/atlas?family=${family}`}>
              <span className="family-number">{String(index + 1).padStart(2, '0')}</span>
              <span className="family-swatch" style={{ background: FAMILY_COLORS[family] }} aria-hidden="true" />
              <span className="family-card-copy"><strong>{family}</strong><span>{FAMILY_LABELS[family]}</span><small>{FAMILY_DESCRIPTIONS[family]}</small></span>
              <span className="family-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <footer className="site-footer">
        <p>Scentscape turns perfume data into an exploratory visual language.</p>
        <p>Family, mood, and duration attributes are interpretive metadata derived from listed notes.</p>
      </footer>
    </div>
  );
}
