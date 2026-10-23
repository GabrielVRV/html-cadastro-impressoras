import { FiltroImpressoras, Impressora, TODOS_TIPOS } from '../models';

/** Mesmos limites dos campos em DFs/es-impressora.df / api_cadastro_impressoraRP.p. */
export const TAMANHO_NOME = 60;
export const TAMANHO_CAMINHO = 200;

const atendeSituacao = (impressora: Impressora, situacao: FiltroImpressoras['situacao']) =>
  situacao === 'todas' || impressora.ativa === (situacao === 'ativas');

const contemTexto = (impressora: Impressora, texto: string): boolean =>
  [impressora.nome, impressora.caminho, impressora.descTipo].some((campo) =>
    campo.toLowerCase().includes(texto),
  );

export function filtrarImpressoras(
  impressoras: Impressora[],
  { texto, tipo, situacao }: FiltroImpressoras,
): Impressora[] {
  const busca = texto.trim().toLowerCase();
  return impressoras.filter(
    (impressora) =>
      atendeSituacao(impressora, situacao) &&
      (tipo === TODOS_TIPOS || impressora.tipo === tipo) &&
      (!busca || contemTexto(impressora, busca)),
  );
}
