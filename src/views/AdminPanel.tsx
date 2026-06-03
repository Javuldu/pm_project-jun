import React, { useState } from 'react';
import { Match, Stage, Team, User, Prediction } from '../types';
import { TEAMS } from '../data';
import { RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  users: User[];
  allUserPredictions: Record<string, Prediction[]>;
  onUpdateResults: (matches: Match[]) => void;
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onDeleteMatch?: (matchId: string) => void;
  onResetData?: () => void;
  officialChampion: string;
  onSetOfficialChampion: (id: string) => void;
  onShowPopup: (msg: string) => void;
}

export function AdminPanelView({ matches, users, allUserPredictions, onUpdateResults, onAddMatch, onDeleteMatch, onResetData, officialChampion, onSetOfficialChampion, onShowPopup }: AdminPanelProps) {
  const [localMatches, setLocalMatches] = useState<Match[]>(matches);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newTeamA, setNewTeamA] = useState<string>('');
  const [newTeamB, setNewTeamB] = useState<string>('');
  const [newDate, setNewDate] = useState<string>('');
  const [newStage, setNewStage] = useState<Stage>('Grupos');

  const handleScoreUpdate = (matchId: string, team: 'A' | 'B', val: string) => {
    const num = val === '' ? undefined : parseInt(val, 10);
    setLocalMatches(prev => prev.map(m => {
      if (m.id === matchId) return { ...m, [team === 'A' ? 'realScoreA' : 'realScoreB']: num };
      return m;
    }));
  };

  const handlePenaltiesWinner = (matchId: string, teamId: string) => {
    setLocalMatches(prev => prev.map(m => {
      if (m.id === matchId) return { ...m, realPenaltiesWinner: teamId || undefined };
      return m;
    }));
  };

  const handleToggleFinished = (matchId: string) => {
    setLocalMatches(prev => prev.map(m => {
      if (m.id === matchId) return { ...m, isFinished: !m.isFinished };
      return m;
    }));
  };

  const handleToggleLock = (matchId: string) => {
    setLocalMatches(prev => prev.map(m => {
      if (m.id === matchId) return { ...m, isLocked: !m.isLocked };
      return m;
    }));
  };

  const handleSaveAll = () => {
    onUpdateResults(localMatches);
    onShowPopup('Resultados y configuraciones actualizados exitosamente');
  };

  const handleAddNewMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamA || !newTeamB || !newDate) return alert('Campos incompletos');
    if (newTeamA === newTeamB) return alert('Los equipos deben ser diferentes');

    const newMatch = {
      teamA: TEAMS[newTeamA],
      teamB: TEAMS[newTeamB],
      date: newDate,
      stage: newStage,
      isFinished: false,
      isLocked: false
    };

    onAddMatch(newMatch);
    setShowAddForm(false); setNewTeamA(''); setNewTeamB(''); setNewDate('');
  };

  React.useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const doSync = async (body: object) => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const url = API_URL ? `${API_URL}/api/sync-participants` : '/api/sync-participants';
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (data.success) {
        setSyncMessage(`✅ ${data.message}`);
      } else {
        setSyncMessage(`❌ ${data.error || 'Error al sincronizar'}`);
      }
    } catch {
      setSyncMessage('❌ Error de conexión con el servidor.');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncParticipants = async () => {
    await doSync({});
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const arrayBuf = evt.target?.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);
      await doSync({ fileData: base64 });
    };
    reader.readAsArrayBuffer(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleExportData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "\"Partido\",\"Participante\",\"Prediccion_Local\",\"Prediccion_Visitante\"\r\n";
    
    localMatches.forEach(match => {
      let hasAny = false;
      users.forEach(user => {
        const preds = allUserPredictions[user.id] || [];
        const p = preds.find(x => x.matchId === match.id);
        if (!p || p.scoreA === undefined || p.scoreB === undefined) return;
        hasAny = true;
        csvContent += `"${match.teamA.code} vs ${match.teamB.code}","${user.name}",${p.scoreA},${p.scoreB}\r\n`;
      });
      if (!hasAny) {
        csvContent += `"${match.teamA.code} vs ${match.teamB.code}","(sin pronósticos)",,\r\n`;
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pronosticos_mundial_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-primary">Panel de Control</h2>
          <p className="text-sm text-slate-500">Gestión de torneos y resultados.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportData}
            className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 transition text-sm"
          >
            Exportar CSV
          </button>
          <button
            onClick={handleSyncParticipants}
            disabled={syncing}
            className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 transition text-sm disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sync Excel'}
          </button>
          <label className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-slate-50 transition text-sm cursor-pointer">
            Subir Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button 
            onClick={handleSaveAll}
            className="bg-secondary text-white font-bold py-2 px-6 rounded-lg shadow-sm hover:bg-red-700 transition"
          >
            Guardar Resultados
          </button>
          {onResetData && (
            <button
              onClick={() => {
                if (window.confirm('¿Reiniciar todos los datos? Se borrarán predicciones, resultados y campeón oficial.')) {
                  onResetData();
                }
              }}
              className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-800 transition text-sm"
            >
              Reiniciar Todo
            </button>
          )}
        </div>
      </div>

      {syncMessage && (
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-sm font-bold text-blue-800 text-center">
          {syncMessage}
        </div>
      )}

      <div className="bg-yellow-50 p-5 rounded-xl border border-yellow-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-yellow-900 border-b border-yellow-200/50 pb-1 mb-2">Definir Campeón Oficial</h3>
          <p className="text-xs text-yellow-700">Concluye torneo y ajusta puntajes (visual).</p>
        </div>
        <div className="flex bg-white rounded-lg border border-yellow-300 shadow-sm overflow-hidden">
           <select 
             value={officialChampion}
             onChange={(e) => onSetOfficialChampion(e.target.value)}
             className="p-2.5 text-sm bg-transparent outline-none flex-1 min-w-[150px] font-bold text-slate-700"
           >
             <option value="">Aún sin definir...</option>
             {Object.entries(TEAMS).map(([key, t]) => <option key={key} value={key}>{t.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-700">Programar Nuevo Partido</h3>
          <button onClick={() => setShowAddForm(!showAddForm)} className="text-primary font-bold text-sm bg-surface-dim px-3 py-1 rounded">
            {showAddForm ? 'Cancelar' : '+ Agregar'}
          </button>
        </div>
        {showAddForm && (
          <form onSubmit={handleAddNewMatch} className="space-y-4 pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Local</label>
                <select required value={newTeamA} onChange={e => setNewTeamA(e.target.value)} className="w-full border rounded p-2 text-sm bg-surface">
                  <option value="">Seleccionar...</option>
                  {Object.entries(TEAMS).map(([key, t]) => <option key={key} value={key}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Visitante</label>
                <select required value={newTeamB} onChange={e => setNewTeamB(e.target.value)} className="w-full border rounded p-2 text-sm bg-surface">
                  <option value="">Seleccionar...</option>
                  {Object.entries(TEAMS).map(([key, t]) => <option key={key} value={key}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha/Hora (Ecuador)</label>
                <input required type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} className="w-full border rounded p-2 text-sm bg-surface" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fase</label>
                <select required value={newStage} onChange={e => setNewStage(e.target.value as Stage)} className="w-full border rounded p-2 text-sm bg-surface">
                  <option value="Grupos">Grupos</option>
                  <option value="Octavos">Octavos</option>
                  <option value="Cuartos">Cuartos</option>
                  <option value="Semifinal">Semifinal</option>
                  <option value="Final">Final</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-primary text-white py-2 rounded font-bold hover:bg-primary-container">
              Crear Partido
            </button>
          </form>
        )}
      </div>

      <h3 className="font-bold text-slate-700 mt-8 mb-4">Actualizar Resultados y Bloqueos (Horas EC)</h3>
      <div className="space-y-4">
        {localMatches.map(match => {
            const dt = new Date(match.date);
            const timeString = dt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
            const dateString = dt.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });
            
            return (
              <div key={match.id} className={`bg-white rounded-xl shadow-sm border p-4 flex flex-col gap-3 ${match.isFinished ? 'border-primary bg-slate-50' : 'border-slate-100'} ${match.isLocked ? 'opacity-80' : ''}`}>
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">{match.stage} · {dateString} {timeString}</span>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={match.isLocked || false}
                        onChange={() => handleToggleLock(match.id)}
                        className="rounded text-red-500 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-600">Bloquear Edición</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                      <input 
                        type="checkbox" 
                        checked={match.isFinished}
                        onChange={() => handleToggleFinished(match.id)}
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-600">Marcado Final</span>
                    </label>
                    {onDeleteMatch && (
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Eliminar ${match.teamA.code} vs ${match.teamB.code}?`)) {
                            onDeleteMatch(match.id);
                          }
                        }}
                        className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold px-2 py-1 rounded hover:bg-red-100"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between max-w-sm mx-auto bg-surface p-2 rounded-lg gap-4 w-full">
                  <span className="w-1/3 text-right font-bold text-sm text-slate-700">{match.teamA.code}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <input 
                      type="number" value={match.realScoreA ?? ''} onChange={e => handleScoreUpdate(match.id, 'A', e.target.value)}
                      className="w-12 h-12 text-center text-lg font-bold border border-slate-300 rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-white shadow-sm"
                    />
                    <span className="text-slate-300 font-black">-</span>
                    <input 
                      type="number" value={match.realScoreB ?? ''} onChange={e => handleScoreUpdate(match.id, 'B', e.target.value)}
                      className="w-12 h-12 text-center text-lg font-bold border border-slate-300 rounded-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none bg-white shadow-sm"
                    />
                  </div>
                  <span className="w-1/3 text-left font-bold text-sm text-slate-700">{match.teamB.code}</span>
                </div>
                {match.stage !== 'Grupos' && (
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Clasifica:</span>
                    <select
                      value={match.realPenaltiesWinner || ''}
                      onChange={e => handlePenaltiesWinner(match.id, e.target.value)}
                      className="border border-slate-200 rounded p-1 text-xs font-bold text-primary bg-white"
                    >
                      <option value="">Sin definir...</option>
                      <option value={match.teamA.id}>{match.teamA.name}</option>
                      <option value={match.teamB.id}>{match.teamB.name}</option>
                    </select>
                  </div>
                )}
              </div>
            )
        })}
      </div>
    </div>
  );
}
