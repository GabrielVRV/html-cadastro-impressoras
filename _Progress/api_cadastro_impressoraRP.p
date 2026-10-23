/* =========================================================
   api_cadastro_impressoraRP.p
   Regras do cadastro de impressoras (es-impressora)
   Projeto: Cadastro de Impressoras | OpenEdge 12.8

   Alem das rotas da tela, e' daqui que os outros programas tiram
   a lista de impressoras. Uso (com {include/api_cadastro_impressora.i}):

     DEFINE VARIABLE hImpressoras AS HANDLE NO-UNDO.

     RUN cdp/api_cadastro_impressoraRP.p PERSISTENT SET hImpressoras.
     RUN pi-listar-impressoras-ativas IN hImpressoras
         (INPUT {&TIPO-IMPRESSORA-ETIQUETA}, OUTPUT TABLE tt_impressora).
     DELETE PROCEDURE hImpressoras.

   Erros de negocio sobem como Progress.Lang.AppError.
   ========================================================= */

BLOCK-LEVEL ON ERROR UNDO, THROW.

{include/api_cadastro_impressora.i}

&GLOBAL-DEFINE SITUACOES "ativas,inativas,todas"
&GLOBAL-DEFINE TAMANHO-NOME 60
&GLOBAL-DEFINE TAMANHO-CAMINHO 200


/* Converte o id recebido (STRING(ROWID)); id invalido vira ? e cai
   no "nao encontrada" de pi-bloqueia-impressora. Fica no topo porque
   funcao precisa estar definida antes do primeiro uso. */
FUNCTION fn-rowid RETURNS ROWID PRIVATE (INPUT pId AS CHARACTER):
    DEFINE VARIABLE rId AS ROWID NO-UNDO.

    IF pId = "" OR pId = ? THEN
        RETURN ?.
    ASSIGN rId = TO-ROWID(pId) NO-ERROR.
    RETURN rId.
END FUNCTION.


/* ---------------------------------------------------------
   Consulta para outros programas
   --------------------------------------------------------- */

/* Impressoras ativas de um tipo (0 = todos os tipos), por nome.
   E' a chamada para montar combos de impressora em outros programas. */
PROCEDURE pi-listar-impressoras-ativas:
    DEFINE INPUT  PARAMETER pTipo AS INTEGER NO-UNDO.
    DEFINE OUTPUT PARAMETER TABLE FOR tt_impressora.

    RUN pi-listar-impressoras (INPUT pTipo, INPUT "ativas", OUTPUT TABLE tt_impressora).
END PROCEDURE.


/* Para quem recebe o caminho de fora (ex.: payload de uma API): o
   destino vira um caminho de arquivo no servidor, entao so' aceita
   impressora cadastrada e ativa, nunca um caminho livre. */
PROCEDURE pi-impressora-valida:
    DEFINE INPUT  PARAMETER pCaminho AS CHARACTER NO-UNDO.
    DEFINE INPUT  PARAMETER pTipo    AS INTEGER   NO-UNDO.
    DEFINE OUTPUT PARAMETER pValida  AS LOGICAL   NO-UNDO.

    pValida = CAN-FIND(FIRST es-impressora
                       WHERE es-impressora.caminho = pCaminho
                         AND es-impressora.ativa   = YES
                         AND (pTipo = 0 OR es-impressora.tipo = pTipo)).
END PROCEDURE.


/* ---------------------------------------------------------
   Impressoras
   --------------------------------------------------------- */

PROCEDURE pi-listar-impressoras:
    DEFINE INPUT  PARAMETER pTipo     AS INTEGER   NO-UNDO.
    DEFINE INPUT  PARAMETER pSituacao AS CHARACTER NO-UNDO.
    DEFINE OUTPUT PARAMETER TABLE FOR tt_impressora.

    DEFINE BUFFER bImpressora FOR es-impressora.

    IF pSituacao = "" THEN
        pSituacao = "todas".
    IF LOOKUP(pSituacao, {&SITUACOES}) = 0 THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            SUBSTITUTE("Situacao &1 invalida. Use &2.", pSituacao, {&SITUACOES}), 1).

    EMPTY TEMP-TABLE tt_impressora.

    FOR EACH bImpressora NO-LOCK
       WHERE (pTipo = 0 OR bImpressora.tipo = pTipo)
         AND (pSituacao = "todas" OR bImpressora.ativa = (pSituacao = "ativas")):
        RUN pi-cria-tt-impressora (BUFFER bImpressora).
    END.
END PROCEDURE.


/* Inclui (id vazio) ou altera a impressora do unico registro de
   tt_impressora e devolve ela como ficou gravada. */
PROCEDURE pi-salvar-impressora:
    DEFINE INPUT-OUTPUT PARAMETER TABLE FOR tt_impressora.

    DEFINE BUFFER bImpressora FOR es-impressora.

    DEFINE VARIABLE rImpressora AS ROWID NO-UNDO.

    FIND FIRST tt_impressora NO-ERROR.
    IF NOT AVAILABLE tt_impressora THEN
        UNDO, THROW NEW Progress.Lang.AppError("Nenhuma impressora informada.", 1).

    ASSIGN tt_impressora.nome    = TRIM(tt_impressora.nome)
           tt_impressora.caminho = TRIM(tt_impressora.caminho)
           tt_impressora.ativa   = (tt_impressora.ativa = YES). /* ? vira NO */

    IF tt_impressora.id <> "" THEN DO:
        rImpressora = fn-rowid(tt_impressora.id).
        IF NOT CAN-FIND(bImpressora WHERE ROWID(bImpressora) = rImpressora) THEN
            UNDO, THROW NEW Progress.Lang.AppError(
                "Impressora nao encontrada. Atualize a lista e tente de novo.", 1).
    END.

    RUN pi-valida-impressora (BUFFER tt_impressora, INPUT rImpressora).

    DO TRANSACTION:
        IF rImpressora = ? THEN
            CREATE bImpressora.
        ELSE
            RUN pi-bloqueia-impressora (INPUT rImpressora, BUFFER bImpressora).

        ASSIGN bImpressora.nome    = tt_impressora.nome
               bImpressora.caminho = tt_impressora.caminho
               bImpressora.tipo    = tt_impressora.tipo
               bImpressora.ativa   = tt_impressora.ativa
               rImpressora         = ROWID(bImpressora).
    END.

    RUN pi-devolve-impressora (INPUT rImpressora).
END PROCEDURE.


/* Ativar/inativar sem passar pelo formulario: inativa some das
   listas dos outros programas, mas continua no cadastro. */
PROCEDURE pi-alterar-situacao:
    DEFINE INPUT  PARAMETER pId    AS CHARACTER NO-UNDO.
    DEFINE INPUT  PARAMETER pAtiva AS LOGICAL   NO-UNDO.
    DEFINE OUTPUT PARAMETER TABLE FOR tt_impressora.

    DEFINE BUFFER bImpressora FOR es-impressora.

    DEFINE VARIABLE rImpressora AS ROWID NO-UNDO.

    rImpressora = fn-rowid(pId).

    DO TRANSACTION:
        RUN pi-bloqueia-impressora (INPUT rImpressora, BUFFER bImpressora).
        bImpressora.ativa = (pAtiva = YES).
    END.

    RUN pi-devolve-impressora (INPUT rImpressora).
END PROCEDURE.


PROCEDURE pi-excluir-impressora:
    DEFINE INPUT PARAMETER pId AS CHARACTER NO-UNDO.

    DEFINE BUFFER bImpressora FOR es-impressora.

    DO TRANSACTION:
        RUN pi-bloqueia-impressora (INPUT fn-rowid(pId), BUFFER bImpressora).
        DELETE bImpressora.
    END.
END PROCEDURE.


/* ---------------------------------------------------------
   Tipos de impressora (lista fixa de include/api_cadastro_impressora.i)
   --------------------------------------------------------- */

PROCEDURE pi-listar-tipos:
    DEFINE OUTPUT PARAMETER TABLE FOR tt_tipo_impressora.

    DEFINE VARIABLE iTipo AS INTEGER NO-UNDO.

    EMPTY TEMP-TABLE tt_tipo_impressora.

    DO iTipo = 1 TO NUM-ENTRIES({&TIPOS-IMPRESSORA}):
        CREATE tt_tipo_impressora.
        ASSIGN tt_tipo_impressora.tipo      = iTipo
               tt_tipo_impressora.descricao = ENTRY(iTipo, {&TIPOS-IMPRESSORA}).
    END.
END PROCEDURE.


/* ---------------------------------------------------------
   Apoio
   --------------------------------------------------------- */

/* rAtual = ? na inclusao; na alteracao, a propria impressora fica
   fora da checagem de duplicidade. */
PROCEDURE pi-valida-impressora PRIVATE:
    DEFINE PARAMETER BUFFER bDados FOR tt_impressora.
    DEFINE INPUT PARAMETER rAtual AS ROWID NO-UNDO.

    DEFINE BUFFER bImpressora FOR es-impressora.

    IF bDados.nome = "" THEN
        UNDO, THROW NEW Progress.Lang.AppError("Informe o nome da impressora.", 1).
    IF LENGTH(bDados.nome) > {&TAMANHO-NOME} THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            SUBSTITUTE("O nome pode ter no maximo &1 caracteres.", {&TAMANHO-NOME}), 1).
    IF bDados.caminho = "" THEN
        UNDO, THROW NEW Progress.Lang.AppError("Informe o caminho da impressora.", 1).
    IF LENGTH(bDados.caminho) > {&TAMANHO-CAMINHO} THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            SUBSTITUTE("O caminho pode ter no maximo &1 caracteres.", {&TAMANHO-CAMINHO}), 1).

    IF bDados.tipo = ? OR bDados.tipo < 1 OR bDados.tipo > NUM-ENTRIES({&TIPOS-IMPRESSORA}) THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            SUBSTITUTE("Tipo de impressora &1 invalido.", bDados.tipo), 1).

    /* Mesma regra do indice unico (nome + caminho), com mensagem clara. */
    IF CAN-FIND(FIRST bImpressora
                WHERE bImpressora.nome    = bDados.nome
                  AND bImpressora.caminho = bDados.caminho
                  AND ROWID(bImpressora) <> rAtual) THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            SUBSTITUTE("Ja existe a impressora '&1' com o caminho &2.", bDados.nome, bDados.caminho), 1).
END PROCEDURE.


/* Busca para alterar sem esperar: se outro usuario estiver com o
   registro, avisa em vez de travar a requisicao. */
PROCEDURE pi-bloqueia-impressora PRIVATE:
    DEFINE INPUT PARAMETER rImpressora AS ROWID NO-UNDO.
    DEFINE PARAMETER BUFFER bImpressora FOR es-impressora.

    IF rImpressora <> ? THEN
        FIND bImpressora EXCLUSIVE-LOCK
            WHERE ROWID(bImpressora) = rImpressora NO-WAIT NO-ERROR.
    IF LOCKED bImpressora THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            "Impressora esta sendo alterada por outro usuario. Tente de novo.", 1).
    IF NOT AVAILABLE bImpressora THEN
        UNDO, THROW NEW Progress.Lang.AppError(
            "Impressora nao encontrada. Atualize a lista e tente de novo.", 1).
END PROCEDURE.


/* Deixa em tt_impressora so' a impressora como esta gravada. */
PROCEDURE pi-devolve-impressora PRIVATE:
    DEFINE INPUT PARAMETER rImpressora AS ROWID NO-UNDO.

    DEFINE BUFFER bImpressora FOR es-impressora.

    EMPTY TEMP-TABLE tt_impressora.

    FIND bImpressora NO-LOCK WHERE ROWID(bImpressora) = rImpressora.
    RUN pi-cria-tt-impressora (BUFFER bImpressora).
END PROCEDURE.


PROCEDURE pi-cria-tt-impressora PRIVATE:
    DEFINE PARAMETER BUFFER bImpressora FOR es-impressora.

    CREATE tt_impressora.
    ASSIGN tt_impressora.id        = STRING(ROWID(bImpressora))
           tt_impressora.nome      = bImpressora.nome
           tt_impressora.caminho   = bImpressora.caminho
           tt_impressora.tipo      = bImpressora.tipo
           tt_impressora.desc_tipo = IF bImpressora.tipo >= 1
                                        AND bImpressora.tipo <= NUM-ENTRIES({&TIPOS-IMPRESSORA})
                                     THEN ENTRY(bImpressora.tipo, {&TIPOS-IMPRESSORA})
                                     ELSE STRING(bImpressora.tipo)
           tt_impressora.ativa     = bImpressora.ativa.
END PROCEDURE.
