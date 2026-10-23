import { FiltroImpressoras, Impressora, TODOS_TIPOS } from '../models';
import { filtrarImpressoras } from './impressora.rules';

const impressora = (dados: Partial<Impressora>): Impressora => ({
  id: '1',
  nome: 'Zebra Expedição',
  caminho: '\\\\srv-print\\zebra-exp',
  tipo: 1,
  descTipo: 'Etiqueta',
  ativa: true,
  ...dados,
});

const LISTA = [
  impressora({ id: '1' }),
  impressora({
    id: '2',
    nome: 'Zebra Almox',
    caminho: '\\\\srv-print\\zebra-almox',
    ativa: false,
  }),
  impressora({
    id: '3',
    nome: 'Laser RH',
    caminho: '\\\\srv-print\\rh',
    tipo: 2,
    descTipo: 'Papel',
  }),
];

const filtro = (dados: Partial<FiltroImpressoras>): FiltroImpressoras => ({
  texto: '',
  tipo: TODOS_TIPOS,
  situacao: 'todas',
  ...dados,
});

const ids = (lista: Impressora[]) => lista.map((i) => i.id);

describe('filtrarImpressoras', () => {
  it('sem filtro devolve todas', () => {
    expect(ids(filtrarImpressoras(LISTA, filtro({})))).toEqual(['1', '2', '3']);
  });

  it('filtra por situação', () => {
    expect(ids(filtrarImpressoras(LISTA, filtro({ situacao: 'ativas' })))).toEqual(['1', '3']);
    expect(ids(filtrarImpressoras(LISTA, filtro({ situacao: 'inativas' })))).toEqual(['2']);
  });

  it('filtra por tipo', () => {
    expect(ids(filtrarImpressoras(LISTA, filtro({ tipo: 2 })))).toEqual(['3']);
    expect(ids(filtrarImpressoras(LISTA, filtro({ tipo: 3 })))).toEqual([]);
  });

  it('busca no nome, caminho e tipo sem diferenciar maiúsculas', () => {
    expect(ids(filtrarImpressoras(LISTA, filtro({ texto: '  ZEBRA ' })))).toEqual(['1', '2']);
    expect(ids(filtrarImpressoras(LISTA, filtro({ texto: 'almox' })))).toEqual(['2']);
    expect(ids(filtrarImpressoras(LISTA, filtro({ texto: 'papel' })))).toEqual(['3']);
  });

  it('combina os filtros', () => {
    const resultado = filtrarImpressoras(LISTA, filtro({ texto: 'zebra', situacao: 'ativas' }));
    expect(ids(resultado)).toEqual(['1']);
  });
});
