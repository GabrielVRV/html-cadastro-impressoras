import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiError } from '../../core/api/api-error';
import { TotvsApiClient } from '../../core/api/totvs-api.client';
import { Impressora, ImpressoraEdicao } from '../../domain/models';
import { ImpressoraRepository } from '../../domain/repositories/impressora.repository';
import { ListarImpressorasResposta } from './dtos';
import { toImpressora, toSalvarImpressoraPayload } from './mappers';

/** As rotas de gravação devolvem a impressora como ficou no banco. */
const impressoraGravada = (resposta: ListarImpressorasResposta): Impressora => {
  const dto = resposta.tt_impressora?.[0];
  if (!dto) throw new ApiError('O servidor não devolveu a impressora gravada.');
  return toImpressora(dto);
};

@Injectable()
export class ImpressoraHttpRepository extends ImpressoraRepository {
  private readonly api = inject(TotvsApiClient);

  listar(): Observable<Impressora[]> {
    return this.api
      .post<ListarImpressorasResposta>('impressoras/', { situacao: 'todas' })
      .pipe(map((resposta) => (resposta.tt_impressora ?? []).map(toImpressora)));
  }

  salvar(impressora: ImpressoraEdicao): Observable<Impressora> {
    return this.api
      .post<ListarImpressorasResposta>('salvar-impressora/', toSalvarImpressoraPayload(impressora))
      .pipe(map(impressoraGravada));
  }

  alterarSituacao(id: string, ativa: boolean): Observable<Impressora> {
    return this.api
      .post<ListarImpressorasResposta>('situacao-impressora/', { id, ativa })
      .pipe(map(impressoraGravada));
  }

  excluir(id: string): Observable<void> {
    return this.api.post('excluir-impressora/', { id }).pipe(map(() => undefined));
  }
}
