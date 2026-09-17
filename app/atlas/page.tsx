import FragranceWheel from '@/components/FragranceWheel';
import PerfumeDetail from '@/components/PerfumeDetail';
import SearchBar from '@/components/SearchBar';
import MoodCanvas from '@/components/MoodCanvas';
import SiteHeader from '@/components/SiteHeader';
import AtlasSelection from '@/components/AtlasSelection';
import { FAMILY_ORDER } from '@/lib/fragranceData';
import { getPerfumes, getPreviews } from '@/lib/perfumeServer';

export default async function Atlas({ searchParams }: PageProps<'/atlas'>) {
  const requestedFamily = (await searchParams).family;
  const family = typeof requestedFamily === 'string' && FAMILY_ORDER.includes(requestedFamily as typeof FAMILY_ORDER[number]) ? requestedFamily : null;
  const totalCount = getPerfumes().length;
  const { family: familyPreviews, subfamily: subfamilyPreviews } = getPreviews();

  return (
    <div className="atlas-page">
      <MoodCanvas />
      <AtlasSelection family={family} />
      <div className="atlas-main">
        <div className="atlas-explorer">
          <SiteHeader active="atlas" />
          <div className="atlas-toolbar">
            <div><p className="eyebrow">Olfactory atlas</p><p className="atlas-count">{totalCount.toLocaleString()} fragrances</p></div>
            <span className="atlas-hint">选择香调，再查看细分香调</span>
          </div>
          <SearchBar />
          <FragranceWheel familyPreviews={familyPreviews} subfamilyPreviews={subfamilyPreviews} />
        </div>
        <PerfumeDetail />
      </div>
    </div>
  );
}
