import { Globe, LogOut, ShieldAlert, Trophy, UserCircle } from 'lucide-react';
import React from 'react';
import { ViewState } from '../types';
import appLogo from './logo.jpeg';

interface TopBarProps {
  onAvatarClick: () => void;
  isAdmin: boolean;
  avatarUrl?: string;
}

export function TopBar({ onAvatarClick, isAdmin, avatarUrl }: TopBarProps) {
  return (
    <header className="bg-surface sticky top-0 z-10 border-b border-surface-dim shadow-sm">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="-ml-2 flex justify-center items-center">
          <img src={appLogo} alt="Logo" className="w-12 h-12 object-contain rounded drop-shadow" />
        </div>
        
        <div className="flex items-center gap-2 text-primary font-bold md:text-xl tracking-tight leading-none text-sm">
          <Globe className="w-5 h-5 md:w-6 md:h-6 text-secondary shrink-0" />
          <span className="truncate">PRONÓSTICO MUNDIALISTA 2026</span>
        </div>

        {!isAdmin ? (
           <button 
            onClick={onAvatarClick}
            className="p-0 -mr-2 text-primary hover:bg-surface-dim rounded-full transition-colors overflow-hidden"
           >
             {avatarUrl ? (
               <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-white shadow-sm" />
             ) : (
               <UserCircle className="w-7 h-7" />
             )}
           </button>
        ) : (
           <div className="w-7"></div>
        )}
      </div>
    </header>
  );
}

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isAdmin: boolean;
}

export function BottomNav({ currentView, onChangeView, isAdmin }: BottomNavProps) {
  const userNavItems = [
    { id: 'predictions', label: 'Pronósticos', icon: Globe },
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'welcome', label: 'Salir', icon: LogOut },
  ];

  const adminNavItems = [
    { id: 'ranking', label: 'Ranking', icon: Trophy },
    { id: 'adminPanel', label: 'Admin', icon: ShieldAlert },
    { id: 'welcome', label: 'Salir', icon: LogOut },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="fixed bottom-0 w-full bg-surface border-t border-surface-dim pb-safe">
      <div className="max-w-3xl mx-auto px-2 flex justify-around">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewState)}
              className={`flex flex-col items-center py-3 px-4 min-w-[72px] transition-colors ${
                isActive ? 'text-primary' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-2xl mb-1 ${isActive ? 'bg-primary-container text-white' : ''}`}>
                 <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
