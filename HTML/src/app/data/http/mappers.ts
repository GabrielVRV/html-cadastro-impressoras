import { Impressora, ImpressoraEdicao, TipoImpressora } from '../../domain/models';
import { ImpressoraDto, SalvarImpressoraPayload, TipoImpressoraDto } from './dtos';

export const toImpressora = (dto: ImpressoraDto): Impressora => ({
  id: dto.id,
  nome: dto.nome,
  caminho: dto.caminho,
  tipo: dto.tipo,
  descTipo: dto.desc_tipo,
  ativa: dto.ativa,
});

export const toSalvarImpressoraPayload = (
  impressora: ImpressoraEdicao,
): SalvarImpressoraPayload => ({
  id: impressora.id,
  nome: impressora.nome,
  caminho: impressora.caminho,
  tipo: impressora.tipo,
  ativa: impressora.ativa,
});

export const toTipoImpressora = (dto: TipoImpressoraDto): TipoImpressora => ({
  codigo: dto.tipo,
  descricao: dto.descricao,
});
