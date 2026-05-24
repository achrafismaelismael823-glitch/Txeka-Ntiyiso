// src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/auth';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo e Nome */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇲🇿</span>
          <div>
            <h1 className="text-lg font-bold">DocVerify MZ</h1>
            <p className="text-xs text-blue-200">Portal de Verificação</p>
          </div>
        </div>

        {/* Informações de Utilizador */}
        {user && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User size={18} />
              <span className="hidden sm:inline">{user.username}</span>
            </div>

            {/* Botão Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-lg text-sm font-semibold transition"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
