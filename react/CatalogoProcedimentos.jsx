/* =========================================================
   Ateliê Carla Denise — Catálogo de procedimentos
   React + Tailwind CSS · arquivo único e modular.

   Uso:
     import CatalogoProcedimentos from './CatalogoProcedimentos';
     <CatalogoProcedimentos />

   Exporta também as peças isoladas (CATEGORIAS, CardCategoria,
   ListaProcedimentos, PlaceholderFoto) para reaproveitamento.

   Sem dependências além de react e tailwindcss. As fontes
   sans/mono são as do preset do Tailwind — troque em
   tailwind.config se quiser Instrument Sans / JetBrains Mono.
   ========================================================= */

import { useState, useCallback } from 'react';

/* ---------------------------------------------------------
   1. Dados
   --------------------------------------------------------- */

export const CATEGORIAS = [
  {
    id: 'design-depilacao',
    titulo: 'Design & Depilação',
    placeholderTag: 'foto design',
    precoPartir: 'R$ 5',
    tempoEstimado: '10 a 35 min',
    totalItens: 12,
    tomPastel: 'bg-rose-50',
    itens: [
      { nome: 'Design de sobrancelhas', preco: 'R$ 45', duracao: '30 min', placeholderFoto: 'foto design de sobrancelhas' },
      { nome: 'Design + buço', preco: 'R$ 55', duracao: '30 min', placeholderFoto: 'foto design + buço' },
      { nome: 'Design + buço + nariz', preco: 'R$ 60', duracao: '30 min', placeholderFoto: 'foto design + buço + nariz' },
      { nome: 'Design com aplicação de henna', preco: 'R$ 55', duracao: '30 min', placeholderFoto: 'foto henna' },
      { nome: 'Design e pintura dos pelos brancos', preco: 'R$ 55', duracao: '30 min', placeholderFoto: 'foto pelos brancos' },
      { nome: 'Design + depilação facial', preco: 'R$ 65', duracao: '35 min', placeholderFoto: 'foto depilação facial' },
      { nome: 'Design + buço + nariz + henna', preco: 'R$ 70', duracao: '30 min', placeholderFoto: 'foto combo henna' },
      { nome: 'Depilação facial completa', preco: 'R$ 35', duracao: '30 min', placeholderFoto: 'foto facial completa' },
      { nome: 'Buço', preco: 'R$ 15', duracao: '10 min', placeholderFoto: 'foto buço' },
      { nome: 'Nariz', preco: 'R$ 10', duracao: '10 min', placeholderFoto: 'foto nariz' },
      { nome: 'Orelha', preco: 'R$ 5', duracao: '15 min', placeholderFoto: 'foto orelha' },
      { nome: 'Brow lamination', preco: 'R$ 120', duracao: '60 min', placeholderFoto: 'foto brow lamination' },
    ],
  },
  {
    id: 'micropigmentacao',
    titulo: 'Micropigmentação',
    placeholderTag: 'foto sobrancelha',
    precoPartir: 'R$ 400',
    tempoEstimado: '2 a 2h30',
    totalItens: 4,
    tomPastel: 'bg-violet-50',
    itens: [
      { nome: 'Microblading', preco: 'R$ 400', duracao: '120 min', placeholderFoto: 'foto microblading' },
      { nome: 'Nanoblading', preco: 'R$ 400', duracao: '120 min', placeholderFoto: 'foto nanoblading' },
      { nome: 'Micropigmentação shadow', preco: 'R$ 400', duracao: '120 min', placeholderFoto: 'foto shadow' },
      { nome: 'Correção de sobrancelhas · método Repigment', preco: 'R$ 497', duracao: '150 min', placeholderFoto: 'foto repigment' },
    ],
  },
  {
    id: 'olhos',
    titulo: 'Olhos',
    placeholderTag: 'foto delineado',
    precoPartir: 'R$ 200',
    tempoEstimado: '1 a 2h',
    totalItens: 3,
    tomPastel: 'bg-sky-50',
    itens: [
      { nome: 'Delineado dos olhos · superior', preco: 'R$ 200', duracao: '60 min', placeholderFoto: 'foto delineado superior' },
      { nome: 'Delineado dos olhos · inferior', preco: 'R$ 200', duracao: '60 min', placeholderFoto: 'foto delineado inferior' },
      { nome: 'Delineado dos olhos · superior e inferior', preco: 'R$ 399,90', duracao: '120 min', placeholderFoto: 'foto delineado completo' },
    ],
  },
  {
    id: 'labios',
    titulo: 'Lábios',
    placeholderTag: 'foto lábios',
    precoPartir: 'R$ 450',
    tempoEstimado: '3h',
    totalItens: 2,
    tomPastel: 'bg-pink-50',
    itens: [
      { nome: 'Micropigmentação labial', preco: 'R$ 450', duracao: '180 min', placeholderFoto: 'foto micro labial' },
      { nome: 'Microlabial', preco: 'R$ 450', duracao: '190 min', placeholderFoto: 'foto microlabial' },
    ],
  },
  {
    id: 'retoques',
    titulo: 'Retoques',
    placeholderTag: 'foto retoque',
    precoPartir: 'R$ 80',
    tempoEstimado: '40 a 120 min',
    totalItens: 4,
    tomPastel: 'bg-amber-50',
    itens: [
      { nome: 'Retoque de micro · 30 dias', preco: 'R$ 150', duracao: '90 min', placeholderFoto: 'foto retoque micro' },
      { nome: 'Retoque sobrancelhas · 6 meses ou mais', preco: 'R$ 400', duracao: '120 min', placeholderFoto: 'foto retoque sobrancelhas' },
      { nome: 'Retoque dos olhos · 30 dias', preco: 'R$ 80', duracao: '40 min', placeholderFoto: 'foto retoque olhos' },
      { nome: 'Retoque labial · 45 dias', preco: 'R$ 150', duracao: '120 min', placeholderFoto: 'foto retoque labial' },
    ],
  },
];

/* ---------------------------------------------------------
   2. Peças visuais compartilhadas
   --------------------------------------------------------- */

/** Hachuras diagonais sutis, desenhadas só com CSS. */
const HACHURAS = {
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(120,100,85,.09) 0 1px, transparent 1px 9px)',
};

/**
 * Placeholder de imagem: fundo pastel + hachuras + etiqueta branca.
 * Nenhuma tag <img> — é só o espaço reservado da foto.
 */
export function PlaceholderFoto({ rotulo, tom = 'bg-neutral-50', className = '', alturaBadgeNoTopo = true }) {
  return (
    <div
      className={`relative flex justify-center overflow-hidden ${tom} ${
        alturaBadgeNoTopo ? 'items-start pt-5' : 'items-center'
      } ${className}`}
      role="img"
      aria-label={rotulo}
    >
      <div className="absolute inset-0" style={HACHURAS} aria-hidden="true" />
      <span className="relative rounded-full bg-white/95 px-3.5 py-1.5 font-mono text-[11px] lowercase tracking-wide text-neutral-500 shadow-sm ring-1 ring-black/5">
        {rotulo}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------
   3. Card de categoria
   --------------------------------------------------------- */

export function CardCategoria({ categoria, onAbrir }) {
  const { titulo, placeholderTag, precoPartir, tempoEstimado, totalItens, tomPastel } = categoria;

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(27,23,20,.04),0_8px_24px_-16px_rgba(27,23,20,.18)] ring-1 ring-black/[.04] transition-shadow duration-300 hover:shadow-[0_2px_4px_rgba(27,23,20,.05),0_18px_40px_-22px_rgba(27,23,20,.28)]">
      <PlaceholderFoto rotulo={placeholderTag} tom={tomPastel} className="h-44 sm:h-48" />

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-neutral-900">{titulo}</h3>
          <p className="font-mono text-xs text-neutral-500">
            a partir de {precoPartir} · {tempoEstimado} · {totalItens}{' '}
            {totalItens === 1 ? 'item' : 'itens'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onAbrir(categoria.id)}
          className="mt-auto inline-flex items-center gap-2 self-start rounded-full bg-[#f8f4eb] px-5 py-2.5 text-sm font-medium text-[#684322] transition-all duration-300 hover:gap-3 hover:bg-[#684322] hover:text-[#f8f4eb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684322]"
          aria-label={`Ver valores de ${titulo}`}
        >
          Ver valores <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

/* ---------------------------------------------------------
   4. Lista interna de procedimentos
   --------------------------------------------------------- */

export function ListaProcedimentos({ categoria, onVoltar, selecionado, onSelecionar }) {
  return (
    <section aria-labelledby="titulo-categoria">
      <button
        type="button"
        onClick={onVoltar}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-[.18em] text-neutral-500 transition-colors duration-300 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684322]"
      >
        <span aria-hidden="true">←</span> Voltar para categorias
      </button>

      <header className="mt-6 border-b border-neutral-200 pb-6">
        <h2 id="titulo-categoria" className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {categoria.titulo}
        </h2>
        <p className="mt-2 font-mono text-xs text-neutral-500">
          a partir de {categoria.precoPartir} · {categoria.tempoEstimado} · {categoria.itens.length}{' '}
          {categoria.itens.length === 1 ? 'item' : 'itens'}
        </p>
      </header>

      <ul className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {categoria.itens.map((item) => {
          const ativo = selecionado?.nome === item.nome;
          return (
            <li key={item.nome}>
              <button
                type="button"
                onClick={() => onSelecionar(item)}
                aria-pressed={ativo}
                className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#684322] ${
                  ativo
                    ? 'bg-[#f8f4eb] shadow-[0_10px_28px_-20px_rgba(27,23,20,.45)] ring-2 ring-[#684322]'
                    : 'bg-white shadow-[0_1px_2px_rgba(27,23,20,.04)] ring-1 ring-black/[.04] hover:shadow-[0_10px_28px_-20px_rgba(27,23,20,.35)]'
                }`}
              >
                <PlaceholderFoto
                  rotulo={item.placeholderFoto}
                  tom={categoria.tomPastel}
                  alturaBadgeNoTopo={false}
                  className="h-20 w-20 shrink-0 rounded-xl p-2 text-center"
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-medium tracking-tight text-neutral-900">{item.nome}</h3>
                  <p className="mt-1.5 font-mono text-xs text-neutral-500">
                    <span className="text-[#684322]">{item.preco}</span> · {item.duracao}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className={`mr-2 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs transition-colors duration-300 ${
                    ativo ? 'bg-[#684322] text-[#f8f4eb]' : 'ring-1 ring-neutral-300'
                  }`}
                >
                  {ativo ? '✓' : ''}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------------------------------------------------
   5. Rodapé de agendamento — só aparece com um item escolhido
   --------------------------------------------------------- */

export function RodapeAgendar({ selecionado, urlAgenda }) {
  const visivel = Boolean(selecionado);

  return (
    <div
      className={`sticky bottom-4 z-20 mt-8 transition-all duration-500 ${
        visivel ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      aria-hidden={!visivel}
    >
      <div className="flex flex-col gap-4 rounded-2xl bg-[#1B1714] p-5 shadow-[0_24px_50px_-28px_rgba(27,23,20,.7)] sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[.22em] text-[#C9A6D6]">
            Procedimento escolhido
          </p>
          <p className="mt-1.5 truncate text-base font-medium text-[#FAF0DC]">{selecionado?.nome}</p>
          <p className="mt-1 font-mono text-xs text-[#FAF0DC]/60">
            {selecionado?.preco} · {selecionado?.duracao}
          </p>
        </div>

        <a
          href={urlAgenda}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visivel ? 0 : -1}
          className="inline-flex shrink-0 items-center justify-center gap-3 rounded-full bg-[#f8f4eb] py-3 pl-7 pr-3 text-base font-medium text-[#1B1714] transition-colors duration-300 hover:bg-[#C9A6D6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A6D6]"
        >
          Agende seu horário
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full bg-[#1B1714] text-sm text-[#FAF0DC]"
          >
            ↗
          </span>
        </a>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   6. Componente principal
   --------------------------------------------------------- */

export const URL_AGENDA = 'https://agendaagil.com/ateliecarla';

export default function CatalogoProcedimentos({ categorias = CATEGORIAS, urlAgenda = URL_AGENDA }) {
  const [abertaId, setAbertaId] = useState(null);
  const [selecionado, setSelecionado] = useState(null);

  const abrir = useCallback((id) => {
    setAbertaId(id);
    setSelecionado(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const voltar = useCallback(() => {
    setAbertaId(null);
    setSelecionado(null);
  }, []);

  // clicar de novo no mesmo item desmarca e esconde o rodapé
  const selecionar = useCallback(
    (item) => setSelecionado((atual) => (atual?.nome === item.nome ? null : item)),
    []
  );

  const aberta = categorias.find((c) => c.id === abertaId) ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      {aberta ? (
        <>
          <ListaProcedimentos
            categoria={aberta}
            onVoltar={voltar}
            selecionado={selecionado}
            onSelecionar={selecionar}
          />
          <RodapeAgendar selecionado={selecionado} urlAgenda={urlAgenda} />
        </>
      ) : (
        <>
          <header className="mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[.24em] text-[#734C80]">
              Tabela de valores
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
              Procedimentos por categoria
            </h2>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categorias.map((categoria) => (
              <CardCategoria key={categoria.id} categoria={categoria} onAbrir={abrir} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
