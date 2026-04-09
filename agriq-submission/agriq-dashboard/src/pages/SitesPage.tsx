import { useNavigate, useParams } from 'react-router-dom';
import { site } from '../data/mockData';
import PileCard from '../components/PileCard';
import PileDetail from '../components/PileDetail';

export default function SitesPage() {
  const navigate = useNavigate();
  const { pileId } = useParams<{ pileId?: string }>();
  const selectedPile = site.piles.find(p => p.id === pileId);

  const criticalCount = site.piles.filter(p => p.status === 'critical').length;
  const warningCount = site.piles.filter(p => p.status === 'warning').length;
  const okCount = site.piles.filter(p => p.status === 'ok').length;

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* Page header */}
      <header className="mb-6">
        <div className="text-[10px] uppercase tracking-widest text-ink-400 mb-1">Facility overview</div>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="text-3xl font-extrabold text-ink-100 tracking-tight">
            {site.name}
            <span className="text-ink-400 font-semibold text-xl ml-2">/ Sites & Piles</span>
          </h1>
          <div className="flex gap-3 text-xs font-mono">
            <SummaryChip label="OK" count={okCount} color="text-ok" />
            <SummaryChip label="Warning" count={warningCount} color="text-warn" />
            <SummaryChip label="Critical" count={criticalCount} color="text-crit" />
          </div>
        </div>
      </header>

      {/* Grid of pile cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {site.piles.map((pile, i) => (
          <div key={pile.id} style={{ animationDelay: `${i * 60}ms` }}>
            <PileCard
              pile={pile}
              isSelected={selectedPile?.id === pile.id}
              onClick={() =>
                navigate(selectedPile?.id === pile.id ? '/sites' : `/sites/${pile.id}`)
              }
            />
          </div>
        ))}
      </div>

      {/* Selected pile detail */}
      {selectedPile ? (
        <PileDetail pile={selectedPile} onClose={() => navigate('/sites')} />
      ) : (
        <div className="bg-ink-900 border border-dashed border-ink-700 rounded-xl p-8 text-center">
          <div className="text-sm text-ink-300">
            Select a pile above to view its sensors and physical dimensions.
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryChip({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ink-700 bg-ink-900">
      <span className={`font-bold text-base ${color}`}>{count}</span>
      <span className="text-ink-400 uppercase tracking-wider text-[10px]">{label}</span>
    </div>
  );
}
