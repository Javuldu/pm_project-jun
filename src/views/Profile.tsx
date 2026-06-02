import React, { useRef, useState } from 'react';
import { User } from '../types';
import { Camera, UserCircle } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onUpdateAvatar: (url: string) => void;
}

export function ProfileView({ user, onUpdateAvatar }: ProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrlInput, setImageUrlInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, upload to server. Here we use an object URL for demo functionality.
      const objectUrl = URL.createObjectURL(file);
      onUpdateAvatar(objectUrl);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrlInput.trim()) {
      onUpdateAvatar(imageUrlInput.trim());
      setImageUrlInput('');
    }
  };

  const PRESET_AVATARS = [
    { id: 'av1', url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Alex&backgroundColor=e2e8f0', label: 'Estilo 1' },
    { id: 'av2', url: 'https://api.dicebear.com/7.x/micah/svg?seed=Felix&backgroundColor=e2e8f0', label: 'Estilo 2' },
    { id: 'av3', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Mia&backgroundColor=e2e8f0', label: 'Estilo 3' },
    { id: 'av4', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Tech&backgroundColor=e2e8f0', label: 'Estilo 4' }
  ];

  return (
    <div className="p-4 pb-24 max-w-md mx-auto space-y-6">
      <div className="text-center py-6">
        <h2 className="text-2xl font-black text-primary">Mi Perfil</h2>
        <p className="text-slate-500 text-sm mt-1">Personaliza tu avatar para el ranking</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center">
        
        <div className="relative mb-6">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-md" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border-4 border-surface shadow-md">
              <UserCircle className="w-16 h-16" />
            </div>
          )}
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg hover:bg-primary-container transition-colors"
            title="Subir imagen"
          >
            <Camera className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
        <p className="text-sm font-medium text-secondary mt-1">{user.points} Puntos Totales</p>

        <div className="w-full mt-8 pt-6 border-t border-slate-100 text-left">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-3 text-center">Elegir un avatar genérico</label>
          <div className="flex justify-center gap-4 mb-6">
            {PRESET_AVATARS.map(avatar => (
              <button
                key={avatar.id}
                onClick={() => onUpdateAvatar(avatar.url)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-colors ${user.avatarUrl === avatar.url ? 'border-primary shadow-md' : 'border-slate-200 group-hover:border-slate-400'}`}>
                  <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                </div>
                <span className={`text-[10px] font-bold ${user.avatarUrl === avatar.url ? 'text-primary' : 'text-slate-500'}`}>{avatar.label}</span>
              </button>
            ))}
          </div>

          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">O pegar URL de imagen:</label>
          <form onSubmit={handleUrlSubmit} className="flex gap-2">
            <input 
              type="url" 
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://ejemplo.com/foto.jpg"
              className="flex-1 bg-surface border border-slate-200 rounded p-2 text-sm focus:border-primary outline-none"
            />
            <button 
              type="submit"
              className="bg-slate-200 text-slate-700 px-4 rounded text-sm font-bold hover:bg-slate-300 transition-colors"
            >
              Usar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
