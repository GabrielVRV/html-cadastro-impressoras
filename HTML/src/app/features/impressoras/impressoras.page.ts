import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  PoDialogService,
  PoFieldModule,
  PoNotificationService,
  PoPageAction,
  PoPageFilter,
  PoPageModule,
  PoRadioGroupOption,
  PoSelectOption,
  PoTableAction,
  PoTableColumn,
  PoTableModule,
  PoTagType,
} from '@po-ui/ng-components';
import { finalize } from 'rxjs';

import { telaPequena } from '../../core/layout/tela-pequena';
import { carregar } from '../../core/state/carregar-ao-mudar';
import { Impressora, SituacaoFiltro, TODOS_TIPOS } from '../../domain/models';
import { ImpressoraRepository } from '../../domain/repositories/impressora.repository';
import { TipoImpressoraRepository } from '../../domain/repositories/tipo-impressora.repository';
import { filtrarImpressoras } from '../../domain/rules/impressora.rules';
import { ImpressoraFormModalComponent } from './impressora-form-modal.component';

type LinhaImpressora = Impressora & { situacao: 'ativa' | 'inativa' };

@Component({
  selector: 'app-impressoras-page',
  imports: [
    ReactiveFormsModule,
    PoPageModule,
    PoTableModule,
    PoFieldModule,
    ImpressoraFormModalComponent,
  ],
  templateUrl: './impressoras.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpressorasPage {
  private readonly repository = inject(ImpressoraRepository);
  private readonly tipoRepository = inject(TipoImpressoraRepository);
  private readonly notification = inject(PoNotificationService);
  private readonly dialog = inject(PoDialogService);
  private readonly pequena = telaPequena();
  private readonly formulario = viewChild.required(ImpressoraFormModalComponent);

  private readonly carregamento = carregar(() => this.repository.listar());
  private readonly carregamentoTipos = carregar(() => this.tipoRepository.listar());
  private readonly alterando = signal(false);
  protected readonly carregando = computed(
    () => this.carregamento.carregando() || this.alterando(),
  );
  protected readonly tipos = computed(() => this.carregamentoTipos.dados() ?? []);

  private readonly busca = signal('');
  protected readonly filtroTipo = new FormControl(TODOS_TIPOS, { nonNullable: true });
  protected readonly filtroSituacao = new FormControl<SituacaoFiltro>('todas', {
    nonNullable: true,
  });
  private readonly tipoSelecionado = toSignal(this.filtroTipo.valueChanges, {
    initialValue: this.filtroTipo.value,
  });
  private readonly situacaoSelecionada = toSignal(this.filtroSituacao.valueChanges, {
    initialValue: this.filtroSituacao.value,
  });

  protected readonly impressoras = computed<LinhaImpressora[]>(() =>
    filtrarImpressoras(this.carregamento.dados() ?? [], {
      texto: this.busca(),
      tipo: Number(this.tipoSelecionado()),
      situacao: this.situacaoSelecionada(),
    }).map((impressora) => ({ ...impressora, situacao: impressora.ativa ? 'ativa' : 'inativa' })),
  );

  protected readonly opcoesTipo = computed<PoSelectOption[]>(() => [
    { label: 'Todos os tipos', value: TODOS_TIPOS },
    ...this.tipos().map((tipo) => ({ label: tipo.descricao, value: tipo.codigo })),
  ]);

  protected readonly opcoesSituacao: PoRadioGroupOption[] = [
    { label: 'Todas', value: 'todas' },
    { label: 'Ativas', value: 'ativas' },
    { label: 'Inativas', value: 'inativas' },
  ];

  protected readonly pesquisa: PoPageFilter = {
    placeholder: 'Nome, caminho ou tipo',
    action: (texto: string) => this.busca.set(texto ?? ''),
  };

  protected readonly acoesPagina: PoPageAction[] = [
    { label: 'Nova impressora', icon: 'an an-plus', action: () => this.formulario().abrir() },
    { label: 'Atualizar', action: () => this.recarregar() },
  ];

  protected readonly acoesLinha: PoTableAction[] = [
    {
      label: 'Alterar',
      icon: 'an an-pencil-simple',
      action: (i: Impressora) => this.formulario().abrir(i),
    },
    {
      label: 'Inativar',
      icon: 'an an-prohibit',
      visible: (i: Impressora) => i.ativa,
      action: (i: Impressora) => this.alterarSituacao(i, false),
    },
    {
      label: 'Ativar',
      icon: 'an an-check-circle',
      visible: (i: Impressora) => !i.ativa,
      action: (i: Impressora) => this.alterarSituacao(i, true),
    },
    {
      label: 'Excluir',
      icon: 'an an-trash',
      type: 'danger',
      action: (i: Impressora) => this.confirmarExclusao(i),
    },
  ];

  protected readonly colunas = computed<PoTableColumn[]>(() => [
    { property: 'nome', label: 'Nome' },
    { property: 'caminho', label: 'Caminho', visible: !this.pequena() },
    { property: 'descTipo', label: 'Tipo', visible: !this.pequena() },
    {
      property: 'situacao',
      label: 'Situação',
      type: 'label',
      width: '110px',
      labels: [
        { value: 'ativa', label: 'Ativa', type: PoTagType.Success },
        { value: 'inativa', label: 'Inativa', type: PoTagType.Neutral },
      ],
    },
  ]);

  protected recarregar(): void {
    this.carregamento.recarregar();
  }

  private alterarSituacao(impressora: Impressora, ativa: boolean): void {
    this.alterando.set(true);
    this.repository
      .alterarSituacao(impressora.id, ativa)
      .pipe(finalize(() => this.alterando.set(false)))
      .subscribe({
        next: () => {
          this.notification.success(
            `Impressora "${impressora.nome}" ${ativa ? 'ativada' : 'inativada'}.`,
          );
          this.carregamento.recarregar();
        },
        error: (erro: Error) => this.notification.error(erro.message),
      });
  }

  private confirmarExclusao(impressora: Impressora): void {
    this.dialog.confirm({
      title: 'Excluir impressora',
      message:
        `Excluir a impressora "${impressora.nome}"? Os programas que usam este caminho ` +
        'deixam de encontrá-la. Se for só por um tempo, prefira inativar.',
      literals: { confirm: 'Excluir', cancel: 'Cancelar' },
      confirm: () => this.excluir(impressora),
    });
  }

  private excluir(impressora: Impressora): void {
    this.alterando.set(true);
    this.repository
      .excluir(impressora.id)
      .pipe(finalize(() => this.alterando.set(false)))
      .subscribe({
        next: () => {
          this.notification.success(`Impressora "${impressora.nome}" excluída.`);
          this.carregamento.recarregar();
        },
        error: (erro: Error) => this.notification.error(erro.message),
      });
  }
}
