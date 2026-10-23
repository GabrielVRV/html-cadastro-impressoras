import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { TotvsApiClient } from '../../core/api/totvs-api.client';
import { TipoImpressora } from '../../domain/models';
import { TipoImpressoraRepository } from '../../domain/repositories/tipo-impressora.repository';
import { ListarTiposResposta } from './dtos';
import { toTipoImpressora } from './mappers';

@Injectable()
export class TipoImpressoraHttpRepository extends TipoImpressoraRepository {
  private readonly api = inject(TotvsApiClient);

  listar(): Observable<TipoImpressora[]> {
    return this.api
      .post<ListarTiposResposta>('tipos/')
      .pipe(map((resposta) => (resposta.tt_tipo_impressora ?? []).map(toTipoImpressora)));
  }
}
