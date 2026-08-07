/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { Cidade } from '../types';
import RankingModal from '../components/RankingModal';
import { playBeep, playTravel } from '../utils/sounds';

export default function GameDashboard() {
  const { user, jogador, signOut } = useAuth();
  const [isRankingOpen, setIsRankingOpen] = useState(false);

  const { 
    gameState, 
    iniciarNovoCaso, 
    viajarParaCidade, 
    investigarLocal, 
    emitirMandado, 
    formatarDataHora 
  } = useGame();

  const [sexo, setSexo] = useState('');
  const [hobby, setHobby] = useState('');
  const [cabelo, setCabelo] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [caracteristica, setCaracteristica] = useState('');

  // Extract unique options from the database
  const opcoesSexo = Array.from(new Set(gameState.todosSuspeitos?.map(s => s.sexo) || [])).sort();
  const opcoesHobby = Array.from(new Set(gameState.todosSuspeitos?.map(s => s.hobby) || [])).sort();
  const opcoesCabelo = Array.from(new Set(gameState.todosSuspeitos?.map(s => s.cabelo) || [])).sort();
  const opcoesVeiculo = Array.from(new Set(gameState.todosSuspeitos?.map(s => s.veiculo) || [])).sort();
  const opcoesCaracteristica = Array.from(new Set(gameState.todosSuspeitos?.map(s => s.caracteristica) || [])).sort();

  // Inicia um novo caso ao carregar o app, se ainda não houver cidadeAtual
  useEffect(() => {
    if (!gameState.cidadeAtual) {
      iniciarNovoCaso();
    }
  }, [gameState.cidadeAtual, iniciarNovoCaso]);

  const handleInvestigar = (local: string) => {
    if (gameState.fimDeJogo) return;
    playTravel();
    investigarLocal(local);
  };

  const handleEmitirMandado = () => {
    if (gameState.suspeitoAtual && !gameState.fimDeJogo) {
      playTravel();
      emitirMandado({ sexo, hobby, cabelo, veiculo, caracteristica });
    }
  };

  const handleJogarNovamente = () => {
    setSexo('');
    setHobby('');
    setCabelo('');
    setVeiculo('');
    setCaracteristica('');
    iniciarNovoCaso();
  };

  return (
    <div className="min-h-screen bg-[#0a0c0a] text-[#33ff33] font-mono flex flex-col p-4 border-4 border-[#1a1c1a] overflow-hidden select-none">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between md:items-center border-b-2 border-[#1a3a1a] pb-4 mb-4 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:space-x-6">
          <div className="bg-[#33ff33] text-black px-3 py-1 font-bold tracking-widest text-xl shadow-[0_0_15px_rgba(51,255,51,0.4)] self-start md:self-auto">
            ROTA DO CRIME
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-60">Agente Atual</span>
            <span className="text-lg">DET. {jogador?.nome_detetive || 'DESCONHECIDO'} [{jogador?.rank?.toUpperCase() || 'RECRUTA'}]</span>
          </div>
        </div>
        <div className="flex flex-row justify-between md:justify-end md:space-x-12">
          <div className="text-left md:text-right">
            <span className="text-[10px] uppercase opacity-60">Localização</span>
            <div className="text-sm md:text-lg uppercase">
              {gameState.cidadeAtual ? `${gameState.cidadeAtual.nome}, ${gameState.cidadeAtual.pais}` : 'CARREGANDO...'}
            </div>
          </div>
          <div className="text-right border-l border-[#1a3a1a] pl-4 md:pl-6">
            <span className="text-[10px] uppercase opacity-60">Prazo do Caso</span>
            <div className={`text-lg md:text-xl ${gameState.fimDeJogo ? 'text-red-500' : 'text-yellow-500'}`}>
              {formatarDataHora()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Gameplay Grid */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden pb-10 lg:pb-0">
        {/* Left: Travel & Navigation */}
        <div className="order-2 lg:order-none lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-[#0d100d] border border-[#1a3a1a] p-3 flex flex-col">
            <h3 className="text-[11px] uppercase border-b border-[#1a3a1a] pb-1 mb-2 opacity-80">Mapa Global</h3>
            <div className="flex-1 bg-[#050505] relative border border-[#1a3a1a] overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#33ff33_1px,transparent_1px)] [background-size:20px_20px]"></div>
              <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 left-2/3 w-2 h-2 bg-[#33ff33] rounded-full"></div>
              <div className="absolute bottom-10 left-10 text-[9px] opacity-40 uppercase">Frequência: 142.8MHz</div>
            </div>
            <div className="mt-3 space-y-2">
              {gameState.destinosAtuais.map(destino => (
                <button 
                  key={destino.id}
                  onClick={() => { playTravel(); viajarParaCidade(destino); }}
                  disabled={gameState.fimDeJogo}
                  className="w-full text-left p-2 border border-[#33ff33] hover:bg-[#33ff33] hover:text-black transition-colors text-xs uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Viajar: {destino.nome} (-4h)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Investigation Area */}
        <div className="order-1 lg:order-none lg:col-span-6 flex flex-col gap-4">
          <div className="relative flex-1 bg-[#050505] border-2 border-[#1a3a1a] overflow-hidden flex flex-col min-h-[500px] lg:min-h-0">
            <div className="h-48 w-full bg-[#111] relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">🏛️</div>
              <div className="absolute bottom-2 left-2 bg-black/80 p-2 text-[10px] border border-[#33ff33] uppercase">
                VISUALIZAÇÃO: {gameState.cidadeAtual ? gameState.cidadeAtual.nome : 'DESCONHECIDO'}
              </div>
              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
            </div>

            <div className="p-6 flex-1 flex flex-col overflow-y-auto">
              <div className="flex-1 text-sm leading-relaxed text-[#aaffaa]">
                <span className="block mb-4 text-[#33ff33]">{">"} [RELATÓRIO DE INVESTIGAÇÃO]</span>
                {gameState.tesouroAtual && (
                  <p className="mb-4">O item <span className="text-white font-bold underline">{gameState.tesouroAtual.nome}</span> foi roubado!</p>
                )}
                
                {gameState.pistasColetadas.length > 0 ? (
                  <ul className="space-y-2 mt-4">
                    {gameState.pistasColetadas.map((pista, idx) => (
                      <li key={idx}>- {pista}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="opacity-60 italic">Nenhuma pista coletada neste local. Investigue os estabelecimentos abaixo.</p>
                )}

                {gameState.fimDeJogo && (
                  <div className="mt-6 p-4 border border-red-500 bg-red-900/30 flex flex-col items-center">
                    <span className="text-red-500 font-bold uppercase text-center mb-4">
                      {gameState.vitoria ? 'CASO ENCERRADO COM SUCESSO.' : 'TEMPO ESGOTADO OU SUSPEITO ESCAPOU.'}
                    </span>
                    <button 
                      onClick={handleJogarNovamente}
                      className="bg-[#33ff33] hover:bg-white text-black font-bold py-3 px-6 uppercase transition-colors w-full cursor-pointer">
                      JOGAR NOVAMENTE
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#1a3a1a] mt-4">
                <button 
                  onClick={() => handleInvestigar('Banco')}
                  disabled={gameState.fimDeJogo}
                  className="bg-[#1a3a1a] hover:bg-[#33ff33] hover:text-black p-3 text-center text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  INVESTIGAR BANCO
                </button>
                <button 
                  onClick={() => handleInvestigar('Polícia')}
                  disabled={gameState.fimDeJogo}
                  className="bg-[#1a3a1a] hover:bg-[#33ff33] hover:text-black p-3 text-center text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  FALAR COM POLICIAL
                </button>
                <button 
                  onClick={() => handleInvestigar('Museu')}
                  disabled={gameState.fimDeJogo}
                  className="bg-[#1a3a1a] hover:bg-[#33ff33] hover:text-black p-3 text-center text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  VISITAR MUSEU
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Interpol Computer / Suspect Data */}
        <div className="order-3 lg:order-none lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 bg-[#0d100d] border border-[#1a3a1a] p-3 flex flex-col min-h-[500px] lg:min-h-0">
            <h3 className="text-[11px] uppercase border-b border-[#1a3a1a] pb-1 mb-3 opacity-80 font-bold">Computador da Interpol</h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <div className="text-[10px] bg-black p-2 border border-[#1a3a1a]">
                <label className="block opacity-50 mb-1 uppercase">Sexo:</label>
                <select value={sexo} onChange={(e) => { playBeep(); setSexo(e.target.value); }} className="w-full bg-transparent outline-none text-[#33ff33] cursor-pointer">
                  <option value="">SELECIONE...</option>
                  {opcoesSexo.map(op => (
                    <option key={op} value={op}>{op.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] bg-black p-2 border border-[#1a3a1a]">
                <label className="block opacity-50 mb-1 uppercase">Hobby:</label>
                <select value={hobby} onChange={(e) => { playBeep(); setHobby(e.target.value); }} className="w-full bg-transparent outline-none text-[#33ff33] cursor-pointer">
                  <option value="">SELECIONE...</option>
                  {opcoesHobby.map(op => (
                    <option key={op} value={op}>{op.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] bg-black p-2 border border-[#1a3a1a]">
                <label className="block opacity-50 mb-1 uppercase">Cabelo:</label>
                <select value={cabelo} onChange={(e) => { playBeep(); setCabelo(e.target.value); }} className="w-full bg-transparent outline-none text-[#33ff33] cursor-pointer">
                  <option value="">SELECIONE...</option>
                  {opcoesCabelo.map(op => (
                    <option key={op} value={op}>{op.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] bg-black p-2 border border-[#1a3a1a]">
                <label className="block opacity-50 mb-1 uppercase">Veículo:</label>
                <select value={veiculo} onChange={(e) => { playBeep(); setVeiculo(e.target.value); }} className="w-full bg-transparent outline-none text-[#33ff33] cursor-pointer">
                  <option value="">SELECIONE...</option>
                  {opcoesVeiculo.map(op => (
                    <option key={op} value={op}>{op.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="text-[10px] bg-black p-2 border border-[#1a3a1a]">
                <label className="block opacity-50 mb-1 uppercase">Característica:</label>
                <select value={caracteristica} onChange={(e) => { playBeep(); setCaracteristica(e.target.value); }} className="w-full bg-transparent outline-none text-[#33ff33] cursor-pointer">
                  <option value="">SELECIONE...</option>
                  {opcoesCaracteristica.map(op => (
                    <option key={op} value={op}>{op.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 p-2 bg-yellow-900/20 border border-yellow-600/50 text-[10px] leading-tight">
              <span className="text-yellow-500 font-bold uppercase block mb-1 underline">Estado do Mandado</span>
              {gameState.erroMandado && (
                <div className="text-red-500 mb-2 font-bold">{gameState.erroMandado}</div>
              )}
              {gameState.mandadoEmitido ? (
                <span className="text-green-400">MANDADO EMITIDO: {gameState.mandadoEmitido.nome.toUpperCase()}</span>
              ) : (
                <span>NENHUM MANDADO EMITIDO. IDENTIFIQUE O SUSPEITO PARA EFETUAR A PRISÃO.</span>
              )}
            </div>

            <button 
              onClick={handleEmitirMandado}
              disabled={gameState.fimDeJogo || gameState.mandadoEmitido !== null}
              className="mt-3 w-full bg-[#33ff33] text-black font-bold py-2 text-xs uppercase hover:bg-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              Emitir Mandado (-3h)
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Status Bar */}
      <footer className="mt-4 flex flex-col md:flex-row items-center justify-between border-t-2 border-[#1a3a1a] text-[11px] pt-2 md:h-12 gap-2 pb-4 lg:pb-0">
        <div className="flex flex-wrap items-center justify-center gap-2 md:space-x-6">
          <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> DB: CONECTADO</div>
          <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div> CASOS RESOLVIDOS: {jogador?.casos_resolvidos || 0}</div>
          <div className="hidden md:flex items-center opacity-60 italic uppercase">ID: #{user?.id?.substring(0,8) || '55-A92B10-S'}</div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 md:space-x-4 mt-2 md:mt-0">
          <div className="px-2 py-1 bg-[#1a3a1a] text-[#33ff33]">PONTUAÇÃO: {jogador?.pontuacao_total || 0}</div>
          <button onClick={() => { playBeep(); setIsRankingOpen(true); }} className="px-2 py-1 bg-[#1a3a1a] text-[#33ff33] border border-[#33ff33] hover:bg-[#33ff33] hover:text-black font-bold uppercase cursor-pointer transition-colors">RANKING MUNDIAL</button>
          <button onClick={() => { playBeep(); signOut(); }} className="px-2 py-1 bg-red-900/30 text-red-500 border border-red-500/30 font-bold uppercase cursor-pointer hover:bg-red-900/50 transition-colors">Sair</button>
        </div>
      </footer>

      {isRankingOpen && (
        <RankingModal onClose={() => setIsRankingOpen(false)} />
      )}
    </div>
  );
}
