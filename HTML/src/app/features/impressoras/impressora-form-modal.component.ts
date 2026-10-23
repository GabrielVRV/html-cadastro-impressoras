import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  PoFieldModule,
  PoModalAction,
  PoModalComponent,
  PoModalModule,
  PoNotificationService,
  PoSelectOption,
} from '@po-ui/ng-components';
import { finalize, map } from 'rxjs';

import { Impressora, TipoImpressora } from '../../domain/models';
import { ImpressoraRepository } from '../../domain/repositories/impressora.repository';
import { TAMANHO_CAMINHO, TAMANHO_NOME } from '../../domain/rules/impressora.rules';

/** Rejeita texto só com espaços, que o required deixaria passar. */
const NAO_EM_BRANCO = Validators.pattern(/\S/);

@Component({
  selector: 'app-impressora-form-modal',
  imports: [ReactiveFormsModule, PoModalModule, PoFieldModule],
  templateUrl: './impressora-form-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImpressoraFormModalComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly repository = inject(ImpressoraRepository);
  private readonly notification = inject(PoNotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modal = viewChild.required(PoModalComponent);

  readonly tipos = input.required<TipoImpressora[]>();
  readonly salvo = output<Impressora>();

  /** Vazio = inclusão. */
  private readonly idEmEdicao = signal('');
  private readonly enviando = signal(false);

  protected readonly titulo = computed(() =>
    this.idEmEdicao() ? 'Alterar impressora' : 'Nova impressora',
  );
  protected readonly opcoesTipo = computed<PoSelectOption[]>(() =>
    this.tipos().map((tipo) => ({ label: tipo.descricao, value: tipo.codigo })),
  );

  protected readonly tamanhoNome = TAMANHO_NOME;
  protected readonly tamanhoCaminho = TAMANHO_CAMINHO;

  protected readonly form = this.fb.group({
    nome: ['', [Validators.required, NAO_EM_BRANCO, Validators.maxLength(TAMANHO_NOME)]],
    caminho: ['', [Validators.required, NAO_EM_BRANCO, Validators.maxLength(TAMANHO_CAMINHO)]],
    /** 0 = nenhum tipo escolhido: obriga a escolher na inclusão. */
    tipo: [0, Validators.min(1)],
    ativa: [true],
  });

  private readonly formValido = toSignal(
    this.form.statusChanges.pipe(map((status) => status === 'VALID')),
    { initialValue: false },
  );

  protected readonly acaoSalvar = computed<PoModalAction>(() => ({
    label: 'Salvar',
    action: () => this.salvar(),
    disabled: !this.formValido() || this.enviando(),
    loading: this.enviando(),
  }));

  protected readonly acaoCancelar: PoModalAction = {
    label: 'Cancelar',
    action: () => this.modal().close(),
  };

  /** Sem impressora abre em branco para incluir. */
  abrir(impressora?: Impressora): void {
    this.idEmEdicao.set(impressora?.id ?? '');
    this.form.reset(
      impressora
        ? {
            nome: impressora.nome,
            caminho: impressora.caminho,
            tipo: impressora.tipo,
            ativa: impressora.ativa,
          }
        : { nome: '', caminho: '', tipo: 0, ativa: true },
    );
    this.modal().open();
  }

  private salvar(): void {
    if (this.form.invalid) return;

    const { nome, caminho, tipo, ativa } = this.form.getRawValue();
    this.enviando.set(true);
    this.repository
      .salvar({
        id: this.idEmEdicao(),
        nome: nome.trim(),
        caminho: caminho.trim(),
        tipo,
        ativa,
      })
      .pipe(
        finalize(() => this.enviando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (impressora) => {
          this.notification.success(`Impressora "${impressora.nome}" salva.`);
          this.modal().close();
          this.salvo.emit(impressora);
        },
        error: (erro: Error) => this.notification.error(erro.message),
      });
  }
}
