import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Cidade, Suspeito, Tesouro } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

export interface CaracteristicasMandado {
  sexo: string;
  hobby: string;
  cabelo: string;
  veiculo: string;
}

interface GameState {
  dia: number; // 0 = Segunda-feira, 1 = Terça-feira, etc.
  hora: number; // 0 a 23
  cidadeAtual: Cidade | null;
  pistasColetadas: string[];
  mandadoEmitido: Suspeito | null;
  erroMandado: string | null;
  rotaDoBandido: Cidade[];
  suspeitoAtual: Suspeito | null;
  tesouroAtual: Tesouro | null;
  fimDeJogo: boolean;
  vitoria: boolean;
  todasCidades: Cidade[];
  destinosAtuais: Cidade[];
}

interface GameContextData {
  gameState: GameState;
  avancarTempo: (horas: number) => void;
  viajarParaCidade: (cidade: Cidade) => void;
  adicionarPista: (pista: string) => void;
  emitirMandado: (caracteristicas: CaracteristicasMandado) => void;
  formatarDataHora: () => string;
  iniciarNovoCaso: () => Promise<void>;
  investigarLocal: (local: string) => void;
}

const GameContext = createContext<GameContextData | undefined>(undefined);

const DIAS_DA_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo'
];

// O prazo limite padrão costuma ser Domingo às 18:00
const DIA_LIMITE = 6; // Domingo
const HORA_LIMITE = 18;

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { fetchJogador } = useAuth();
  const [gameState, setGameState] = useState<GameState>({
    dia: 0, // Inicia na Segunda-feira
    hora: 9, // Inicia às 09:00
    cidadeAtual: null,
    pistasColetadas: [],
    mandadoEmitido: null,
    erroMandado: null,
    rotaDoBandido: [],
    suspeitoAtual: null,
    tesouroAtual: null,
    fimDeJogo: false,
    vitoria: false,
    todasCidades: [],
    destinosAtuais: [],
  });

  const avancarTempo = (horas: number) => {
    setGameState((prev) => {
      if (prev.fimDeJogo) return prev;

      let novaHora = prev.hora + horas;
      let novoDia = prev.dia;

      // Virada de dia
      if (novaHora >= 24) {
        novoDia += Math.floor(novaHora / 24);
        novaHora = novaHora % 24;
      }

      // Verifica se o tempo esgotou (Domingo às 18:00)
      let fimDeJogo = prev.fimDeJogo;
      if (novoDia > DIA_LIMITE || (novoDia === DIA_LIMITE && novaHora >= HORA_LIMITE)) {
        fimDeJogo = true;
      }

      return { 
        ...prev, 
        hora: novaHora, 
        dia: novoDia, 
        fimDeJogo 
      };
    });
  };

  const viajarParaCidade = (cidade: Cidade) => {
    setGameState((prev) => {
      const indexAtualNova = prev.rotaDoBandido.findIndex(c => c.id === cidade.id);
      
      let proximaCorreta: Cidade | null = null;
      if (indexAtualNova >= 0 && indexAtualNova < prev.rotaDoBandido.length - 1) {
        proximaCorreta = prev.rotaDoBandido[indexAtualNova + 1];
      } else if (indexAtualNova === -1) {
        proximaCorreta = prev.cidadeAtual; // If lost, allow traveling back
      }
      
      let destinos = proximaCorreta ? [proximaCorreta] : [];
      
      const cidadesDisponiveis = prev.todasCidades.filter(c => 
        c.id !== cidade.id && !destinos.find(d => d.id === c.id)
      );
      const cidadesEmbaralhadas = [...cidadesDisponiveis].sort(() => 0.5 - Math.random());
      destinos = [...destinos, ...cidadesEmbaralhadas.slice(0, 3 - destinos.length)].sort(() => 0.5 - Math.random());

      return {
        ...prev,
        cidadeAtual: cidade,
        pistasColetadas: indexAtualNova === -1 ? ["Você perdeu o rastro! Ninguém por aqui parece ter visto o suspeito."] : [],
        destinosAtuais: destinos
      };
    });
    // Exemplo: Viajar consome 4 horas (pode ser dinâmico no futuro)
    avancarTempo(4); 
  };

  const adicionarPista = (pista: string) => {
    setGameState((prev) => ({
      ...prev,
      pistasColetadas: [...prev.pistasColetadas, pista],
    }));
    // Exemplo: Investigar um local consome 2 horas
    avancarTempo(2);
  };

  const investigarLocal = (local: string) => {
    if (gameState.fimDeJogo || !gameState.cidadeAtual || !gameState.suspeitoAtual) return;

    const indexAtual = gameState.rotaDoBandido.findIndex(c => c.id === gameState.cidadeAtual?.id);
    
    if (indexAtual === -1) {
      adicionarPista(`No(a) ${local}: "Não vi ninguém com essa descrição por aqui."`);
      return;
    }

    const isUltimaCidade = indexAtual === gameState.rotaDoBandido.length - 1;

    let novaPista = "";

    if (isUltimaCidade) {
      if (Math.random() <= 0.3) {
        // Encontrou o bandido
        const temMandadoValido = gameState.mandadoEmitido?.id === gameState.suspeitoAtual.id;
        
        if (temMandadoValido) {
          // Vitória: atualizar pontuação no Supabase
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              supabase.from('jogadores').select('casos_resolvidos, pontuacao_total').eq('id', user.id).single().then(({ data }) => {
                if (data) {
                  const novosCasos = (data.casos_resolvidos || 0) + 1;
                  const novaPontuacao = (data.pontuacao_total || 0) + 100;
                  supabase.from('jogadores').update({
                    casos_resolvidos: novosCasos,
                    pontuacao_total: novaPontuacao
                  }).eq('id', user.id).then(() => {
                    fetchJogador(user.id);
                  });
                }
              });
            }
          });
        }
        
        setGameState(prev => ({
          ...prev,
          fimDeJogo: true,
          vitoria: temMandadoValido,
          pistasColetadas: [
            ...prev.pistasColetadas,
            temMandadoValido 
              ? `🚨 VOCÊ ENCONTROU O SUSPEITO! Como você tinha um mandado válido contra ${gameState.suspeitoAtual?.nome}, a prisão foi efetuada e o tesouro recuperado! +1 Caso Resolvido e +100 Pontos adicionados ao seu registro da Interpol!`
              : `❌ VOCÊ ENCONTROU O SUSPEITO! No entanto, sem um mandado de prisão válido e com características exatas, o suspeito escapou pelos fundos...`
          ]
        }));
        
        avancarTempo(2);
        return;
      }

      const falasFinais = [
        `"Cuidado, detetive! Fiquei sabendo que o suspeito está escondido por aqui!"`,
        `"Vi alguém muito nervoso passando por aqui. Acho que o esconderijo é perto!"`,
        `"A pessoa parecia estar se preparando para ficar. Cuidado ao tentar a prisão!"`
      ];
      novaPista = `No(a) ${local}: ${falasFinais[Math.floor(Math.random() * falasFinais.length)]}`;
    } else {
      const proximaCidade = gameState.rotaDoBandido[indexAtual + 1];
      const darDicaCidade = Math.random() > 0.5;

      if (darDicaCidade && proximaCidade) {
        const dicasCidade = [
          `"A pessoa queria trocar dinheiro por ${proximaCidade.moeda}."`,
          `"Vi a pessoa lendo um livro sobre ${proximaCidade.ponto_turistico}."`,
          `"O suspeito perguntou sobre os voos para um país com a bandeira nas cores ${proximaCidade.bandeira_cores}."`,
          `"Ouvi o suspeito comentando que iria para um lugar com aproximadamente ${proximaCidade.populacao} habitantes."`
        ];
        novaPista = `No(a) ${local}: ${dicasCidade[Math.floor(Math.random() * dicasCidade.length)]}`;
      } else {
        const dicasSuspeito = [
          `"Notei que a pessoa era do sexo ${gameState.suspeitoAtual.sexo.toLowerCase()}."`,
          `"A pessoa tinha cabelo ${gameState.suspeitoAtual.cabelo.toLowerCase()}."`,
          `"Notei que a pessoa tinha um(a) ${gameState.suspeitoAtual.caracteristica.toLowerCase()}."`,
          `"A pessoa mencionou que adora jogar ${gameState.suspeitoAtual.hobby.toLowerCase()}."`,
          `"A pessoa fugiu em um(a) ${gameState.suspeitoAtual.veiculo.toLowerCase()}."`
        ];
        novaPista = `No(a) ${local}: ${dicasSuspeito[Math.floor(Math.random() * dicasSuspeito.length)]}`;
      }
    }

    adicionarPista(novaPista);
  };

  const emitirMandado = (caracteristicas: CaracteristicasMandado) => {
    if (gameState.fimDeJogo || !gameState.suspeitoAtual) return;

    const { sexo, hobby, cabelo, veiculo } = caracteristicas;
    const s = gameState.suspeitoAtual;

    // Ignora campos vazios na verificação, mas exige que todos preenchidos batam, e todos precisam estar preenchidos para emissão?
    // A regra clássica exige preencher os dados. Vamos exigir match exato se o valor não for "SELECIONE" ou string vazia.
    // Vamos simplificar: todos têm que bater exatamente.
    const bateSexo = !sexo || s.sexo.toLowerCase() === sexo.toLowerCase();
    const bateHobby = !hobby || s.hobby.toLowerCase() === hobby.toLowerCase();
    const bateCabelo = !cabelo || s.cabelo.toLowerCase() === cabelo.toLowerCase();
    const bateVeiculo = !veiculo || s.veiculo.toLowerCase() === veiculo.toLowerCase();

    // Precisa preencher pelo menos alguns para cruzar os dados, mas aqui vamos assumir que o jogador escolhe as 4
    if (sexo && hobby && cabelo && veiculo && bateSexo && bateHobby && bateCabelo && bateVeiculo) {
      setGameState((prev) => ({
        ...prev,
        mandadoEmitido: prev.suspeitoAtual,
        erroMandado: null
      }));
    } else {
      setGameState((prev) => ({
        ...prev,
        mandadoEmitido: null,
        erroMandado: "DADOS INCONSISTENTES: Nenhum suspeito encontrado com essas características."
      }));
    }

    // Emitir mandado consome 3 horas
    avancarTempo(3);
  };

  const formatarDataHora = () => {
    // Evita index out of bounds se o jogo passar de domingo (dia 6)
    const diaSeguro = Math.min(gameState.dia, DIA_LIMITE); 
    const diaStr = DIAS_DA_SEMANA[diaSeguro];
    const horaStr = gameState.hora.toString().padStart(2, '0');
    return `${diaStr}, ${horaStr}:00`;
  };

  const iniciarNovoCaso = async () => {
    try {
      // 1. Busca tesouros, suspeitos e cidades no Supabase
      const { data: tesouros, error: erroTesouro } = await supabase.from('tesouros').select('*');
      const { data: suspeitos, error: erroSuspeito } = await supabase.from('suspeitos').select('*');
      const { data: cidades, error: erroCidades } = await supabase.from('cidades').select('*');

      let tesourosDados = tesouros || [];
      let suspeitosDados = suspeitos || [];
      let cidadesDados = cidades || [];

      if (erroTesouro || !tesourosDados.length) {
        console.warn('Erro ao buscar tesouros ou tabela vazia:', erroTesouro);
        tesourosDados = [{ id: '1', nome: 'Coroa Real', cidade_origem_id: '1', dificuldade: 'Fácil' }];
      }

      if (erroSuspeito || !suspeitosDados.length) {
        console.warn('Erro ao buscar suspeitos ou tabela vazia:', erroSuspeito);
        suspeitosDados = [{ id: '1', nome: 'Carmen Sandiego', sexo: 'Feminino', cabelo: 'Preto', caracteristica: 'Chapéu Vermelho', veiculo: 'Conversível', hobby: 'Tênis' }];
      }

      if (erroCidades || cidadesDados.length < 5) {
        console.warn('Erro ao buscar cidades ou tabela com poucas cidades:', erroCidades);
        cidadesDados = [
          { id: '1', nome: 'Londres', pais: 'Reino Unido', populacao: 8900000, bandeira_cores: 'Vermelho, Azul e Branco', moeda: 'Libra', ponto_turistico: 'Big Ben' },
          { id: '2', nome: 'Paris', pais: 'França', populacao: 2100000, bandeira_cores: 'Azul, Branco e Vermelho', moeda: 'Euro', ponto_turistico: 'Torre Eiffel' },
          { id: '3', nome: 'Roma', pais: 'Itália', populacao: 2800000, bandeira_cores: 'Verde, Branco e Vermelho', moeda: 'Euro', ponto_turistico: 'Coliseu' },
          { id: '4', nome: 'Berlim', pais: 'Alemanha', populacao: 3600000, bandeira_cores: 'Preto, Vermelho e Amarelo', moeda: 'Euro', ponto_turistico: 'Portão de Brandemburgo' },
          { id: '5', nome: 'Madri', pais: 'Espanha', populacao: 3200000, bandeira_cores: 'Vermelho e Amarelo', moeda: 'Euro', ponto_turistico: 'Palácio Real' }
        ];
      }

      // 2. Garante que os casos e suspeitos não se repitam usando localStorage
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'guest';
      const seenTesourosKey = `seen_tesouros_${userId}`;
      const seenSuspeitosKey = `seen_suspeitos_${userId}`;
      
      let seenTesouros: string[] = [];
      let seenSuspeitos: string[] = [];
      
      try {
        const storedT = localStorage.getItem(seenTesourosKey);
        if (storedT) seenTesouros = JSON.parse(storedT);
        
        const storedS = localStorage.getItem(seenSuspeitosKey);
        if (storedS) seenSuspeitos = JSON.parse(storedS);
      } catch (e) {}

      let availableTesouros = tesourosDados.filter((t: any) => !seenTesouros.includes(t.id));
      let availableSuspeitos = suspeitosDados.filter((s: any) => !seenSuspeitos.includes(s.id));

      if (availableTesouros.length === 0) {
        availableTesouros = tesourosDados;
        seenTesouros = [];
      }
      
      if (availableSuspeitos.length === 0) {
        availableSuspeitos = suspeitosDados;
        seenSuspeitos = [];
      }

      const tesouroSorteado = availableTesouros[Math.floor(Math.random() * availableTesouros.length)] as Tesouro;
      const suspeitoSorteado = availableSuspeitos[Math.floor(Math.random() * availableSuspeitos.length)] as Suspeito;

      seenTesouros.push(tesouroSorteado.id);
      seenSuspeitos.push(suspeitoSorteado.id);
      
      try {
        localStorage.setItem(seenTesourosKey, JSON.stringify(seenTesouros));
        localStorage.setItem(seenSuspeitosKey, JSON.stringify(seenSuspeitos));
      } catch (e) {}

      // 3. Monta a rota de fuga (4 cidades aleatórias, sendo a primeira o local do roubo)
      const cidadesEmbaralhadas = [...cidadesDados].sort(() => 0.5 - Math.random());
      const rota = cidadesEmbaralhadas.slice(0, 4) as Cidade[];

      const cidadeInicial = rota[0];
      const proximaCorreta = rota[1];
      
      let destinos = [proximaCorreta];
      const cidadesDisponiveis = cidadesDados.filter(c => c.id !== cidadeInicial.id && c.id !== proximaCorreta.id);
      const randomCidades = [...cidadesDisponiveis].sort(() => 0.5 - Math.random());
      destinos = [...destinos, ...randomCidades.slice(0, 2)].sort(() => 0.5 - Math.random());

      // 4. Atualiza o estado global
      setGameState({
        dia: 0, // Segunda-feira
        hora: 9, // 09:00
        cidadeAtual: cidadeInicial, // Inicia na primeira cidade da rota
        pistasColetadas: [],
        mandadoEmitido: null,
        erroMandado: null,
        rotaDoBandido: rota,
        suspeitoAtual: suspeitoSorteado,
        tesouroAtual: tesouroSorteado,
        fimDeJogo: false,
        vitoria: false,
        todasCidades: cidadesDados,
        destinosAtuais: destinos
      });

    } catch (error) {
      console.error('Erro inesperado ao iniciar novo caso:', error);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        avancarTempo,
        viajarParaCidade,
        adicionarPista,
        emitirMandado,
        formatarDataHora,
        iniciarNovoCaso,
        investigarLocal
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame deve ser usado dentro de um GameProvider');
  }
  return context;
};
