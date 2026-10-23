import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

import { ImpressoraRepository } from '../domain/repositories/impressora.repository';
import { TipoImpressoraRepository } from '../domain/repositories/tipo-impressora.repository';
import { ImpressoraHttpRepository } from './http/impressora-http.repository';
import { TipoImpressoraHttpRepository } from './http/tipo-impressora-http.repository';
import { ImpressoraMockRepository } from './mock/impressora-mock.repository';
import { TipoImpressoraMockRepository } from './mock/tipo-impressora-mock.repository';

export function provideRepositories({ useMock }: { useMock: boolean }): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: ImpressoraRepository,
      useClass: useMock ? ImpressoraMockRepository : ImpressoraHttpRepository,
    },
    {
      provide: TipoImpressoraRepository,
      useClass: useMock ? TipoImpressoraMockRepository : TipoImpressoraHttpRepository,
    },
  ]);
}
