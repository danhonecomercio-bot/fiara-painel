"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
const SCORE_OPTIONS = ["5", "4", "3", "2", "1", "0", "nao_avaliada"] as const;
const SCORE_LABEL: Record<(typeof SCORE_OPTIONS)[number], string> = {
  "5": "5",
  "4": "4",
  "3": "3",
  "2": "2",
  "1": "1",
  "0": "0",
  nao_avaliada: "Não avaliada",
};

export function OfferFilters({
  niches,
  languages,
}: {
  niches: string[];
  languages: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedNicho = searchParams.getAll("nicho");
  const selectedIdioma = searchParams.getAll("idioma");
  const selectedOportunidade = searchParams.getAll("oportunidade");
  const ordem = searchParams.get("ordem") ?? "anuncios";
  const q = searchParams.get("q") ?? "";
  const active =
    selectedNicho.length + selectedIdioma.length + selectedOportunidade.length + (q ? 1 : 0) > 0;

  function push(next: URLSearchParams) {
    const query = next.toString();
    router.push(query ? `/?${query}` : "/", { scroll: false });
  }

  function setOrdem(value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "anuncios") next.delete("ordem");
    else next.set("ordem", value);
    push(next);
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const next = new URLSearchParams(searchParams.toString());
        const term = String(data.get("q") ?? "").trim();
        if (term) next.set("q", term);
        else next.delete("q");
        push(next);
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="busca-oferta">
          Buscar oferta
        </label>
        <Input
          id="busca-oferta"
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, promessa ou página"
        />
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <FilterMenu
          key={`nicho-${selectedNicho.join("|")}`}
          label="Nicho"
          param="nicho"
          options={niches}
          selected={selectedNicho}
        />
        <FilterMenu
          key={`idioma-${selectedIdioma.join("|")}`}
          label="Idioma/país"
          param="idioma"
          options={languages}
          selected={selectedIdioma}
        />
        <FilterMenu
          key={`oportunidade-${selectedOportunidade.join("|")}`}
          label="Oportunidade"
          param="oportunidade"
          options={[...SCORE_OPTIONS]}
          selected={selectedOportunidade}
          labels={SCORE_LABEL}
        />
        <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-gold lg:ml-auto">
          Ordenar
          <select
            value={ordem}
            onChange={(event) => setOrdem(event.target.value)}
            className="h-9 rounded-md border border-line bg-panel px-2 text-sm font-semibold normal-case tracking-normal text-white"
          >
            <option value="anuncios">Mais anúncios</option>
            <option value="crescimento">Maior crescimento</option>
            <option value="recentes">Mais recentes</option>
          </select>
        </label>
        {active ? (
          <Button type="button" variant="ghost" onClick={() => router.push("/", { scroll: false })}>
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function FilterMenu({
  label,
  param,
  options,
  selected,
  labels,
}: {
  label: string;
  param: string;
  options: string[];
  selected: string[];
  labels?: Record<string, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState(selected);

  function apply() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    draft.forEach((value) => next.append(param, value));
    const query = next.toString();
    router.push(query ? `/?${query}` : "/", { scroll: false });
  }

  return (
    <details className="relative">
      <summary className="flex h-9 cursor-pointer list-none items-center rounded-md border border-line bg-panel px-3 text-sm text-white">
        {label}
        {selected.length > 0 ? <span className="ml-2 text-gold">{selected.length}</span> : null}
      </summary>
      <div className="absolute z-20 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-gold/30 bg-panel p-3 shadow-lg">
        {options.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma opção ainda.</p>
        ) : (
          <ul className="grid max-h-56 gap-2 overflow-auto">
            {options.map((option) => {
              const id = `${param}-${option}`.replace(/[^\p{L}\p{N}-]+/gu, "-");
              return (
                <li key={option}>
                  <label htmlFor={id} className="flex items-start gap-2 text-sm text-white">
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-1"
                      checked={draft.includes(option)}
                      onChange={() => {
                        setDraft((current) =>
                          current.includes(option)
                            ? current.filter((item) => item !== option)
                            : [...current, option],
                        );
                      }}
                    />
                    <span>{labels?.[option] ?? option}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <Button type="button" className="mt-3 w-full" onClick={apply}>
          Aplicar
        </Button>
      </div>
    </details>
  );
}
