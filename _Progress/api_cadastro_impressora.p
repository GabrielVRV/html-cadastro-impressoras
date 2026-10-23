/* =========================================================
   api_cadastro_impressora.p
   API REST do cadastro de impressoras
   (substitui o cadastro antigo de impressoras de etiqueta)
   Projeto: Cadastro de Impressoras | OpenEdge 12.8

   Base: /api/cdp/v1/api_cadastro_impressora/
   Todas as rotas recebem e devolvem JSON. Erros de negocio voltam
   com HTTP 200 e cod_erro <> 0 em tt_retorno.
   ========================================================= */

{utp/ut-api.i}

{utp/ut-api-action.i pi-impressoras         POST /impressoras/         }
{utp/ut-api-action.i pi-ativas              POST /ativas/              }
{utp/ut-api-action.i pi-salvar-impressora   POST /salvar-impressora/   }
{utp/ut-api-action.i pi-situacao-impressora POST /situacao-impressora/ }
{utp/ut-api-action.i pi-excluir-impressora  POST /excluir-impressora/  }
{utp/ut-api-action.i pi-tipos               POST /tipos/               }

{utp/ut-api-notfound.i}

{include/api_cadastro_impressora.i}

DEFINE VARIABLE hRegras AS HANDLE NO-UNDO.


/* ---------------------------------------------------------
   Impressoras
   --------------------------------------------------------- */

/* Lista do cadastro: payload opcional tipo (0 = todos) e situacao
   ("ativas", "inativas" ou "todas" - padrao "todas"). */
PROCEDURE pi-impressoras:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE iTipo     AS INTEGER   NO-UNDO.
    DEFINE VARIABLE cSituacao AS CHARACTER NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    IF oPayload:Has("tipo")     THEN iTipo     = oPayload:GetInteger("tipo").
    IF oPayload:Has("situacao") THEN cSituacao = TRIM(oPayload:GetCharacter("situacao")).

    RUN pi-listar-impressoras IN hRegras (INPUT  iTipo,
                                           INPUT  cSituacao,
                                           OUTPUT TABLE tt_impressora).
    RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_impressora:HANDLE).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


/* Para outras telas HTML montarem o combo: so' as ativas do tipo pedido
   (payload tipo; 0 ou ausente = todos). */
PROCEDURE pi-ativas:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE iTipo    AS INTEGER NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    IF oPayload:Has("tipo") THEN iTipo = oPayload:GetInteger("tipo").

    RUN pi-listar-impressoras-ativas IN hRegras (INPUT  iTipo,
                                                  OUTPUT TABLE tt_impressora).
    RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_impressora:HANDLE).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


/* id vazio inclui; senao altera. Devolve a impressora gravada. */
PROCEDURE pi-salvar-impressora:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    EMPTY TEMP-TABLE tt_impressora.
    CREATE tt_impressora.
    IF oPayload:Has("id")      THEN tt_impressora.id      = oPayload:GetCharacter("id").
    IF oPayload:Has("nome")    THEN tt_impressora.nome    = oPayload:GetCharacter("nome").
    IF oPayload:Has("caminho") THEN tt_impressora.caminho = oPayload:GetCharacter("caminho").
    IF oPayload:Has("tipo")    THEN tt_impressora.tipo    = oPayload:GetInteger("tipo").
    IF oPayload:Has("ativa")   THEN tt_impressora.ativa   = oPayload:GetLogical("ativa").

    RUN pi-salvar-impressora IN hRegras (INPUT-OUTPUT TABLE tt_impressora).
    RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_impressora:HANDLE).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


PROCEDURE pi-situacao-impressora:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE cId      AS CHARACTER NO-UNDO.
    DEFINE VARIABLE lAtiva   AS LOGICAL   NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    IF oPayload:Has("id")    THEN cId    = oPayload:GetCharacter("id").
    IF oPayload:Has("ativa") THEN lAtiva = oPayload:GetLogical("ativa").

    RUN pi-alterar-situacao IN hRegras (INPUT  cId,
                                         INPUT  lAtiva,
                                         OUTPUT TABLE tt_impressora).
    RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_impressora:HANDLE).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


PROCEDURE pi-excluir-impressora:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE VARIABLE cId      AS CHARACTER NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    IF oPayload:Has("id") THEN cId = oPayload:GetCharacter("id").

    RUN pi-excluir-impressora IN hRegras (INPUT cId).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


/* ---------------------------------------------------------
   Tipos de impressora (lista fixa, so' leitura)
   --------------------------------------------------------- */

PROCEDURE pi-tipos:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    DEFINE VARIABLE oPayload AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    RUN pi-inicia (INPUT jsonInput, OUTPUT jsonOutput, OUTPUT oPayload).

    RUN pi-listar-tipos IN hRegras (OUTPUT TABLE tt_tipo_impressora).
    RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_tipo_impressora:HANDLE).

    CATCH eErro AS Progress.Lang.Error:
        RUN pi-registra-erro (eErro).
    END CATCH.
    FINALLY:
        RUN pi-finaliza (jsonOutput).
    END FINALLY.
END PROCEDURE.


/* ---------------------------------------------------------
   Infraestrutura comum das rotas
   --------------------------------------------------------- */

/* O ut-api.i entrega o envelope inteiro da requisicao; o corpo do POST
   fica em "payload". Sem corpo, devolve um objeto vazio para as rotas
   nao precisarem testar VALID-OBJECT. */
PROCEDURE pi-inicia PRIVATE:
    DEFINE INPUT  PARAMETER jsonInput  AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE OUTPUT PARAMETER oPayload   AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    EMPTY TEMP-TABLE tt_retorno.
    jsonOutput = NEW Progress.Json.ObjectModel.JsonObject().

    IF VALID-OBJECT(jsonInput) AND jsonInput:Has("payload") THEN
        oPayload = jsonInput:GetJsonObject("payload").
    ELSE
        oPayload = NEW Progress.Json.ObjectModel.JsonObject().

    RUN cdp/api_cadastro_impressoraRP.p PERSISTENT SET hRegras.
END PROCEDURE.

PROCEDURE pi-adiciona-tabela PRIVATE:
    DEFINE INPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.
    DEFINE INPUT PARAMETER hTabela    AS HANDLE NO-UNDO.

    DEFINE VARIABLE jsonArray AS Progress.Json.ObjectModel.JsonArray NO-UNDO.

    jsonArray = NEW Progress.Json.ObjectModel.JsonArray().
    jsonArray:READ(hTabela).
    jsonOutput:Add(hTabela:NAME, jsonArray).
END PROCEDURE.

PROCEDURE pi-registra-erro PRIVATE:
    DEFINE INPUT PARAMETER eErro AS Progress.Lang.Error NO-UNDO.

    DEFINE VARIABLE cMensagem AS CHARACTER NO-UNDO.

    cMensagem = IF TYPE-OF(eErro, Progress.Lang.AppError)
                   AND CAST(eErro, Progress.Lang.AppError):ReturnValue <> ""
                THEN CAST(eErro, Progress.Lang.AppError):ReturnValue
                ELSE eErro:GetMessage(1).

    EMPTY TEMP-TABLE tt_retorno.
    CREATE tt_retorno.
    ASSIGN tt_retorno.cod_erro  = -1
           tt_retorno.desc_erro = cMensagem.
END PROCEDURE.

PROCEDURE pi-finaliza PRIVATE:
    DEFINE INPUT PARAMETER jsonOutput AS Progress.Json.ObjectModel.JsonObject NO-UNDO.

    IF NOT CAN-FIND(FIRST tt_retorno) THEN DO:
        CREATE tt_retorno.
        ASSIGN tt_retorno.cod_erro  = 0
               tt_retorno.desc_erro = "OK".
    END.

    IF VALID-OBJECT(jsonOutput) THEN
        RUN pi-adiciona-tabela (jsonOutput, TEMP-TABLE tt_retorno:HANDLE).

    IF VALID-HANDLE(hRegras) THEN
        DELETE PROCEDURE hRegras.
END PROCEDURE.
