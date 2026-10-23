export interface Impressora {
  /** ROWID da es-impressora (a tabela não tem código; a chave é nome + caminho). */
  id: string;
  nome: string;
  /** Destino para onde a impressão é enviada (ex.: \\servidor\fila). */
  caminho: string;
  /** Código da lista fixa de tipos (1 - Etiqueta, 2 - Papel, 3 - Cupom Fiscal). */
  tipo: number;
  descTipo: string;
  ativa: boolean;
}

/** O que a tela envia para gravar; id vazio = impressora nova. */
export type ImpressoraEdicao = Omit<Impressora, 'descTipo'>;

export type SituacaoFiltro = 'ativas' | 'inativas' | 'todas';

/** Tipo 0 = todos os tipos. */
export const TODOS_TIPOS = 0;

export interface FiltroImpressoras {
  texto: string;
  tipo: number;
  situacao: SituacaoFiltro;
}
