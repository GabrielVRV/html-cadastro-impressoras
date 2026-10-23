import { Injectable } from '@angular/core';
import { delay, defer, Observable, of, throwError } from 'rxjs';

import { ApiError } from '../../core/api/api-error';

/** Mesma lista de {&TIPOS-IMPRESSORA} em include/api_cadastro_impressora.i; o código é a posição. */
export const TIPOS_MOCK = ['Etiqueta', 'Papel', 'Cupom Fiscal'];

export interface ImpressoraMock {
  id: string;
  nome: string;
  caminho: string;
  tipo: number;
  ativa: boolean;
}

/**
 * "Banco" em memória para a tela funcionar de ponta a ponta sem servidor.
 * As validações imitam api_cadastro_impressoraRP.p.
 */
@Injectable({ providedIn: 'root' })
export class MockBanco {
  impressoras: ImpressoraMock[] = [
    {
      id: '0x0000000000000001',
      nome: 'Almoxarifado',
      caminho: '\\\\srv-print\\zebra-almox',
      tipo: 1,
      ativa: true,
    },
    {
      id: '0x0000000000000002',
      nome: 'Expedição',
      caminho: '\\\\srv-print\\zebra-exp',
      tipo: 1,
      ativa: true,
    },
    {
      id: '0x0000000000000003',
      nome: 'Montagem',
      caminho: '\\\\srv-print\\zebra-mont',
      tipo: 1,
      ativa: false,
    },
    {
      id: '0x0000000000000004',
      nome: 'Escritório - Laser',
      caminho: '\\\\srv-print\\laser-escr',
      tipo: 2,
      ativa: true,
    },
    {
      id: '0x0000000000000005',
      nome: 'Caixa da loja',
      caminho: '\\\\srv-print\\cupom-loja',
      tipo: 3,
      ativa: true,
    },
  ];

  private ultimoId = 5;

  /** Imita o formato de STRING(ROWID) do Progress. */
  proximoId(): string {
    return `0x${(++this.ultimoId).toString(16).padStart(16, '0')}`;
  }

  descricaoTipo(tipo: number): string {
    return TIPOS_MOCK[tipo - 1] ?? String(tipo);
  }

  /** Executa a operação com a latência de uma chamada real; erro vira ApiError. */
  responder<T>(operacao: () => T): Observable<T> {
    return defer(() => {
      try {
        return of(operacao());
      } catch (erro) {
        return throwError(() => erro);
      }
    }).pipe(delay(300));
  }

  falhar(mensagem: string): never {
    throw new ApiError(mensagem);
  }
}

export const mesmoTexto = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();
