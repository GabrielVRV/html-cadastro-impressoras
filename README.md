# Cadastro de Impressoras

Tela web (PO-UI + Angular) para cadastrar as impressoras usadas pelos outros programas,
substituindo o cadastro antigo de impressoras de etiqueta, que só tinha área + endereço.

Cada impressora tem **nome**, **caminho** (destino para onde a impressão é enviada),
**tipo** e **ativa**. Impressora inativa continua no cadastro, mas some das listas que os
outros programas recebem.

## Tipos de impressora

Lista fixa, sem tabela própria: o campo `es-impressora.tipo` guarda o código.

| Código | Tipo | Constante em `api_cadastro_impressora.i` |
|---|---|---|
| 1 | Etiqueta | `{&TIPO-IMPRESSORA-ETIQUETA}` |
| 2 | Papel | `{&TIPO-IMPRESSORA-PAPEL}` |
| 3 | Cupom Fiscal | `{&TIPO-IMPRESSORA-CUPOM-FISCAL}` |

Para criar um tipo novo: acrescentar **no fim** de `{&TIPOS-IMPRESSORA}` em `_Progress/api_cadastro_impressora.i`
(o código é a posição na lista), criar a constante, atualizar a `DESCRIPTION` do campo no `.df`
e recompilar. O front recebe a lista pela rota `tipos/`, então não precisa mudar.

## Estrutura

```
HTML/                      front Angular 21 + PO-UI 21
  src/app/
    core/                  infraestrutura: cliente da API ut-api, carregamento com signals
    domain/                modelos, contratos dos repositórios e regras puras (sem Angular/HTTP)
    data/
      http/                repositórios reais: DTOs (tt_*) e mappers
      mock/                "banco" em memória para rodar sem servidor
    features/
      impressoras/         lista + modal de inclusão/alteração
_Progress/
  DFs/es-impressora.df          tabela es-impressora
  api_cadastro_impressora.i     temp-tables e lista de tipos: contrato com o front e com os outros programas
  api_cadastro_impressora.p     rotas REST (ut-api)
  api_cadastro_impressoraRP.p   regras + procedures públicas de consulta
```

## Como os outros programas pegam as impressoras

### Programa Progress

```progress
{include/api_cadastro_impressora.i}

DEFINE VARIABLE hImpressoras AS HANDLE  NO-UNDO.
DEFINE VARIABLE lValida      AS LOGICAL NO-UNDO.

RUN cdp/api_cadastro_impressoraRP.p PERSISTENT SET hImpressoras.

/* Lista para montar o combo: só as ativas, por nome (0 = todos os tipos) */
RUN pi-listar-impressoras-ativas IN hImpressoras
    (INPUT {&TIPO-IMPRESSORA-ETIQUETA}, OUTPUT TABLE tt_impressora).

/* Antes de mandar para um caminho que veio de fora (ex.: payload da API) */
RUN pi-impressora-valida IN hImpressoras
    (INPUT cCaminho, INPUT {&TIPO-IMPRESSORA-ETIQUETA}, OUTPUT lValida).

DELETE PROCEDURE hImpressoras.
```

`tt_impressora`: `id`, `nome`, `caminho`, `tipo`, `desc_tipo`, `ativa`.
A `es-impressora` não tem código próprio (a chave é nome + caminho); `id` é o
`STRING(ROWID)` do registro, usado pela tela para alterar, inativar e excluir.
Para o combo, use `nome` como texto e `caminho` como valor.

> O `.i` também define `tt_retorno` e `tt_tipo_impressora`. Se o programa já tiver uma
> `tt_retorno` própria, em vez de incluir o `.i` defina uma temp-table
> com os mesmos campos de `tt_impressora`, na mesma ordem: `TABLE` em parâmetro casa pela
> estrutura, não pelo nome.

### Outra tela HTML

`POST /api/cdp/v1/api_cadastro_impressora/ativas/` com `{ "tipo": 1 }` → `tt_impressora`.

### Migrando um programa que lia o cadastro antigo

Basta trocar as leituras diretas da tabela antiga (a lista do combo e a validação antes de
imprimir) pelas chamadas acima, mapeando `nome → area` e `caminho → endereco` se o programa
ainda usar os nomes antigos.

## Rotas da API

Base: `/api/cdp/v1/api_cadastro_impressora/`. Todas `POST`, erros de negócio em `tt_retorno`.

| Rota | Payload | Retorno |
|---|---|---|
| `impressoras/` | `tipo`? (0 = todos), `situacao`? (`ativas`/`inativas`/`todas`, padrão `todas`) | `tt_impressora` |
| `ativas/` | `tipo`? (0 = todos) | `tt_impressora` (só ativas) |
| `salvar-impressora/` | `id` (vazio = nova), `nome`, `caminho`, `tipo`, `ativa` | `tt_impressora` gravada |
| `situacao-impressora/` | `id`, `ativa` | `tt_impressora` gravada |
| `excluir-impressora/` | `id` | — |
| `tipos/` | — | `tt_tipo_impressora` (`tipo`, `descricao`): a lista fixa |

Regras (no RP e repetidas no front): nome obrigatório (até 60), caminho obrigatório (até 200),
nome + caminho não pode repetir (mesma regra do índice `unico`) e o tipo precisa ser um
código da lista (o campo nasce com 0).

## Desenvolvimento

```bash
cd HTML
npm install        # se o npm 10 falhar com 'edgesOut', use: npx npm@11 install
npm start          # http://localhost:4200 com dados mock
npm test           # testes unitários (Vitest)
npm run build      # build de produção em HTML/dist/cadastro-impressoras
```

**Bloqueio fora do Datasul:** o build publicado só abre dentro do iframe do menu do Datasul
(`window.self !== window.top`, em `src/app/app.ts`, mesmo padrão das outras telas HTML
do Datasul). Aberta direto pelo link, mostra "Acesso restrito" e nem monta as telas, então nada
chama a API. Em `npm start` o bloqueio fica desligado (`bloquearForaDoDatasul` no
`environment.development.ts`). É só de interface: quem barra de verdade é o Datasul, que não
responde a API sem sessão; se a sessão cair com a tela aberta, ela avisa para abrir pelo menu.

## Implantação

1. Carregar `_Progress/DFs/es-impressora.df` no banco das tabelas específicas (Data Administration → Load Data Definitions).
2. Compilar `api_cadastro_impressora.p` e `api_cadastro_impressoraRP.p`
   (os `.i` vão em `include/`; os `.p` em `cdp/`).
3. Publicar a API no módulo `cdp`.
4. `npm run build` e copiar o conteúdo de `HTML/dist/cadastro-impressoras/` para a pasta HTML publicada no Datasul.

## Roteiro de testes no servidor

1. **.df** carrega sem erro.
2. **Compilação** dos `.p`.
3. **Rotas com hífen** (`salvar-impressora/` etc.) são encontradas pelo `ut-api-action.i`.
4. **Incluir / alterar / inativar / excluir** pela tela e conferir no banco. Imprimir um teste
   em cada caminho cadastrado.
5. **Nome + caminho repetido** (inclusive com maiúsculas diferentes) é recusado; mesmo nome com
   outro caminho é aceito.
6. **Tipo inválido** (0 ou maior que 3 no payload de `salvar-impressora/`) é recusado pelo RP.
7. **Lock**: alterar a mesma impressora em duas sessões → a segunda recebe "sendo alterada por outro usuario".
8. **id inválido** ou de impressora já excluída → "Impressora nao encontrada".
9. **`ativas/`** não traz impressora inativa; `pi-impressora-valida` recusa caminho de impressora inativa.
10. **Acesso direto** pela URL da tela mostra "Acesso restrito"; pelo menu do Datasul abre normal.
