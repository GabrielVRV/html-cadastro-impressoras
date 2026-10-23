import { RespostaTotvs } from '../../core/api/totvs-api.client';

/** Espelho das temp-tables de include/api_cadastro_impressora.i */
export interface ImpressoraDto {
  id: string;
  nome: string;
  caminho: string;
  tipo: number;
  desc_tipo: string;
  ativa: boolean;
}

export interface TipoImpressoraDto {
  tipo: number;
  descricao: string;
}

export type SalvarImpressoraPayload = Omit<ImpressoraDto, 'desc_tipo'>;

export interface ListarImpressorasResposta extends RespostaTotvs {
  tt_impressora?: ImpressoraDto[];
}

export interface ListarTiposResposta extends RespostaTotvs {
  tt_tipo_impressora?: TipoImpressoraDto[];
}
