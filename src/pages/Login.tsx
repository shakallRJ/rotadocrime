import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeDetetive, setNomeDetetive] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/jogo');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;

        if (authData.user) {
          const { error: insertError } = await supabase.from('jogadores').insert([
            {
              id: authData.user.id,
              nome_detetive: nomeDetetive,
              rank: 'Recruta',
              casos_resolvidos: 0,
              pontuacao_total: 0,
            }
          ]);
          if (insertError) throw insertError;
        }
        
        navigate('/jogo');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a] text-[#33ff33] font-mono flex flex-col p-4 border-4 border-[#1a1c1a] overflow-hidden select-none items-center justify-center">
      <div className="w-full max-w-md bg-[#050505] border-2 border-[#1a3a1a] p-6">
        <h1 className="text-2xl font-bold mb-6 text-center border-b border-[#1a3a1a] pb-4">
          ROTA DO CRIME<br/>
          <span className="text-xs font-normal opacity-60">SISTEMA DA INTERPOL</span>
        </h1>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-500 p-3 mb-4 text-xs font-bold uppercase">
            {">"} ERRO: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs uppercase opacity-80 mb-1">Nome de Detetive:</label>
              <input
                type="text"
                required
                value={nomeDetetive}
                onChange={(e) => setNomeDetetive(e.target.value)}
                className="w-full bg-[#0d100d] border border-[#33ff33] p-2 text-[#33ff33] outline-none focus:bg-[#1a3a1a]"
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs uppercase opacity-80 mb-1">Email:</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0d100d] border border-[#33ff33] p-2 text-[#33ff33] outline-none focus:bg-[#1a3a1a]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase opacity-80 mb-1">Senha (Cód. Acesso):</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0d100d] border border-[#33ff33] p-2 text-[#33ff33] outline-none focus:bg-[#1a3a1a]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#33ff33] text-black font-bold py-3 uppercase hover:bg-white transition-colors disabled:opacity-50 mt-6 cursor-pointer"
          >
            {loading ? 'Processando...' : isLogin ? 'Acessar Sistema' : 'Registrar Credencial'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="opacity-60 hover:opacity-100 hover:underline transition-opacity cursor-pointer uppercase font-bold"
          >
            {isLogin ? '> Solicitar Nova Credencial (Cadastro)' : '> Já possuo uma Credencial (Login)'}
          </button>
        </div>
      </div>
    </div>
  );
}
