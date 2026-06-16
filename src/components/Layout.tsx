import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Bell } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function Layout() {
  const unresolvedCount = useStore((s) => s.alerts.filter((a) => !a.isResolved).length);

  return (
    <div className="min-h-screen bg-midnight-900">
      <Sidebar />
      <div className="ml-[220px]">
        <header className="sticky top-0 z-40 h-14 bg-midnight-900/80 backdrop-blur-xl border-b border-midnight-800/50 flex items-center justify-between px-6">
          <div />
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-midnight-800/50 transition-colors">
              <Bell className="w-[18px] h-[18px] text-slate-400" />
              {unresolvedCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-coral-500 rounded-full text-[9px] text-white flex items-center justify-center">
                  {unresolvedCount}
                </span>
              )}
            </button>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
