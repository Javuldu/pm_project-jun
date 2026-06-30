import React, { useState } from 'react';
import { User } from '../types';
import { TEAMS } from '../data';
import { UserCircle, Info, Download, Trophy } from 'lucide-react';

interface RankingViewProps {
  users: User[];
  currentUser?: User;
  officialChampion?: string;
  isAdmin?: boolean;
  eliminatedTeams?: string[];
}

export function RankingView({ users, currentUser, officialChampion, isAdmin, eliminatedTeams = [] }: RankingViewProps) {
  const [showRules, setShowRules] = useState(false);
  const sortedUsers = [...users].sort((a, b) => b.points - a.points || b.exactHits - a.exactHits);
  const officialTeam = officialChampion ? TEAMS[officialChampion] : null;

  const handleExportRanking = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "POS,Participante,Puntos,Aciertos_Exactos(3pt)\r\n";
    sortedUsers.forEach((u, i) => {
      csv += `${i+1},"${u.name}",${u.points},${u.exactHits}\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "ranking_mundial_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportChampions = () => {
    let csv = "data:text/csv;charset=utf-8,";
    csv += "Participante,Equipo_Campeon,COD_FIFA\r\n";
    sortedUsers.forEach(u => {
      const champ = u.championPrediction ? TEAMS[u.championPrediction] : null;
      csv += `"${u.name}","${champ?.name || ''}","${champ?.code || ''}"\r\n`;
    });
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "pronosticos_campeon_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      <div className="text-center py-6 relative">
        <div className="absolute right-0 top-6 flex gap-1">
          {isAdmin && (
            <>
              <button 
                onClick={handleExportRanking}
                className="text-primary hover:bg-surface-dim p-2 rounded-full transition"
                aria-label="Descargar ranking CSV"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={handleExportChampions}
                className="text-primary hover:bg-surface-dim p-2 rounded-full transition"
                aria-label="Descargar pronósticos campeón CSV"
                title="Pronósticos Campeón"
              >
                <Trophy className="w-5 h-5" />
              </button>
            </>
          )}
          <button 
            onClick={() => setShowRules(true)}
            className="text-primary hover:bg-surface-dim p-2 rounded-full transition"
            aria-label="Reglas de puntuación"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-primary tracking-tight">RANKING GLOBAL</h2>
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
                <span>Por acertar el <strong>equipo que clasifica</strong> en partidos de eliminación directa (tiempo extra o penales).</span>
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
        <div className="flex items-center justify-between bg-surface-dim px-3 py-2.5 border-b border-slate-200 text-[10px] font-black text-primary uppercase tracking-wide">
          <span className="w-8 text-center">POS</span>
          <span className="flex-1">JUGADOR</span>
          <span className="w-8 text-center" title="Aciertos exactos (3pts)">3PT</span>
          <span className="w-10 text-right">PTS</span>
        </div>

        <div className="divide-y divide-slate-100">
          {sortedUsers.map((user, index) => {
            const isCurrent = currentUser ? user.id === currentUser.id : false;
            const position = index + 1;
            const isTop10 = position <= 10;
            let icon: string | number;
            if (isTop10) icon = '⚽';
            else icon = position;

            return (
              <div key={user.id} className={`flex items-center justify-between px-3 py-2.5 ${isCurrent ? 'bg-blue-50/50' : isTop10 ? 'bg-amber-50/40 hover:bg-amber-50/80' : 'hover:bg-slate-50'}`}>
                <div className={`w-8 text-center font-bold text-sm shrink-0 ${isTop10 ? 'text-amber-700' : 'text-slate-400'}`}>
                  {icon}
                </div>
                
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-white shadow-sm shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-surface-dim text-primary flex items-center justify-center border border-white shadow-sm shrink-0">
                      <UserCircle className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden flex-nowrap">
                    <span className={`font-bold text-sm truncate ${isCurrent ? 'text-primary' : 'text-slate-800'}`}>
                      {user.name}
                      {isCurrent && <span className="ml-1 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full shadow-sm align-middle">TÚ</span>}
                    </span>
                    {user.championPrediction && TEAMS[user.championPrediction] && (
                      <>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase truncate hidden sm:inline border whitespace-nowrap ${
                          eliminatedTeams.includes(user.championPrediction)
                            ? 'bg-red-100 text-red-700 border-red-200 line-through'
                            : 'bg-surface text-primary border-surface-dim'
                        }`}>
                          🏆{eliminatedTeams.includes(user.championPrediction) ? '✗ ' : ''}{TEAMS[user.championPrediction].name}
                        </span>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-bold uppercase sm:hidden shrink-0 border whitespace-nowrap ${
                          eliminatedTeams.includes(user.championPrediction)
                            ? 'bg-red-100 text-red-700 border-red-200 line-through'
                            : 'bg-surface text-primary border-surface-dim'
                        }`} title={TEAMS[user.championPrediction].name}>
                          🏆{eliminatedTeams.includes(user.championPrediction) ? '✗' : ''}{TEAMS[user.championPrediction].code}
                        </span>
                        {officialChampion === user.championPrediction && (
                          <span className="text-[9px] text-green-700 font-bold bg-green-100 px-1 py-0.5 rounded shrink-0 whitespace-nowrap">+5</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="w-8 text-center text-xs font-bold text-slate-500 shrink-0">
                  {user.exactHits}
                </div>
                <div className="w-10 text-right font-black text-base text-primary shrink-0">
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
