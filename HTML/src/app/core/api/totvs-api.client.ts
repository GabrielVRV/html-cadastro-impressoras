import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';

import { API_BASE_URL } from './api-base-url.token';
import { ApiError } from './api-error';

export interface RetornoTotvs {
  cod_erro: number;
  desc_erro: string;
}

export interface RespostaTotvs {
  tt_retorno?: RetornoTotvs[];
}

/**
 * A tela não manda token: a API autentica pelo cookie de sessão do Datasul, então só
 * funciona aberta pelo menu do TOTVS. Sem sessão o servidor responde 401/403 ou devolve
 * a página de login (HTML com status 200), que o HttpClient não consegue ler como JSON.
 */
export const MENSAGEM_SEM_SESSAO =
  'Sessão do TOTVS não encontrada ou expirada. Abra a tela pelo menu do Datasul.';

/**
 * Cliente das APIs ut-api do Datasul. Erros de negócio chegam com HTTP 200 e
 * cod_erro <> 0 em tt_retorno; aqui eles viram ApiError, igual aos erros HTTP.
 */
@Injectable({ providedIn: 'root' })
export class TotvsApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  post<T extends RespostaTotvs>(endpoint: string, payload: object = {}): Observable<T> {
    return this.http.post<T>(this.baseUrl + endpoint, payload).pipe(
      map((resposta) => this.validarRetorno(resposta)),
      catchError((erro: unknown) => throwError(() => this.normalizarErro(erro))),
    );
  }

  private validarRetorno<T extends RespostaTotvs>(resposta: T): T {
    // Texto no lugar do objeto JSON: é a página de login, não a API.
    if (typeof resposta !== 'object' || resposta === null) throw new ApiError(MENSAGEM_SEM_SESSAO);

    const erro = resposta.tt_retorno?.find((retorno) => retorno.cod_erro !== 0);
    if (erro) throw new ApiError(erro.desc_erro);
    return resposta;
  }

  private normalizarErro(erro: unknown): ApiError {
    if (erro instanceof ApiError) return erro;
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) return new ApiError('Não foi possível conectar ao servidor.');
      if (this.semSessao(erro)) return new ApiError(MENSAGEM_SEM_SESSAO);
      return new ApiError(`Erro ${erro.status} ao chamar o servidor: ${erro.statusText}`);
    }
    return new ApiError('Erro inesperado ao chamar o servidor.');
  }

  /** 401/403, ou resposta 2xx que não é JSON (a página de login no lugar da API). */
  private semSessao(erro: HttpErrorResponse): boolean {
    return erro.status === 401 || erro.status === 403 || (erro.status >= 200 && erro.status < 300);
  }
}
