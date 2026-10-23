import { Observable } from 'rxjs';

import { Impressora, ImpressoraEdicao } from '../models';

export abstract class ImpressoraRepository {
  /** Todas as impressoras, ativas e inativas; a tela filtra localmente. */
  abstract listar(): Observable<Impressora[]>;
  abstract salvar(impressora: ImpressoraEdicao): Observable<Impressora>;
  abstract alterarSituacao(id: string, ativa: boolean): Observable<Impressora>;
  abstract excluir(id: string): Observable<void>;
}
