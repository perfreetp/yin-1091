import { NavLink, useLocation } from 'react-router-dom';
import {
  Users,
  ClipboardEdit,
  CalendarClock,
  AlertTriangle,
  BarChart3,
  Moon,
} from 'lucide-react';

const navItems = [
  { to: '/patients', icon: Users, label: '患者列表' },
  { to: '/assessment/new', icon: ClipboardEdit, label: '评估录入' },
  { to: '/follow-up', icon: CalendarClock, label: '随访计划' },
  { to: '/alerts', icon: AlertTriangle, label: '预警看板' },
  { to: '/reports', icon: BarChart3, label: '统计报表' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-midnight-950 border-r border-midnight-800/50 flex flex-col z-50">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-midnight-800/50">
        <div className="w-9 h-9 rounded-lg bg-midnight-800 flex items-center justify-center">
          <Moon className="w-5 h-5 text-mint-500" />
        </div>
        <div>
          <h1 className="font-serif text-base font-semibold text-white leading-tight">睡眠门诊</h1>
          <p className="text-[10px] text-slate-400 leading-tight">智能工作台</p>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/patients'
              ? location.pathname === '/patients' || location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-midnight-800 text-white shadow-lg shadow-midnight-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-midnight-800/50'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-mint-500' : ''}`} />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-midnight-800/50">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-midnight-700 flex items-center justify-center text-xs text-mint-500 font-medium">
            医
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">王医生</p>
            <p className="text-[10px] text-slate-500">主治医师</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
