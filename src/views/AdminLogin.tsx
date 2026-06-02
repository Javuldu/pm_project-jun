import React, { useState } from 'react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  onBack: () => void;
  error?: string;
}

export function AdminLoginView({ onLogin, onBack, error }: AdminLoginProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="p-4 max-w-sm mx-auto h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full p-8 border border-slate-100 text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-surface-dim rounded-full opacity-50 pointer-events-none"></div>

        <div className="w-12 h-12 bg-primary-container text-white rounded-xl flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        
        <h2 className="text-2xl font-bold text-primary mb-2">Panel de Control Admin</h2>
        <p className="text-sm text-slate-500 mb-8">
          Ingrese sus credenciales para acceder al sistema de carga de resultados.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Contraseña de Administrador</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface border border-slate-200 rounded-lg p-3 text-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="••••••••"
            />
            {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
          </div>

          <button 
            type="submit"
            className="w-full bg-primary text-white font-bold py-3.5 rounded-lg hover:bg-primary-container transition-colors shadow-md"
          >
            Validar Acceso
          </button>
        </form>

        <button 
          onClick={onBack}
          className="mt-6 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );
}
