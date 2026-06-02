import React, { useState } from 'react';

interface LoginProps {
  onLoginUser: (name: string, code: string) => void;
  onLoginAdmin: (password: string) => void;
  adminError?: string;
  userError?: string;
}

export function WelcomeView({ onLoginUser, onLoginAdmin, adminError, userError }: LoginProps) {
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-[90vh] flex flex-col items-center justify-center p-6 bg-surface relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-48 bg-primary rounded-b-[100%] scale-150 -translate-y-20 opacity-90"></div>
      <div className="absolute top-10 right-10 w-32 h-32 bg-secondary rounded-full opacity-90"></div>
      
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-slate-100 mt-12">
        <div className="flex justify-center mb-6 text-center">
          <span className="text-3xl md:text-4xl text-primary font-black tracking-tighter drop-shadow-sm uppercase leading-tight">
            Pronóstico<br/>Mundialista 2026
          </span>
        </div>
        
        <div className="flex bg-surface-dim p-1 rounded-lg mb-8">
          <button 
            onClick={() => setMode('user')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'user' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Participante
          </button>
          <button 
            onClick={() => setMode('admin')}
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${mode === 'admin' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Administrador
          </button>
        </div>

        {mode === 'user' ? (
          <form onSubmit={e => { e.preventDefault(); if(name.trim() && code.trim()) onLoginUser(name.trim(), code.trim()); }} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 text-center">Tu Nombre de Participante</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-surface border border-slate-200 rounded-lg p-3 text-lg focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors text-center font-semibold" placeholder="Ej. Juan Pérez" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 text-center">Código de Participación</label>
              <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full bg-surface border border-slate-200 rounded-lg p-3 text-lg focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors text-center font-semibold tracking-widest uppercase" placeholder="Ej. MUNDIAL" />
            </div>
            <button type="submit" className="w-full bg-primary text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-primary-container shadow-md transition-all active:scale-95 mt-2">
              ⚽ Ingresar al Juego
            </button>
            {userError && <p className="text-red-500 text-xs mt-3 text-center font-bold">{userError}</p>}
          </form>
        ) : (
          <form onSubmit={e => { e.preventDefault(); if(password) onLoginAdmin(password); }} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 text-center">Contraseña Admin</label>
              <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-surface border border-slate-200 rounded-lg p-3 text-lg focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors text-center font-bold" placeholder="••••••••" />
              {adminError && <p className="text-red-500 text-xs mt-3 text-center font-bold">{adminError}</p>}
            </div>
            <button type="submit" className="w-full bg-secondary text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 shadow-md transition-all active:scale-95">
              🔐 Acceder Panel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
