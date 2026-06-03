import React, { useState } from 'react';
import { User } from '../types';
import { TEAMS } from '../data';
import { UserCircle, Info } from 'lucide-react';

interface RankingViewProps {
  users: User[];
  currentUser: User;
  officialChampion?: string;
}

export function RankingView({ users, currentUser, officialChampion }: RankingViewProps) {
  const [showRules, setShowRules] = useState(false);
  const sortedUsers = [...users].sort((a, b) => b.points - a.points);
  const officialTeam = officialChampion ? TEAMS[officialChampion] : null;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      <div className="text-center py-6 relative">
        <button 
          onClick={() => setShowRules(true)}
          className="absolute right-0 top-6 text-primary hover:bg-surface-dim p-2 rounded-full transition"
          aria-label="Reglas de puntuación"
        >
          <Info className="w-6 h-6" />
        </button>
        <h2 className="text-3xl font-black text-primary tracking-tight">RANKING GLOBAL</h2>
        <p className="text-slate-500 mt-2 font-medium">Demuestra quién sabe más de fútbol</p>
      </div>

      {showRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Reglas de Puntuación</h3>
              <button onClick={() => setShowRules(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-600 mt-0.5">+3 pts</span>
                <span>Por acertar el <strong>resultado exacto</strong> (goles de cada equipo).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-blue-600 mt-0.5">+1 pt</span>
                <span>Por acertar el <strong>ganador o empate</strong> (sin resultado exacto).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600 mt-0.5">+1 pt</span>
                <span>Por acertar el <strong>equipo que clasifica</strong> en partidos de eliminación directa (si pronosticaste empate).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-600 mt-0.5">+5 pts</span>
                <span>Por acertar al <strong>campeón del torneo</strong> (al final).</span>
              </li>
            </ul>
            <button 
              onClick={() => setShowRules(false)}
              className="mt-6 w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-primary-container transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {officialTeam && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center mb-6 shadow-sm">
          <span className="text-sm font-bold text-yellow-800 uppercase block mb-1">Campeón Oficial Definido</span>
          <span className="text-2xl font-black text-yellow-900 tracking-tight flex items-center justify-center gap-2">
            🏆 {officialTeam.name}
          </span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between bg-surface-dim px-4 py-3 border-b border-slate-200 text-xs font-black text-primary uppercase tracking-wide">
          <span className="w-12 text-center">POS</span>
          <span className="flex-1">JUGADOR</span>
          <span className="w-20 text-right">PUNTOS</span>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedUsers.map((user, index) => {
            const isCurrent = user.id === currentUser.id;
            const position = index + 1;
            let medalStr = '';
            if (position === 1) medalStr = '🥇';
            else if (position === 2) medalStr = '🥈';
            else if (position === 3) medalStr = '🥉';

            return (
              <div key={user.id} className={`flex items-center justify-between px-4 py-3 transition-colors flex-wrap gap-y-2 ${isCurrent ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}>
                <div className="w-12 text-center font-bold text-slate-400 text-lg">
                  {medalStr || position}
                </div>
                
                <div className="flex-1 flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-surface-dim text-primary flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                      <UserCircle className="w-7 h-7" />
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className={`font-bold truncate pr-2 ${isCurrent ? 'text-primary' : 'text-slate-800'}`}>
                      {user.name}
                      {isCurrent && <span className="ml-2 text-[10px] bg-primary text-white px-2 py-0.5 rounded-full shadow-sm align-middle">TÚ</span>}
                    </span>
                    {user.championPrediction && TEAMS[user.championPrediction] && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] bg-surface text-primary border border-surface-dim px-1.5 py-0.5 rounded font-bold uppercase tracking-wide truncate">
                          🏆 {TEAMS[user.championPrediction].name}
                        </span>
                        {officialChampion === user.championPrediction && (
                          <span className="text-[10px] text-green-700 font-bold bg-green-100 px-1.5 py-0.5 rounded">✓ +5</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-16 sm:w-20 text-right font-black text-2xl text-primary shrink-0 tracking-tight">
                  {user.points}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
