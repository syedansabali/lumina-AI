import { Link, useLocation } from 'react-router-dom';
import { 
  FolderIcon, 
  History, 
  Users, 
  Star, 
  Trash2, 
  Settings, 
  HelpCircle,
  FileUp,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '@/src/components/ui/Button';
import { useTranslation } from 'react-i18next';

export function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();

  const navItems = [
    { label: t('sidebar.library'), icon: FolderIcon, href: '/dashboard' },
    { label: t('sidebar.recent'), icon: History, href: '#' },
    { label: 'Shared', icon: Users, href: '#' },
    { label: 'Starred', icon: Star, href: '#' },
    { label: 'Trash', icon: Trash2, href: '#' },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#050508]/10 backdrop-blur-2xl border-r border-white/5 flex flex-col py-6 z-40 hidden md:flex">
      <div className="px-6 mb-10 mt-20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center glow-purple">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">{t('sidebar.library')}</p>
            <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-extrabold mt-0.5">AETHER MODE</p>
          </div>
        </div>
        
        <Link to="/processing">
          <Button variant="secondary" className="w-full gap-2 border-secondary/20 shadow-lg">
            <FileUp className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">{t('sidebar.newChat')}</span>
          </Button>
        </Link>
      </div>

      <nav className="flex-grow">
        <div className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "px-8 py-3 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                  isActive 
                    ? "bg-white/5 text-secondary border-r-2 border-secondary" 
                    : "text-white/40 hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-secondary" : "text-white/40")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="px-8 flex flex-col gap-4 mt-auto">
        <a className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-4 transition-all" href="#">
          <Settings className="w-4 h-4" />
          {t('sidebar.settings')}
        </a>
        <a className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white flex items-center gap-4 transition-all" href="#">
          <HelpCircle className="w-4 h-4" />
          {t('sidebar.help')}
        </a>
      </div>
    </aside>
  );
}
