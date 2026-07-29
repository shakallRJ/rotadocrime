export interface Cidade {
  id: string;
  nome: string;
  pais: string;
  populacao: number;
  bandeira_cores: string;
  moeda: string;
  ponto_turistico: string;
}

export interface Suspeito {
  id: string;
  nome: string;
  sexo: string;
  cabelo: string;
  caracteristica: string;
  veiculo: string;
  hobby: string;
}

export interface Tesouro {
  id: string;
  nome: string;
  cidade_origem_id: string;
  dificuldade: string;
}

export interface Jogador {
  id: string;
  nome_detetive: string;
  rank: string;
  casos_resolvidos: number;
  pontuacao_total: number;
}
