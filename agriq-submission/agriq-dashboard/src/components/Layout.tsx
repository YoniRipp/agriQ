import { NavLink } from 'react-router-dom';
import { Wheat, LayoutGrid, Siren, MapPin, Sun, Moon } from 'lucide-react';
import { alerts, site } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'emergency').length;
  const activeCount = alerts.length;

  return (
    <div className="min-h-screen flex bg-ink-950">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-ink-700 bg-ink-900 flex flex-col shadow-sm">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-ink-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ok to-ok/60 flex items-center justify-center shadow-lg shadow-ok/20">
              <Wheat className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight text-ink-100 leading-none">agriQ</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-ink-400 mt-0.5">Grain Monitor</div>
            </div>
          </div>
        </div>

        {/* Facility */}
        <div className="px-6 py-4 border-b border-ink-700">
          <div className="text-[10px] uppercase tracking-widest text-ink-400 mb-1.5">Facility</div>
          <div className="font-semibold text-ink-100">{site.name}</div>
          <div className="flex items-start gap-1.5 mt-1 text-xs text-ink-300">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span>{site.address}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavItem to="/sites" icon={<LayoutGrid className="w-4 h-4" />} label="Sites & Piles" />
          <NavItem
            to="/alerts"
            icon={<Siren className="w-4 h-4" />}
            label="Alerts"
            badge={activeCount}
            badgeUrgent={criticalCount > 0}
          />
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-ink-700 flex items-center justify-between">
          <div className="text-[10px] text-ink-400 font-mono">
            <div>v1.0.0 · demo build</div>
            <div className="mt-0.5">Last sync: just now</div>
          </div>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle light/dark mode"
            className="p-2 rounded-lg border border-ink-700 text-ink-400 hover:text-ink-100 hover:border-ink-500 hover:bg-ink-800 transition"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 bg-grid overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  badge,
  badgeUrgent,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  badgeUrgent?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
          isActive
            ? 'bg-ink-700 text-ink-100 shadow-sm'
            : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800'
        }`
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded min-w-[18px] text-center ${
            badgeUrgent ? 'bg-crit text-white pulse-crit' : 'bg-ink-700 text-ink-100'
          }`}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}
