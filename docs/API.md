# API dos bots

Base: `https://painel.fiara.com.br`

Toda chamada manda:

```http
Authorization: Bearer $BOT_API_KEY
Content-Type: application/json
```

A chave é a variável `BOT_API_KEY` do servidor. Ela não é a chave do Supabase.

O `POST` grava com a service role e **sempre acrescenta um snapshot**. O `PATCH` não cria snapshot: é o caminho do bot de análise.

`slug` é a chave estável. O mesmo slug atualiza a oferta em vez de duplicar. Campos omitidos no `POST` não apagam o que já estava salvo. `libraries` é obrigatório e **substitui** a lista de páginas da oferta. A soma de `active_ads` vira `total_active_ads` do snapshot.

Horário das minerações: 07:00 e 22:00 em `America/Sao_Paulo`. Envie `captured_at` em ISO 8601. Se omitir, o servidor usa o horário do pedido.

## POST /api/offers

Cria ou atualiza uma oferta, várias, ou um lote em `offers` (máximo 100).

### Uma oferta

```bash
curl -sS -X POST "$APP_URL/api/offers" \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "protocolo-queima-21",
    "title": "Protocolo Queima 21",
    "niche": "Emagrecimento",
    "language_country": "Português / Brasil",
    "expert": true,
    "promise": "Perca até 7 kg em 21 dias sem academia.",
    "front_ticket": "R$ 47 à vista ou 12x R$ 4,91",
    "funnel_model": "Quiz+VSL",
    "running_since": "2026-06-03",
    "destination_urls": [
      "https://oferta.exemplo/quiz/inicio?utm_source=meta"
    ],
    "checkout_url": "https://pay.oferta.exemplo/checkout/queima-21",
    "order_bumps": [
      {
        "title": "Planner de jejum",
        "description": "PDF com as janelas dos 21 dias.",
        "price_cash": "R$ 17",
        "price_installments": "2x R$ 9,51"
      }
    ],
    "upsells": [
      {
        "kind": "upsell",
        "title": "Acompanhamento",
        "url": "https://oferta.exemplo/upsell/nutri",
        "price": "R$ 197"
      }
    ],
    "modeling_notes": "Quiz curto antes da VSL.",
    "raw": { "ad_library_query": "queima 21" },
    "status": "active",
    "captured_at": "2026-11-16T07:00:00-03:00",
    "libraries": [
      {
        "page_name": "Dra. Helena Queima",
        "library_url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all",
        "active_ads": 320
      },
      {
        "page_name": "Queima 21 Oficial",
        "library_url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100002&search_type=page&media_type=all",
        "active_ads": 226
      }
    ]
  }'
```

### Várias ofertas

Os dois formatos abaixo são aceitos.

```bash
curl -sS -X POST "$APP_URL/api/offers" \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "offers": [
      {
        "slug": "reserva-blindada",
        "title": "Reserva Blindada",
        "niche": "Finanças",
        "language_country": "Português / Brasil",
        "funnel_model": "VSL",
        "status": "active",
        "captured_at": "2026-11-16T07:00:00-03:00",
        "libraries": [
          {
            "page_name": "Reserva Blindada",
            "library_url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all",
            "active_ads": 160
          }
        ]
      }
    ]
  }'
```

### Resposta 200

```json
{
  "ok": true,
  "count": 1,
  "results": [
    {
      "slug": "protocolo-queima-21",
      "id": "8d2c1c3e-1b4a-4f0e-9c2a-6b7d8e9f0a1b",
      "created": true,
      "total_active_ads": 546,
      "snapshot_id": "b1e2c3d4-1111-4222-8333-abcdefabcdef"
    }
  ]
}
```

`created` é `false` quando o slug já existia. `total_active_ads` é a soma das bibliotecas enviadas.

### Campos

| Campo | Regra |
| --- | --- |
| `slug` | Obrigatório, estável, sem espaço e sem `/`. |
| `title` | Obrigatório. |
| `libraries` | Obrigatório. Pode ser `[]`. Cada `library_url` é http(s) e não pode repetir no mesmo payload. |
| `opportunity` | `alta`, `media`, `baixa`, `nenhuma`, `nao_avaliada`. Se omitir na criação, fica `nao_avaliada`. |
| `funnel_model` | `Quiz`, `LP`, `Quiz+LP`, `Quiz+VSL`, `VSL` ou `null`. |
| `status` | `active` ou `paused`. |
| `running_since` | `YYYY-MM-DD` ou `null`. |
| `captured_at` | ISO 8601. Não é coluna da oferta; só marca o snapshot. |
| `order_bumps` | Lista de `{ title, description, price_cash, price_installments }`. |
| `upsells` | Lista de `{ kind: "upsell" \| "downsell", title, url, price }`. |
| `raw` | Objeto JSON livre. |

Campo desconhecido devolve 400. Não mande `id`.

## PATCH /api/offers/:slug

Atualização parcial. Não mexe em bibliotecas e não cria snapshot.

```bash
curl -sS -X PATCH "$APP_URL/api/offers/protocolo-queima-21" \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity": "alta",
    "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz."
  }'
```

### Resposta 200

```json
{
  "ok": true,
  "offer": {
    "id": "8d2c1c3e-1b4a-4f0e-9c2a-6b7d8e9f0a1b",
    "slug": "protocolo-queima-21",
    "title": "Protocolo Queima 21",
    "opportunity": "alta",
    "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz.",
    "libraries": [],
    "snapshots": []
  }
}
```

A resposta traz a oferta inteira, as bibliotecas e até 30 snapshots, do mais novo para o mais antigo. O exemplo acima está abreviado.

### Resposta 404

```json
{
  "error": "nao_encontrada",
  "message": "Não há oferta com esse slug."
}
```

## GET /api/offers

```bash
curl -sS "$APP_URL/api/offers?since=2026-11-15T00:00:00Z&limit=200&offset=0" \
  -H "Authorization: Bearer $BOT_API_KEY"
```

`since` filtra `updated_at >= since`. Cada `POST` e cada `PATCH` atualizam `updated_at`. Sem `since`, devolve a página pedida.

`limit` padrão 200, máximo 500. `offset` padrão 0.

### Resposta 200

```json
{
  "ok": true,
  "count": 1,
  "limit": 200,
  "offset": 0,
  "offers": [
    {
      "slug": "protocolo-queima-21",
      "title": "Protocolo Queima 21",
      "niche": "Emagrecimento",
      "language_country": "Português / Brasil",
      "opportunity": "alta",
      "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz.",
      "expert": true,
      "promise": "Perca até 7 kg em 21 dias sem academia.",
      "front_ticket": "R$ 47 à vista ou 12x R$ 4,91",
      "funnel_model": "Quiz+VSL",
      "running_since": "2026-06-03",
      "destination_urls": ["https://oferta.exemplo/quiz/inicio?utm_source=meta"],
      "checkout_url": "https://pay.oferta.exemplo/checkout/queima-21",
      "order_bumps": [],
      "upsells": [],
      "modeling_notes": "Quiz curto antes da VSL.",
      "raw": { "ad_library_query": "queima 21" },
      "status": "active",
      "created_at": "2026-11-16T10:00:00.000Z",
      "updated_at": "2026-11-16T10:05:00.000Z",
      "libraries": [
        {
          "page_name": "Dra. Helena Queima",
          "library_url": "https://www.facebook.com/ads/library/?view_all_page_id=100001",
          "active_ads": 320
        }
      ],
      "snapshots": [
        {
          "captured_at": "2026-11-16T10:00:00.000Z",
          "total_active_ads": 546,
          "per_library": []
        }
      ]
    }
  ]
}
```

Snapshots vêm do mais novo para o mais antigo, no máximo 30.

## Erros

| HTTP | `error` | Quando |
| --- | --- | --- |
| 400 | `payload_invalido` | JSON válido, mas os campos não passam. |
| 400 | `json_invalido` | Corpo vazio ou JSON quebrado. |
| 401 | `nao_autorizado` | Bearer ausente ou diferente de `BOT_API_KEY`. |
| 404 | `nao_encontrada` | `PATCH` de slug inexistente. |
| 413 | `payload_grande` | Corpo acima de 1,5 MB. |
| 500 | `nao_configurado` | O servidor está sem `BOT_API_KEY`. |
| 500 | `falha_parcial` | Uma oferta do lote falhou. `results` traz as que já foram gravadas e `failed_slug` aponta a que quebrou. |
| 500 | `falha_interna` | Falha de banco ou ambiente. |

Exemplo de validação:

```json
{
  "error": "payload_invalido",
  "message": "O corpo não passou na validação.",
  "issues": [
    { "path": "offers.0.opportunity", "message": "Invalid enum value. Expected 'alta' | 'media' | 'baixa' | 'nenhuma' | 'nao_avaliada', received 'altissima'" }
  ]
}
```

Sem o header:

```bash
curl -sS -o /tmp/fiara-api.json -w "%{http_code}\n" -X POST "$APP_URL/api/offers" \
  -H "Content-Type: application/json" \
  -d '{"slug":"x","title":"X","libraries":[]}'
```

```json
{
  "error": "nao_autorizado",
  "message": "Envie o header Authorization: Bearer <BOT_API_KEY>."
}
```
