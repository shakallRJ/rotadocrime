/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import Login from './pages/Login';
import GameDashboard from './pages/GameDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0c0a] text-[#33ff33] flex items-center justify-center font-mono">Carregando Sistema...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/jogo" element={<ProtectedRoute><GameDashboard /></ProtectedRoute>} />
          </Routes>
        </Router>
      </GameProvider>
    </AuthProvider>
  );
}
