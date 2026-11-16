import type { OfferRepository } from "../data/repository";
import type { LibraryInput, MinedOffer } from "./schema";

const RUNS = [
  "2026-11-13T10:00:00.000Z",
  "2026-11-14T01:00:00.000Z",
  "2026-11-14T10:00:00.000Z",
  "2026-11-15T01:00:00.000Z",
  "2026-11-15T10:00:00.000Z",
  "2026-11-16T01:00:00.000Z",
  "2026-11-16T10:00:00.000Z",
] as const;

type HistoryPoint = { capturedAt: string; libraries: LibraryInput[] };

function history(totals: number[], libraries: LibraryInput[], runs: readonly string[] = RUNS): HistoryPoint[] {
  return totals.map((total, index) => {
    const last = index === totals.length - 1;
    return {
      capturedAt: runs[index] ?? runs[runs.length - 1],
      libraries: last
        ? libraries
        : [
            {
              page_name: libraries[0]?.page_name ?? "Página exemplo",
              library_url: libraries[0]?.library_url ?? "https://www.facebook.com/ads/library/",
              active_ads: total,
            },
          ],
    };
  });
}

const queimaLibraries: LibraryInput[] = [
  {
    page_name: "Dra. Helena Queima",
    library_url:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all",
    active_ads: 320,
  },
  {
    page_name: "Queima 21 Oficial",
    library_url:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100002&search_type=page&media_type=all",
    active_ads: 226,
  },
];

const reservaLibraries: LibraryInput[] = [
  {
    page_name: "Reserva Blindada",
    library_url:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all",
    active_ads: 160,
  },
  {
    page_name: "Blindada App",
    library_url:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100005&search_type=page&media_type=all",
    active_ads: 88,
  },
];

const reconquistaLibraries: LibraryInput[] = [
  {
    page_name: "Reconquista MX",
    library_url:
      "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all",
    active_ads: 86,
  },
];

type ExampleOffer = {
  offer: Omit<MinedOffer, "libraries" | "captured_at">;
  history: HistoryPoint[];
};

export const EXAMPLE_OFFERS: ExampleOffer[] = [
  {
    offer: {
      slug: "exemplo-protocolo-queima-21",
      title: "Exemplo: Protocolo Queima 21",
      niche: "Emagrecimento",
      language_country: "Português / Brasil",
      opportunity: "alta",
      opportunity_score: 5,
      google_library_url:
        "https://adstransparency.google.com/advertiser/AR-exemplo-queima?region=BR",
      opportunity_notes:
        "Criativo de antes e depois com quiz curto. O salto de anúncios na última madrugada sugere escala ativa. Modelar o quiz, não a página de vendas.",
      expert: true,
      promise: "Perca até 7 kg em 21 dias sem academia, com chá, jejum e um plano de prato único.",
      front_ticket: "R$ 47 à vista ou 12x R$ 4,91",
      funnel_model: "Quiz+VSL",
      running_since: "2026-06-03",
      destination_urls: [
        "https://protocoloqueima21.exemplo/quiz/inicio?utm_source=meta&utm_campaign=escala-br",
        "https://protocoloqueima21.exemplo/vsl/aula-aberta",
      ],
      checkout_url: "https://pay.protocoloqueima21.exemplo/checkout/queima-21?src=meta",
      order_bumps: [
        {
          title: "Chás de apoio — kit 21 dias",
          description: "Lista de compras e modo de preparo do chá da manhã.",
          price_cash: "R$ 27",
          price_installments: "3x R$ 10,11",
        },
        {
          title: "Planner de jejum",
          description: "PDF com as janelas de jejum dos 21 dias.",
          price_cash: "R$ 17",
          price_installments: "2x R$ 9,51",
        },
      ],
      upsells: [
        {
          kind: "upsell",
          title: "Acompanhamento com a nutricionista",
          url: "https://protocoloqueima21.exemplo/upsell/nutri",
          price: "R$ 197",
        },
        {
          kind: "downsell",
          title: "Grupo de WhatsApp por 30 dias",
          url: "https://protocoloqueima21.exemplo/downsell/grupo",
          price: "R$ 47",
        },
      ],
      modeling_notes:
        "DADO DE EXEMPLO. Não é uma oferta real e não foi minerada da Biblioteca de Anúncios. Existe só para demonstrar o painel. Na modelagem, o quiz pede idade, peso e objetivo antes da VSL de 18 minutos.",
      raw: { example: true, source: "seed", vertical: "infoproduto" },
      status: "active",
    },
    history: history([310, 348, 390, 421, 448, 466, 546], queimaLibraries),
  },
  {
    offer: {
      slug: "exemplo-reserva-blindada",
      title: "Exemplo: Reserva Blindada",
      niche: "Finanças",
      language_country: "Português / Brasil",
      opportunity: "media",
      opportunity_score: 3,
      opportunity_notes:
        "SaaS de assinatura baixa, sem expert na capa. O volume subiu forte na leitura das 7h. Oportunidade média até a análise confirmar se o criativo aguenta.",
      expert: false,
      promise: "Veja para onde vai cada real e cancele assinatura esquecida em menos de dez minutos.",
      front_ticket: "R$ 29/mês",
      funnel_model: "VSL",
      running_since: "2026-08-19",
      destination_urls: ["https://reservablindada.exemplo/vsl?utm_source=meta"],
      checkout_url: "https://pay.reservablindada.exemplo/assinar/mensal",
      order_bumps: [
        {
          title: "Planilha de corte de gastos",
          description: "A planilha que a VSL mostra no minuto 4.",
          price_cash: "R$ 19",
          price_installments: "2x R$ 10,70",
        },
      ],
      upsells: [
        {
          kind: "upsell",
          title: "Plano anual",
          url: "https://reservablindada.exemplo/upsell/anual",
          price: "R$ 197/ano",
        },
      ],
      modeling_notes:
        "DADO DE EXEMPLO. Não é uma oferta real. SaaS de low ticket com checkout recorrente e um único order bump.",
      raw: { example: true, source: "seed", vertical: "saas" },
      status: "active",
    },
    history: history([90, 102, 110, 121, 130, 138, 248], reservaLibraries),
  },
  {
    offer: {
      slug: "exemplo-reconquista-14-dias",
      title: "Exemplo: Reconquista em 14 dias",
      niche: "Relacionamento",
      language_country: "Espanhol / México",
      opportunity: "nao_avaliada",
      expert: true,
      promise:
        "El método de 14 días para reabrir la conversación sin rogar ni mandar un texto enorme.",
      front_ticket: "MX$ 97 à vista",
      funnel_model: "Quiz",
      running_since: "2026-10-02",
      destination_urls: [
        "https://reconquista14.exemplo/mx/quiz?utm_source=meta",
        "https://reconquista14.exemplo/mx/obrigado",
      ],
      checkout_url: "https://pay.reconquista14.exemplo/mx/checkout",
      order_bumps: [],
      upsells: [
        {
          kind: "downsell",
          title: "Audio de emergencia",
          url: "https://reconquista14.exemplo/mx/downsell/audio",
          price: "MX$ 47",
        },
      ],
      modeling_notes:
        "DADO DE EXEMPLO. Não é uma oferta real. Low ticket em espanhol, ainda sem avaliação do bot de análise.",
      raw: { example: true, source: "seed", vertical: "low-ticket" },
      status: "active",
    },
    history: history(
      [140, 132, 125, 118, 101, 86],
      reconquistaLibraries,
      RUNS.slice(0, 6),
    ),
  },
];

export async function seedExampleOffers(repo: OfferRepository) {
  for (const example of EXAMPLE_OFFERS) {
    for (const point of example.history) {
      await repo.upsertMinedOffer({
        ...example.offer,
        libraries: point.libraries,
        captured_at: point.capturedAt,
      });
    }
  }
}
