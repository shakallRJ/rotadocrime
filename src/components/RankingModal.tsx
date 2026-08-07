import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Jogador } from '../types';
import { playBeep } from '../utils/sounds';

interface RankingModalProps {
  onClose: () => void;
}

export default function RankingModal({ onClose }: RankingModalProps) {
  const [jogadores, setJogadores] = useState<Jogador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const { data, error } = await supabase
          .from('jogadores')
          .select('id, nome_detetive, rank, casos_resolvidos, pontuacao_total')
          .order('pontuacao_total', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("Erro ao buscar ranking:", error);
        } else if (data) {
          setJogadores(data as Jogador[]);
        }
      } catch (err) {
        console.error("Erro inesperado:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-[#050505] border-2 border-[#33ff33] p-6 shadow-[0_0_20px_rgba(51,255,51,0.2)]">
        <div className="flex justify-between items-center border-b-2 border-[#1a3a1a] pb-4 mb-6">
          <h2 className="text-xl font-bold text-[#33ff33] uppercase">Ranking Mundial - Interpol</h2>
          <button 
            onClick={() => { playBeep(); onClose(); }}
            className="text-red-500 font-bold hover:text-white hover:bg-red-900/50 px-2 py-1 transition-colors uppercase border border-red-900/50"
          >
            Fechar [X]
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 opacity-70 text-[#33ff33] uppercase animate-pulse">
            Carregando banco de dados da Interpol...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#33ff33]">
              <thead className="bg-[#1a3a1a] text-xs uppercase border-b border-[#33ff33]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Detetive</th>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3 text-right">Casos</th>
                  <th className="px-4 py-3 text-right">Pontuação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a3a1a]">
                {jogadores.map((jogador, index) => (
                  <tr key={jogador.id} className="hover:bg-[#0d1f0d] transition-colors">
                    <td className="px-4 py-3 font-bold">{index + 1}</td>
                    <td className="px-4 py-3 uppercase">{jogador.nome_detetive || 'Desconhecido'}</td>
                    <td className="px-4 py-3 uppercase">{jogador.rank || 'Recruta'}</td>
                    <td className="px-4 py-3 text-right">{jogador.casos_resolvidos || 0}</td>
                    <td className="px-4 py-3 text-right font-bold">{jogador.pontuacao_total || 0}</td>
                  </tr>
                ))}
                {jogadores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center opacity-60 uppercase">
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
