import { Observable } from 'rxjs';

import { TipoImpressora } from '../models';

/** Os tipos vêm do backend para a tela não repetir a lista do Progress. */
export abstract class TipoImpressoraRepository {
  abstract listar(): Observable<TipoImpressora[]>;
}
