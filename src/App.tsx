import React, { useState } from 'react';
import { TopBar, BottomNav } from './components/Layout';
import { ViewState, Match, Prediction, User } from './types';
import { INITIAL_MATCHES, INITIAL_USERS } from './data';

import { WelcomeView } from './views/Welcome';
import { PredictionsView } from './views/PredictionsView';
import { RankingView } from './views/RankingView';
import { AdminPanelView } from './views/AdminPanel';
import { ProfileView } from './views/Profile';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('welcome');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [allUserPredictions, setAllUserPredictions] = useState<Record<string, Prediction[]>>({});
  const [officialChampion, setOfficialChampion] = useState<string>('');
  const [userAuthError, setUserAuthError] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  const calculatedUsers = React.useMemo(() => {
    return users.map(user => {
      let points = 0;

      const uPreds = allUserPredictions[user.id] || [];
      matches.forEach(match => {
        if (match.isFinished && match.realScoreA !== undefined && match.realScoreB !== undefined) {
          const pred = uPreds.find(p => p.matchId === match.id);
          if (pred && typeof pred.scoreA === 'number' && typeof pred.scoreB === 'number') {
            const realA = match.realScoreA;
            const realB = match.realScoreB;
            const predA = pred.scoreA;
            const predB = pred.scoreB;

            if (realA === predA && realB === predB) {
              points += 3; // Exact match
            } else if (
              (realA > realB && predA > predB) ||
              (realA < realB && predA < predB) ||
              (realA === realB && predA === predB)
            ) {
              points += 1; // Correct outcome
            }
          }
        }
      });

      if (officialChampion && user.championPrediction === officialChampion) {
        points += 5;
      }

      return { ...user, points };
    });
  }, [users, allUserPredictions, matches, officialChampion]);

  const currentUser = calculatedUsers.find(u => u.id === currentUserId);

  // Auth Logic
  const handleLoginUser = async (name: string, code: string) => {
    setIsAdmin(false);
    setUserAuthError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const url = API_URL ? `${API_URL}/api/auth/participant` : '/api/auth/participant';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();

      if (!data.valid) {
        setUserAuthError(data.error || 'Credenciales inválidas.');
        return;
      }

      let u = users.find(x => x.name.toLowerCase() === name.toLowerCase());
      if (!u) {
        u = { id: data.user.id, name: data.user.name, points: 0 };
        setUsers([...users, u]);
      }
      setCurrentUserId(u.id);
      setCurrentView('predictions');
    } catch {
      setUserAuthError('Error de conexión con el servidor.');
    }
  };

  const handleLoginAdmin = (password: string) => {
    if (password === 'admin28123') {
      setAdminAuthError('');
      setIsAdmin(true);
      setCurrentUserId(null);
      setCurrentView('adminPanel');
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
    }
  };

  // Actions
  const handleSavePredictions = (predictions: Prediction[]) => {
    if (currentUser) {
      setAllUserPredictions(prev => ({ ...prev, [currentUser.id]: predictions }));
    }
    setPopupMessage('¡Pronósticos de los partidos guardados correctamente!');
  };

  const handleSaveChampion = (championId: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u =>
      u.id === currentUser.id ? { ...u, championPrediction: championId } : u
    ));
    setPopupMessage('¡Selección de Campeón guardada correctamente!');
  };

  const handleUpdateAvatar = (url: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u =>
      u.id === currentUser.id ? { ...u, avatarUrl: url } : u
    ));
    setPopupMessage('Avatar actualizado correctamente');
  };

  const handleAdminUpdateResults = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
  };

  const handleAdminAddMatch = (newMatch: Omit<Match, 'id'>) => {
    const matchWithId: Match = { ...newMatch, id: `m${Date.now()}` };
    setMatches(prev => [...prev, matchWithId]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface relative font-inter">
      {currentView !== 'welcome' && (
        <TopBar onAvatarClick={() => setCurrentView('profile')} isAdmin={isAdmin} />
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
            allUserPredictions={allUserPredictions}
            users={calculatedUsers}
            championPrediction={currentUser.championPrediction}
            onSavePredictions={handleSavePredictions}
            onSaveChampion={handleSaveChampion}
          />
        )}

        {currentView === 'ranking' && currentUser && (
          <RankingView
            users={calculatedUsers}
            currentUser={currentUser}
            officialChampion={officialChampion}
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
            onUpdateResults={handleAdminUpdateResults}
            onAddMatch={handleAdminAddMatch}
            officialChampion={officialChampion}
            onSetOfficialChampion={(id) => {
              setOfficialChampion(id);
              setPopupMessage('¡Campeón oficial actualizado!');
            }}
            onShowPopup={(msg) => setPopupMessage(msg)}
          />
        )}
      </main>

      {currentView !== 'welcome' && (
        <BottomNav currentView={currentView} onChangeView={handleChangeView} isAdmin={isAdmin} />
      )}

      {/* Confirmation Popup */}
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
