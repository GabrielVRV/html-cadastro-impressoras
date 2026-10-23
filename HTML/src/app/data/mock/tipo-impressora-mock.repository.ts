import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { TipoImpressora } from '../../domain/models';
import { TipoImpressoraRepository } from '../../domain/repositories/tipo-impressora.repository';
import { MockBanco, TIPOS_MOCK } from './mock-banco';

@Injectable()
export class TipoImpressoraMockRepository extends TipoImpressoraRepository {
  private readonly banco = inject(MockBanco);

  listar(): Observable<TipoImpressora[]> {
    return this.banco.responder(() =>
      TIPOS_MOCK.map((descricao, indice) => ({ codigo: indice + 1, descricao })),
    );
  }
}
