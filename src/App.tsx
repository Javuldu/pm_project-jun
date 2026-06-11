import React, { useState, useEffect, useCallback } from 'react';
import { TopBar, BottomNav } from './components/Layout';
import { ViewState, Match, Prediction, User } from './types';
import { TEAMS, INITIAL_MATCHES } from './data';

import { WelcomeView } from './views/Welcome';
import { PredictionsView } from './views/PredictionsView';
import { RankingView } from './views/RankingView';
import { AdminPanelView } from './views/AdminPanel';
import { ProfileView } from './views/Profile';

const API_URL = import.meta.env.VITE_API_URL || '';

function api(path: string) {
  return API_URL ? `${API_URL}${path}` : path;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [matches, setMatches] = useState<Match[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [allUserPredictions, setAllUserPredictions] = useState<Record<string, Prediction[]>>({});
  const [officialChampion, setOfficialChampion] = useState<string>('');
  const [userAuthError, setUserAuthError] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [allParticipants, setAllParticipants] = useState<{id: string; name: string}[]>([]);
  const [confirmedMatchIds, setConfirmedMatchIds] = useState<string[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string>>({});
  const [championMap, setChampionMap] = useState<Record<string, string>>({});

  // Load common data + user-specific predictions from Supabase
  const loadData = useCallback(async (userId?: string) => {
    try {
      const uid = userId || currentUserId;
      if (!uid) return;

      const res = await fetch(api(`/api/data/${uid}`));
      const data = await res.json();

      if (data.error) return;

      if (data.matches) {
        const mappedMatches = data.matches.map(m => ({
          id: m.id,
          teamA: TEAMS[m.teamA] || { id: m.teamA, name: m.teamA, code: m.teamA.toUpperCase() },
          teamB: TEAMS[m.teamB] || { id: m.teamB, name: m.teamB, code: m.teamB.toUpperCase() },
          date: m.date,
          stage: m.stage,
          isFinished: m.isFinished,
          realScoreA: m.realScoreA,
          realScoreB: m.realScoreB,
          realPenaltiesWinner: m.realPenaltiesWinner,
          isLocked: m.isLocked,
        }));
        setMatches(mappedMatches);
      }

      if (data.userPredictions && uid) {
        setAllUserPredictions(prev => ({ ...prev, [uid]: data.userPredictions }));
        setConfirmedMatchIds(data.userPredictions.map(p => p.matchId));
      }

      if (data.championPredictions) {
        setChampionMap(data.championPredictions);
        setUsers(prev => prev.map(u => ({
          ...u,
          championPrediction: data.championPredictions[u.id] || u.championPrediction,
        })));
      }

      if (data.officialChampion !== undefined) {
        setOfficialChampion(data.officialChampion);
      }

      if (data.avatarUrls) {
        setAvatarMap(data.avatarUrls);
        setUsers(prev => prev.map(u => ({
          ...u,
          avatarUrl: data.avatarUrls[u.id] || u.avatarUrl,
        })));
      }
    } catch {
      // Silently fail, use local state
    }
  }, [currentUserId]);

  // Load initial matches if empty
  useEffect(() => {
    if (matches.length === 0) {
      setMatches(INITIAL_MATCHES);
    }
    setInitialLoading(false);
  }, []);

  // Load data when user changes
  useEffect(() => {
    if (currentUserId) {
      loadData(currentUserId);
    }
  }, [currentUserId]);

  const calculatedUsers = React.useMemo(() => {
    const allIds = new Set<string>();
    allParticipants.forEach(p => allIds.add(p.id));
    users.forEach(u => allIds.add(u.id));
    Object.keys(allUserPredictions).forEach(id => allIds.add(id));

    return Array.from(allIds).map(id => {
      const participant = allParticipants.find(p => p.id === id);
      const existingUser = users.find(u => u.id === id);
      let points = 0;
      let exactHits = 0;

      const uPreds = allUserPredictions[id] || [];
      matches.forEach(match => {
        if (match.isFinished && match.realScoreA != null && match.realScoreB != null) {
          const pred = uPreds.find(p => p.matchId === match.id);
          if (pred && typeof pred.scoreA === 'number' && typeof pred.scoreB === 'number') {
            const realA = match.realScoreA;
            const realB = match.realScoreB;
            const predA = pred.scoreA;
            const predB = pred.scoreB;

            if (realA === predA && realB === predB) {
              points += 3;
              exactHits++;
            } else if (
              (realA > realB && predA > predB) ||
              (realA < realB && predA < predB) ||
              (realA === realB && predA === predB)
            ) {
              points += 1;
            }

            if (
              predA === predB &&
              pred.penaltiesWinner &&
              match.realPenaltiesWinner &&
              pred.penaltiesWinner === match.realPenaltiesWinner
            ) {
              points += 1;
            }
          }
        }
      });

      const champPred = championMap[id] || existingUser?.championPrediction;
      if (officialChampion && champPred === officialChampion) {
        points += 5;
      }

      return {
        id,
        name: participant?.name || existingUser?.name || id,
        championPrediction: champPred,
        points,
        exactHits,
        avatarUrl: avatarMap[id] || existingUser?.avatarUrl,
      };
    });
  }, [allParticipants, users, allUserPredictions, matches, officialChampion, avatarMap, championMap]);

  const currentUser = calculatedUsers.find(u => u.id === currentUserId);

  // Auth
  const handleLoginUser = async (name: string, code: string) => {
    setIsAdmin(false);
    setUserAuthError('');

    try {
      const res = await fetch(api('/api/auth/participant'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();

      if (!data.valid) {
        setUserAuthError(data.error || 'Credenciales inválidas.');
        return;
      }

      const uid = data.user.id;
      let u = users.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (!u) {
        u = { id: uid, name: data.user.name, points: 0, exactHits: 0 };
        setUsers(prev => [...prev, u!]);
      }
      setCurrentUserId(uid);
      setCurrentView('predictions');
    } catch {
      setUserAuthError('Error de conexión con el servidor.');
    }
  };

  const loadAllData = useCallback(async (forUserId?: string) => {
    try {
      const res = await fetch(api('/api/all-data'));
      const data = await res.json();
      if (data.error) return;

      if (data.matches) {
        const mappedMatches = data.matches.map(m => ({
          id: m.id,
          teamA: TEAMS[m.teamA] || { id: m.teamA, name: m.teamA, code: m.teamA.toUpperCase() },
          teamB: TEAMS[m.teamB] || { id: m.teamB, name: m.teamB, code: m.teamB.toUpperCase() },
          date: m.date,
          stage: m.stage,
          isFinished: m.isFinished,
          realScoreA: m.realScoreA,
          realScoreB: m.realScoreB,
          realPenaltiesWinner: m.realPenaltiesWinner,
          isLocked: m.isLocked,
        }));
        setMatches(mappedMatches);
      }

      if (data.participants) {
        setAllParticipants(data.participants);
      }

      if (data.allPredictions) {
        setAllUserPredictions(data.allPredictions);
        const uid = forUserId;
        if (uid && data.allPredictions[uid]) {
          setConfirmedMatchIds(data.allPredictions[uid].map(p => p.matchId));
        }
      }

      if (data.championPredictions) {
        setChampionMap(data.championPredictions);
        setUsers(prev => prev.map(u => ({
          ...u,
          championPrediction: data.championPredictions[u.id] || u.championPrediction,
        })));
      }

      if (data.officialChampion !== undefined) {
        setOfficialChampion(data.officialChampion);
      }

      if (data.avatarUrls) {
        setAvatarMap(data.avatarUrls);
        setUsers(prev => prev.map(u => ({
          ...u,
          avatarUrl: data.avatarUrls[u.id] || u.avatarUrl,
        })));
      }
    } catch {}
  }, []);

  const loadCommonData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const loadRankingData = useCallback(async () => {
    await loadAllData(currentUserId || undefined);
  }, [loadAllData, currentUserId]);

  const handleLoginAdmin = (password: string) => {
    if (password === 'admin28123') {
      setAdminAuthError('');
      setIsAdmin(true);
      setCurrentUserId(null);
      setCurrentView('adminPanel');
      loadCommonData();
    } else {
      setAdminAuthError('Contraseña incorrecta.');
    }
  };

  const handleLogout = () => {
    setCurrentUserId(null);
    setIsAdmin(false);
    setCurrentView('welcome');
  };

  const handleChangeView = (view: ViewState) => {
    if (view === 'welcome') {
      handleLogout();
    } else {
      setCurrentView(view);
      if (view === 'ranking') {
        loadRankingData();
      }
    }
  };

  // ─── Actions (persist to Supabase) ───

  const handleSavePredictions = async (predictions: Prediction[]) => {
    if (!currentUser) return;

    try {
      const res = await fetch(api('/api/predictions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, predictions }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.saved && data.saved.length > 0) {
          setConfirmedMatchIds(prev => [...new Set([...prev, ...data.saved])]);
        }
        const savedPreds = predictions.filter(p => data.saved?.includes(p.matchId));
        const savedDesc = savedPreds.map(p => {
          const match = matches.find(m => m.id === p.matchId);
          if (!match) return '';
          const label = `${match.teamA.code} ${p.scoreA}-${p.scoreB} ${match.teamB.code}`;
          if (p.penaltiesWinner) {
            const team = TEAMS[p.penaltiesWinner];
            return `${label} (clasifica: ${team?.code || p.penaltiesWinner})`;
          }
          return label;
        }).filter(Boolean).join(', ');
        const msg = savedDesc ? `✅ ${savedDesc}` : '✅ Pronósticos guardados';
        setPopupMessage(msg);
      }
    } catch {
      setPopupMessage('Error de conexión al guardar.');
    }
  };

  const handleSaveChampion = async (championId: string) => {
    if (!currentUser) return;

    try {
      const res = await fetch(api('/api/champion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, championTeamId: championId }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers(prev => prev.map(u =>
          u.id === currentUser.id ? { ...u, championPrediction: championId } : u
        ));
        setPopupMessage(data.locked
          ? 'El campeón ya estaba confirmado anteriormente.'
          : '¡Selección de Campeón guardada correctamente!');
      }
    } catch {
      setPopupMessage('Error de conexión al guardar campeón.');
    }
  };

  const handleUpdateAvatar = async (url: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u =>
      u.id === currentUser.id ? { ...u, avatarUrl: url } : u
    ));

    try {
      await fetch(api('/api/avatar'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, avatarUrl: url }),
      });
    } catch {}

    setPopupMessage('Avatar actualizado correctamente');
  };

  const handleAdminUpdateResults = async (updatedMatches: Match[]) => {
    setMatches(updatedMatches);

    try {
      await fetch(api('/api/matches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: updatedMatches }),
      });
    } catch {}
  };

  const handleAdminAddMatch = async (newMatch: Omit<Match, 'id'>) => {
    const matchWithId: Match = { ...newMatch, id: `m${Date.now()}` };
    const updated = [...matches, matchWithId];
    setMatches(updated);

    try {
      await fetch(api('/api/matches'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches: updated }),
      });
    } catch {}
  };

  const handleAdminDeleteMatch = async (matchId: string) => {
    try {
      const res = await fetch(api(`/api/matches/${matchId}`), { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        setMatches(prev => prev.filter(m => m.id !== matchId));
        setPopupMessage('Partido eliminado correctamente.');
      }
    } catch {
      setPopupMessage('Error al eliminar el partido.');
    }
  };

  const handleResetData = async () => {
    try {
      const res = await fetch(api('/api/reset'), { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setMatches(prev => prev.map(m => ({ ...m, realScoreA: undefined, realScoreB: undefined, isFinished: false, isLocked: false })));
        setAllUserPredictions({});
        setConfirmedMatchIds([]);
        setUsers(prev => prev.map(u => ({ ...u, championPrediction: undefined })));
        setOfficialChampion('');
        setPopupMessage('Datos reiniciados correctamente.');
        loadCommonData();
      }
    } catch {
      setPopupMessage('Error al reiniciar datos.');
    }
  };

  const handleSetOfficialChampion = async (id: string) => {
    setOfficialChampion(id);

    try {
      await fetch(api('/api/official-champion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ championId: id }),
      });
    } catch {}

    setPopupMessage('¡Campeón oficial actualizado!');
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <p className="text-lg font-bold text-slate-500">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface relative font-inter">
      {currentView !== 'welcome' && (
        <TopBar onAvatarClick={() => setCurrentView('profile')} isAdmin={isAdmin} avatarUrl={currentUser?.avatarUrl} />
      )}

      <main className="flex-1 w-full overflow-y-auto">
        {currentView === 'welcome' && (
          <WelcomeView
            onLoginUser={handleLoginUser}
            onLoginAdmin={handleLoginAdmin}
            adminError={adminAuthError}
            userError={userAuthError}
          />
        )}

        {currentView === 'predictions' && currentUser && (
          <PredictionsView
            matches={matches}
            userPredictions={allUserPredictions[currentUser.id] || []}
            championPrediction={currentUser.championPrediction}
            onSavePredictions={handleSavePredictions}
            onSaveChampion={handleSaveChampion}
            confirmedMatchIds={confirmedMatchIds}
          />
        )}

        {currentView === 'ranking' && (currentUser || isAdmin) && (
          <RankingView
            users={calculatedUsers}
            currentUser={currentUser}
            officialChampion={officialChampion}
            isAdmin={isAdmin}
          />
        )}

        {currentView === 'profile' && currentUser && (
          <ProfileView user={currentUser} onUpdateAvatar={handleUpdateAvatar} />
        )}

        {currentView === 'adminPanel' && isAdmin && (
          <AdminPanelView
            matches={matches}
            users={calculatedUsers}
            allUserPredictions={allUserPredictions}
            allParticipants={allParticipants}
            championMap={championMap}
            onUpdateResults={handleAdminUpdateResults}
            onAddMatch={handleAdminAddMatch}
            onDeleteMatch={handleAdminDeleteMatch}
            onResetData={handleResetData}
            officialChampion={officialChampion}
            onSetOfficialChampion={handleSetOfficialChampion}
            onShowPopup={(msg) => setPopupMessage(msg)}
          />
        )}
      </main>

      {currentView !== 'welcome' && (
        <BottomNav currentView={currentView} onChangeView={handleChangeView} isAdmin={isAdmin} />
      )}

      {popupMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4 p-safe animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm flex flex-col items-center zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">¡Completado!</h3>
            <p className="text-slate-600 text-center font-medium mb-6">{popupMessage}</p>
            <button
              onClick={() => setPopupMessage(null)}
              className="bg-primary text-white font-bold py-3.5 px-8 rounded-lg w-full hover:bg-primary-container transition-colors shadow-sm active:scale-95"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
