import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Impressora, ImpressoraEdicao } from '../../domain/models';
import { ImpressoraRepository } from '../../domain/repositories/impressora.repository';
import { ImpressoraMock, MockBanco, mesmoTexto, TIPOS_MOCK } from './mock-banco';

@Injectable()
export class ImpressoraMockRepository extends ImpressoraRepository {
  private readonly banco = inject(MockBanco);

  listar(): Observable<Impressora[]> {
    return this.banco.responder(() =>
      [...this.banco.impressoras]
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((impressora) => this.paraModelo(impressora)),
    );
  }

  salvar(edicao: ImpressoraEdicao): Observable<Impressora> {
    return this.banco.responder(() => {
      const dados = { ...edicao, nome: edicao.nome.trim(), caminho: edicao.caminho.trim() };
      if (!TIPOS_MOCK[dados.tipo - 1]) {
        this.banco.falhar(`Tipo de impressora ${dados.tipo} invalido.`);
      }
      if (
        this.banco.impressoras.some(
          (i) =>
            mesmoTexto(i.nome, dados.nome) &&
            mesmoTexto(i.caminho, dados.caminho) &&
            i.id !== dados.id,
        )
      ) {
        this.banco.falhar(`Ja existe a impressora '${dados.nome}' com o caminho ${dados.caminho}.`);
      }

      if (!dados.id) {
        const nova = { ...dados, id: this.banco.proximoId() };
        this.banco.impressoras.push(nova);
        return this.paraModelo(nova);
      }
      const existente = this.buscar(dados.id);
      Object.assign(existente, dados);
      return this.paraModelo(existente);
    });
  }

  alterarSituacao(id: string, ativa: boolean): Observable<Impressora> {
    return this.banco.responder(() => {
      const impressora = this.buscar(id);
      impressora.ativa = ativa;
      return this.paraModelo(impressora);
    });
  }

  excluir(id: string): Observable<void> {
    return this.banco.responder(() => {
      this.buscar(id);
      this.banco.impressoras = this.banco.impressoras.filter((i) => i.id !== id);
    });
  }

  private buscar(id: string): ImpressoraMock {
    return (
      this.banco.impressoras.find((i) => i.id === id) ??
      this.banco.falhar('Impressora nao encontrada. Atualize a lista e tente de novo.')
    );
  }

  private paraModelo(impressora: ImpressoraMock): Impressora {
    return { ...impressora, descTipo: this.banco.descricaoTipo(impressora.tipo) };
  }
}
