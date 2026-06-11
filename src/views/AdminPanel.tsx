import React, { useState } from 'react';
import { Match, Stage, Team, User, Prediction } from '../types';
import { TEAMS } from '../data';
import { RefreshCw } from 'lucide-react';

interface AdminPanelProps {
  matches: Match[];
  users: User[];
  allUserPredictions: Record<string, Prediction[]>;
  allParticipants: {id: string; name: string}[];
  championMap: Record<string, string>;
  onUpdateResults: (matches: Match[]) => void;
  onAddMatch: (match: Omit<Match, 'id'>) => void;
  onDeleteMatch?: (matchId: string) => void;
  onResetData?: () => void;
  officialChampion: string;
  onSetOfficialChampion: (id: string) => void;
  onShowPopup: (msg: string) => void;
}

export function AdminPanelView({ matches, users, allUserPredictions, allParticipants, championMap, onUpdateResults, onAddMatch, onDeleteMatch, onResetData, officialChampion, onSetOfficialChampion, onShowPopup }: AdminPanelProps) {
  const [localMatches, setLocalMatches] = useState<Match[]>(matches);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editUserId, setEditUserId] = useState<string>('');
  const [editPredictions, setEditPredictions] = useState<Prediction[]>([]);
  const [editChampion, setEditChampion] = useState<string>('');
  const [savingUser, setSavingUser] = useState(false);
  
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

  const handleSaveAll = async () => {
    await onUpdateResults(localMatches);
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

  React.useEffect(() => {
    if (editUserId) {
      const preds = allUserPredictions[editUserId] || [];
      setEditPredictions(preds.map(p => ({ ...p })));
      setEditChampion(championMap[editUserId] || '');
    } else {
      setEditPredictions([]);
      setEditChampion('');
    }
  }, [editUserId, allUserPredictions, championMap]);

  const handleEditScoreChange = (matchId: string, team: 'A' | 'B', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return;
    const numValue = value === '' ? '' : parseInt(value, 10);
    setEditPredictions(prev => {
      const existing = prev.find(p => p.matchId === matchId) || { matchId };
      const updated = { ...existing, [team === 'A' ? 'scoreA' : 'scoreB']: numValue };
      return [...prev.filter(p => p.matchId !== matchId), updated];
    });
  };

  const handleEditPenaltiesChange = (matchId: string, winnerId: string) => {
    setEditPredictions(prev => {
      const existing = prev.find(p => p.matchId === matchId) || { matchId };
      return [...prev.filter(p => p.matchId !== matchId), { ...existing, penaltiesWinner: winnerId }];
    });
  };

  const handleSaveUserPredictions = async () => {
    if (!editUserId) return;
    setSavingUser(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const api = (path: string) => API_URL ? `${API_URL}${path}` : path;

      const predRes = await fetch(api('/api/admin/predictions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUserId, predictions: editPredictions }),
      });
      const predData = await predRes.json();

      const champRes = await fetch(api('/api/admin/champion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: editUserId, championTeamId: editChampion || null }),
      });
      const champData = await champRes.json();

      if (predData.success && champData.success) {
        onShowPopup(`Pronósticos y campeón de ${users.find(u => u.id === editUserId)?.name || editUserId} actualizados.`);
      } else {
        onShowPopup('Error al guardar.');
      }
    } catch {
      onShowPopup('Error de conexión.');
    } finally {
      setSavingUser(false);
    }
  };

  const getEditPrediction = (matchId: string) => editPredictions.find(p => p.matchId === matchId) || {};

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

  const [exportMatchId, setExportMatchId] = useState<string>('');

  const handleExportData = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const hasKnockout = localMatches.some(m => m.stage !== 'Grupos');
    csvContent += "\"Partido\",\"Participante\",\"Prediccion_Local\",\"Prediccion_Visitante\"";
    if (hasKnockout) csvContent += ",\"Clasifica\"";
    csvContent += "\r\n";
    
    localMatches.forEach(match => {
      let hasAny = false;
      users.forEach(user => {
        const preds = allUserPredictions[user.id] || [];
        const p = preds.find(x => x.matchId === match.id);
        if (!p || p.scoreA === undefined || p.scoreB === undefined) return;
        hasAny = true;
        csvContent += `"${match.teamA.code} vs ${match.teamB.code}","${user.name}",${p.scoreA},${p.scoreB}`;
        if (match.stage !== 'Grupos') csvContent += `,"${TEAMS[p.penaltiesWinner]?.code || p.penaltiesWinner}"`;
        csvContent += "\r\n";
      });
      if (!hasAny) {
        csvContent += `"${match.teamA.code} vs ${match.teamB.code}","(sin pronósticos)",,`;
        if (match.stage !== 'Grupos') csvContent += `,""`;
        csvContent += "\r\n";
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

  const handleExportMatch = (matchId: string) => {
    const match = localMatches.find(m => m.id === matchId);
    if (!match) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"Partido","${match.teamA.code} vs ${match.teamB.code}"\r\n`;
    csvContent += "\"Participante\",\"Prediccion_Local\",\"Prediccion_Visitante\"";
    if (match.stage !== 'Grupos') csvContent += ",\"Clasifica\"";
    csvContent += "\r\n";

    users.forEach(user => {
      const preds = allUserPredictions[user.id] || [];
      const p = preds.find(x => x.matchId === match.id);
      const pA = p?.scoreA !== undefined ? p.scoreA : '';
      const pB = p?.scoreB !== undefined ? p.scoreB : '';
      const pW = p?.penaltiesWinner || '';
      csvContent += `"${user.name}",${pA},${pB}`;
      if (match.stage !== 'Grupos') csvContent += `,"${TEAMS[pW]?.code || pW}"`;
      csvContent += "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pronosticos_${match.teamA.code}_vs_${match.teamB.code}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <h2 className="text-2xl font-bold text-primary">Panel de Control</h2>
            <p className="text-sm text-slate-500">Gestión de torneos y resultados.</p>
          </div>
          <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
            <button 
              onClick={handleExportData}
              className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-50 transition text-[11px] sm:text-sm"
            >
              Exportar CSV
            </button>
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-[11px] sm:text-sm">
              <select
                value={exportMatchId}
                onChange={e => setExportMatchId(e.target.value)}
                className="p-2 font-bold text-slate-700 outline-none bg-transparent"
              >
                <option value="">Por partido...</option>
                {localMatches.map(m => (
                  <option key={m.id} value={m.id}>{m.teamA.code} vs {m.teamB.code}</option>
                ))}
              </select>
              <button
                onClick={() => { if (exportMatchId) handleExportMatch(exportMatchId); }}
                disabled={!exportMatchId}
                className="bg-primary text-white font-bold py-2 px-2 disabled:opacity-50"
              >
                Exportar
              </button>
            </div>
            <button
              onClick={handleSyncParticipants}
              disabled={syncing}
              className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-1 text-[11px] sm:text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sync Excel'}
            </button>
            <label className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-slate-50 transition cursor-pointer text-[11px] sm:text-sm">
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
              className="bg-secondary text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-red-700 transition text-[11px] sm:text-sm"
            >
              Guardar
            </button>
            {onResetData && (
              <button
                onClick={() => {
                  if (window.confirm('¿Reiniciar todos los datos? Se borrarán predicciones, resultados y campeón oficial.')) {
                    onResetData();
                  }
                }}
                className="bg-red-600 text-white font-bold py-2 px-3 rounded-lg shadow-sm hover:bg-red-800 transition text-[11px] sm:text-sm"
              >
                Reiniciar
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

      <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-200 shadow-sm">
        <h3 className="font-bold text-slate-700 mb-4">Editar Pronósticos de un Participante</h3>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          <select
            value={editUserId}
            onChange={e => setEditUserId(e.target.value)}
            className="w-full sm:w-64 border border-slate-200 rounded-lg p-2 text-sm font-bold text-slate-700 bg-white"
          >
            <option value="">Seleccionar participante...</option>
            {allParticipants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {editUserId && (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">Campeón:</span>
              <select
                value={editChampion}
                onChange={e => setEditChampion(e.target.value)}
                className="border border-slate-200 rounded p-1.5 text-xs font-bold text-primary bg-white"
              >
                <option value="">Ninguno...</option>
                {Object.entries(TEAMS).map(([key, t]) => (
                  <option key={key} value={key}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {editUserId && (
          <div className="space-y-3">
            {localMatches.map(match => {
              const pred = getEditPrediction(match.id);
              const isDraw = pred.scoreA !== undefined && pred.scoreB !== undefined && pred.scoreA === pred.scoreB && pred.scoreA !== '';
              const needsPenalties = match.stage !== 'Grupos' && isDraw;
              return (
                <div key={match.id} className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{match.stage} · {match.teamA.code} vs {match.teamB.code}</div>
                  <div className="flex items-center justify-between max-w-xs mx-auto gap-2">
                    <div className="flex flex-col items-center gap-1 w-1/3">
                      <div className="w-8 h-8 rounded-full border border-surface-dim bg-white flex items-center justify-center font-black text-[10px] text-primary shadow-sm">
                        {match.teamA.code}
                      </div>
                      <span className="font-semibold text-[10px] text-center leading-tight">{match.teamA.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text" inputMode="numeric" maxLength={2}
                        value={pred.scoreA ?? ''}
                        onChange={(e) => handleEditScoreChange(match.id, 'A', e.target.value)}
                        className="w-10 h-10 text-center text-base font-bold border border-slate-300 rounded focus:border-indigo-500 outline-none bg-white"
                        placeholder="-"
                      />
                      <span className="text-slate-300 font-black text-xs">-</span>
                      <input
                        type="text" inputMode="numeric" maxLength={2}
                        value={pred.scoreB ?? ''}
                        onChange={(e) => handleEditScoreChange(match.id, 'B', e.target.value)}
                        className="w-10 h-10 text-center text-base font-bold border border-slate-300 rounded focus:border-indigo-500 outline-none bg-white"
                        placeholder="-"
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1 w-1/3">
                      <div className="w-8 h-8 rounded-full border border-surface-dim bg-white flex items-center justify-center font-black text-[10px] text-primary shadow-sm">
                        {match.teamB.code}
                      </div>
                      <span className="font-semibold text-[10px] text-center leading-tight">{match.teamB.name}</span>
                    </div>
                  </div>
                  {needsPenalties && (
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Clasifica:</span>
                      <select
                        value={pred.penaltiesWinner || ''}
                        onChange={(e) => handleEditPenaltiesChange(match.id, e.target.value)}
                        className="border border-slate-200 rounded p-1 text-[10px] font-bold text-primary bg-white"
                      >
                        <option value="">Elegir...</option>
                        <option value={match.teamA.id}>{match.teamA.name}</option>
                        <option value={match.teamB.id}>{match.teamB.name}</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-center pt-2">
              <button
                onClick={handleSaveUserPredictions}
                disabled={savingUser}
                className="bg-indigo-600 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm hover:bg-indigo-700 transition disabled:opacity-50 text-sm"
              >
                {savingUser ? 'Guardando...' : `Guardar Pronósticos de ${allParticipants.find(p => p.id === editUserId)?.name || ''}`}
              </button>
            </div>
          </div>
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
