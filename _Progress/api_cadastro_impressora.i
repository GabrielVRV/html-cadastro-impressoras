/* =========================================================
   api_cadastro_impressora.i
   Temp-tables e tipos do cadastro de impressoras
   Projeto: Cadastro de Impressoras

   Inclua este arquivo no programa que chama
   pi-listar-impressoras-ativas do cdp/api_cadastro_impressoraRP.p.
   Os nomes dos campos sao o contrato JSON com o front
   (HTML/src/app/data/http/dtos.ts) - mudou aqui, muda la.
   ========================================================= */

/* Tipos de impressora: o codigo e' a posicao na lista. Tipo novo vai
   no fim da lista (nunca no meio) e na DESCRIPTION do campo
   es-impressora.tipo (DFs/es-impressora.df). 0 = nenhum tipo. */
&GLOBAL-DEFINE TIPOS-IMPRESSORA "Etiqueta,Papel,Cupom Fiscal"
&GLOBAL-DEFINE TIPO-IMPRESSORA-ETIQUETA     1
&GLOBAL-DEFINE TIPO-IMPRESSORA-PAPEL        2
&GLOBAL-DEFINE TIPO-IMPRESSORA-CUPOM-FISCAL 3

/* id = STRING(ROWID) da es-impressora, que nao tem codigo proprio
   (a chave e' nome + caminho). Vazio = impressora nova. */
DEFINE TEMP-TABLE tt_impressora NO-UNDO
    FIELD id        AS CHARACTER
    FIELD nome      AS CHARACTER
    FIELD caminho   AS CHARACTER
    FIELD tipo      AS INTEGER
    FIELD desc_tipo AS CHARACTER
    FIELD ativa     AS LOGICAL INITIAL YES
    INDEX idx-nome nome.

/* Lista fixa de {&TIPOS-IMPRESSORA}, para o front nao repetir os tipos. */
DEFINE TEMP-TABLE tt_tipo_impressora NO-UNDO
    FIELD tipo      AS INTEGER
    FIELD descricao AS CHARACTER
    INDEX idx-tipo IS PRIMARY UNIQUE tipo.

DEFINE TEMP-TABLE tt_retorno NO-UNDO
    FIELD cod_erro  AS INTEGER
    FIELD desc_erro AS CHARACTER FORMAT "x(256)".
