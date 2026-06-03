import React, { useState } from 'react';
import { Match, Prediction } from '../types';
import { TEAMS } from '../data';

interface PredictionsViewProps {
  matches: Match[];
  userPredictions: Prediction[];
  onSavePredictions: (predictions: Prediction[]) => void;
  onSaveChampion: (championId: string) => void;
  championPrediction?: string;
  confirmedMatchIds?: string[];
}

export function PredictionsView({ matches, userPredictions, onSavePredictions, onSaveChampion, championPrediction, confirmedMatchIds = [] }: PredictionsViewProps) {
  const [localPredictions, setLocalPredictions] = useState<Prediction[]>(userPredictions);
  const [champion, setChampion] = useState<string>(championPrediction || '');

  // Extract all unique dates
  const allDates = Array.from(new Set(matches.map(m => m.date.split('T')[0]))).sort();
  const [selectedDate, setSelectedDate] = useState<string>('todos');

  const matchesForDay = selectedDate === 'todos' ? matches : matches.filter(m => m.date.startsWith(selectedDate));

  const handleScoreChange = (matchId: string, team: 'A' | 'B', value: string) => {
    const numValue = value === '' ? '' : parseInt(value, 10);
    if (value !== '' && (isNaN(numValue as number) || (numValue as number) < 0)) return;

    setLocalPredictions(prev => {
      const existing = prev.find(p => p.matchId === matchId) || { matchId };
      const updated = { ...existing, [team === 'A' ? 'scoreA' : 'scoreB']: numValue };
      return [...prev.filter(p => p.matchId !== matchId), updated];
    });
  };

  const handlePenaltiesChange = (matchId: string, winnerId: string) => {
    setLocalPredictions(prev => {
      const existing = prev.find(p => p.matchId === matchId) || { matchId };
      return [...prev.filter(p => p.matchId !== matchId), { ...existing, penaltiesWinner: winnerId }];
    });
  };

  const getPrediction = (matchId: string) => localPredictions.find(p => p.matchId === matchId) || {};

  const isChampionLocked = !!championPrediction;

  return (
    <div className="p-4 pb-24 max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-primary">
            🏆 Elige a tu Campeón
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {isChampionLocked ? '¡Tu predicción ya está guardada!' : 'Selecciona antes de que inicie el torneo. Solo puedes elegir una vez.'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
           <span className="bg-red-100 text-secondary text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
            (5 Puntos Extra)
          </span>
          <div className="flex items-center gap-2">
            <select 
              value={champion}
              onChange={(e) => setChampion(e.target.value)}
              disabled={isChampionLocked}
              className={`border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none max-w-[150px] sm:max-w-xs font-semibold text-slate-700 ${isChampionLocked ? 'bg-slate-100 opacity-80' : 'bg-surface'}`}
            >
              <option value="">Ninguno...</option>
              {Object.values(TEAMS).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => onSaveChampion(champion)}
              disabled={isChampionLocked || !champion}
              className={`text-white text-sm font-bold px-4 py-2.5 rounded-lg shadow-sm flex items-center min-w-max transition-colors ${isChampionLocked ? 'bg-green-500 opacity-90 cursor-default' : (!champion ? 'bg-slate-300' : 'bg-primary hover:bg-primary-container')}`}
            >
              {isChampionLocked ? 'Confirmado ✓' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-1 gap-2">
          <h2 className="text-lg font-bold text-slate-800">
            {selectedDate === 'todos' ? 'Todos los Partidos' : 'Partidos del Día'}
          </h2>
          <select 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-slate-200 rounded-lg p-2 bg-white text-sm font-bold text-primary focus:ring-2 focus:ring-primary outline-none shadow-sm"
          >
            <option value="todos">TODOS LOS PARTIDOS</option>
            {allDates.map(d => {
              const dateObj = new Date(`${d}T12:00:00`);
              return (
                <option key={d} value={d}>
                  {dateObj.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}
                </option>
              );
            })}
          </select>
        </div>
        
        {matchesForDay.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-500 border border-slate-100">
            No hay partidos programados para este día.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.keys(matchesForDay.reduce((acc, match) => {
              const date = match.date.split('T')[0];
              if (!acc[date]) acc[date] = [];
              acc[date].push(match);
              return acc;
            }, {} as Record<string, Match[]>)).sort().map(dateStr => {
              const matchesInDate = matchesForDay.filter(m => m.date.startsWith(dateStr));
              const dateObj = new Date(`${dateStr}T12:00:00`);
              const formattedDate = dateObj.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase();
              
              return (
                <div key={dateStr} className="space-y-4">
                  {selectedDate === 'todos' && (
                    <h3 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mt-4 first:mt-0">{formattedDate}</h3>
                  )}
                  {matchesInDate.map(match => {
                    const pred = getPrediction(match.id);
                    const dt = new Date(match.date);
                    const timeString = dt.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
                    const dateString = dt.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });

                    const isDraw = pred.scoreA !== undefined && pred.scoreB !== undefined && pred.scoreA === pred.scoreB && pred.scoreA !== '';
                    const needsPenalties = match.stage !== 'Grupos' && isDraw;
                    const locked = match.isLocked;
                    const isConfirmed = confirmedMatchIds.includes(match.id);

                    return (
                      <div key={match.id} className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 relative overflow-hidden ${locked || isConfirmed ? 'bg-slate-50 border-slate-200 opacity-80' : ''}`}>
                      <span className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-lg ${locked ? 'bg-red-100 text-red-600' : isConfirmed ? 'bg-green-100 text-green-700' : 'bg-surface-dim text-primary'}`}>
                        {locked ? 'BLOQUEADO' : isConfirmed ? 'CONFIRMADO' : `${dateString} - ${timeString}`}
                      </span>
                      {match.stage !== 'Grupos' && (
                        <span className="absolute top-0 left-0 bg-green-200 text-green-800 text-[10px] font-bold px-3 py-1 rounded-br-lg">
                          {match.stage}
                        </span>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 max-w-sm mx-auto">
                        <div className="flex flex-col items-center gap-1.5 w-1/3">
                          <div className="w-10 h-10 rounded-full border-2 border-surface-dim bg-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm overflow-hidden text-center leading-none text-primary">
                            {match.teamA.code}
                          </div>
                          <span className="font-semibold text-xs text-center leading-tight">{match.teamA.name}</span>
                        </div>

                        <div className={`flex items-center gap-2 px-3 shadow-sm py-2 rounded-lg ${locked || isConfirmed ? 'bg-slate-100' : 'bg-surface'}`}>
                          <input 
                            type="number" min="0" value={pred.scoreA ?? ''} 
                            onChange={(e) => handleScoreChange(match.id, 'A', e.target.value)}
                            disabled={locked || isConfirmed}
                            className={`w-12 h-12 text-center text-xl font-bold border border-slate-300 rounded focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all ${locked || isConfirmed ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white'}`} placeholder="-"
                          />
                          <span className="text-slate-400 font-bold text-sm">vs</span>
                          <input 
                            type="number" min="0" value={pred.scoreB ?? ''} 
                            onChange={(e) => handleScoreChange(match.id, 'B', e.target.value)}
                            disabled={locked || isConfirmed}
                            className={`w-12 h-12 text-center text-xl font-bold border border-slate-300 rounded focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-all ${locked || isConfirmed ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-white'}`} placeholder="-"
                          />
                        </div>

                        <div className="flex flex-col items-center gap-1.5 w-1/3">
                          <div className="w-10 h-10 rounded-full border-2 border-surface-dim bg-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm overflow-hidden text-center leading-none text-primary">
                            {match.teamB.code}
                          </div>
                          <span className="font-semibold text-xs text-center leading-tight">{match.teamB.name}</span>
                        </div>
                      </div>

                      {needsPenalties && (
                        <div className={`mt-5 p-3 rounded-lg flex items-center justify-between border ${locked || isConfirmed ? 'bg-slate-100 border-slate-200' : 'bg-surface border-slate-100'}`}>
                          <span className="text-xs font-bold text-slate-600 uppercase">¿Quién clasifica? (Penales)</span>
                          <select 
                            value={pred.penaltiesWinner || ''}
                            onChange={(e) => handlePenaltiesChange(match.id, e.target.value)}
                            disabled={locked || isConfirmed}
                            className={`border border-slate-200 rounded p-1.5 text-sm font-bold text-primary ${locked || isConfirmed ? 'bg-slate-200 text-slate-500' : 'bg-white'}`}
                          >
                            <option value="">Elegir ganador...</option>
                            <option value={match.teamA.id}>{match.teamA.name}</option>
                            <option value={match.teamB.id}>{match.teamB.name}</option>
                          </select>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-center pt-2">
        <button 
          onClick={() => onSavePredictions(localPredictions)}
          className="bg-primary text-white font-bold py-3.5 px-8 rounded-full shadow-lg hover:bg-primary-container transition-transform active:scale-95 flex items-center gap-2"
        >
          <span>✅</span> Confirmar Todos los Partidos
        </button>
      </div>


    </div>
  );
}
