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
| `libraries` | Obrigatório. Pelo menos uma biblioteca da Meta. Cada `library_url` é http(s) e não pode repetir no mesmo payload. |
| `google_library_url` | Opcional. URL http(s) do Google Ads Transparency Center. |
| `opportunity` | Enum antigo, ainda aceito: `alta`, `media`, `baixa`, `nenhuma`, `nao_avaliada`. O painel não mostra mais esse valor. |
| `opportunity_score` | Inteiro de 0 a 5, ou `null` para “não avaliada”. |
| `funnel_model` | `Quiz`, `LP`, `Quiz+LP`, `Quiz+VSL`, `VSL` ou `null`. |
| `status` | `active` ou `paused`. |
| `running_since` | `YYYY-MM-DD` ou `null`. |
| `captured_at` | ISO 8601. Não é coluna da oferta; só marca o snapshot. |
| `order_bumps` | Lista de `{ title, description, price_cash, price_installments }`. |
| `upsells` | Lista de `{ kind: "upsell" \| "downsell", title, url, price }`. |
| `raw` | Objeto JSON livre. |

Campo desconhecido devolve 400. Não mande `id`.

URLs gravadas (`library_url`, `google_library_url`, `destination_urls`, `checkout_url` e `upsells[].url`) perdem parâmetros de rastreio: qualquer `utm_*`, além de `fbclid`, `gclid`, `gbraid`, `wbraid`, `dclid`, `msclkid`, `ttclid`, `twclid`, `yclid`, `igshid`, `igsh`, `mc_cid`, `mc_eid`, `src`, `sck`, `fb_source`, `fb_action_ids`, `fb_action_types`, `li_fat_id`, `sccid`, `epik`, `irclickid`, `gad_source`, `gad_campaignid`, `_ga`, `_gl` e `ref_src`. O painel também tira esses parâmetros na hora de exibir, inclusive em ofertas antigas.

## PATCH /api/offers/:slug

Atualização parcial. Não mexe em bibliotecas e não cria snapshot.

```bash
curl -sS -X PATCH "$APP_URL/api/offers/protocolo-queima-21" \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_score": 4,
    "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz.",
    "google_library_url": "https://adstransparency.google.com/advertiser/AR123?region=BR&utm_source=meta"
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
    "opportunity_score": 4,
    "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz.",
    "google_library_url": "https://adstransparency.google.com/advertiser/AR123?region=BR",
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
      "opportunity_score": 4,
      "opportunity_notes": "Escala consistente nas duas últimas leituras. Modelar o quiz.",
      "google_library_url": "https://adstransparency.google.com/advertiser/AR123?region=BR",
      "expert": true,
      "promise": "Perca até 7 kg em 21 dias sem academia.",
      "front_ticket": "R$ 47 à vista ou 12x R$ 4,91",
      "funnel_model": "Quiz+VSL",
      "running_since": "2026-06-03",
      "destination_urls": ["https://oferta.exemplo/quiz/inicio"],
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

`google_library_url` com `utm_source` é gravada sem o parâmetro.

## Ações da página de detalhe

Os botões **Baixar top ads** e **Modelar** não chamam o webhook pelo navegador. O servidor do painel faz um único `POST`, com timeout de 8 segundos, e grava o pedido em `offer_actions`.

| Botão | `action` | Variáveis |
| --- | --- | --- |
| Baixar top ads | `baixar_top_ads` | `TOPADS_WEBHOOK_URL` e `TOPADS_WEBHOOK_KEY` |
| Modelar | `modelar` | `MODELADOR_WEBHOOK_URL` e `MODELADOR_WEBHOOK_KEY` |

Sem o par de variáveis, o botão fica desabilitado: “não configurado” no de top ads e “em breve” no de modelar.

O painel manda:

```http
POST <WEBHOOK_URL>
Content-Type: application/json
Authorization: Bearer <WEBHOOK_KEY>
X-Automation-Key: <WEBHOOK_KEY>
```

```json
{
  "action": "baixar_top_ads",
  "slug": "protocolo-queima-21",
  "title": "Protocolo Queima 21",
  "funnel_slug": "protocolo-queima-21",
  "meta_library_urls": [
    "https://www.facebook.com/ads/library/?view_all_page_id=100001"
  ],
  "requested_by": "membro@fiara.com.br",
  "requested_at": "2026-11-16T18:00:00.000Z"
}
```

`funnel_slug` é o `slug` da oferta em minúsculas. `meta_library_urls` já vem sem rastreio. `requested_by` é o e-mail de quem está logado no painel. O corpo de **Modelar** é o mesmo, com `"action": "modelar"`.

Status do pedido: `pending`, `sent`, `failed`, `done`. O botão mostra “Pedido enviado” depois do POST aceito, “Falhou” se o webhook recusar ou estourar o tempo, e o link “Pasta no Drive” quando o bot marcar `done` com `result_url`.

### PATCH /api/offer-actions/:id

O bot devolve o resultado com `BOT_API_KEY`. Não cria snapshot.

```bash
curl -sS -X PATCH "$APP_URL/api/offer-actions/8d2c1c3e-1b4a-4f0e-9c2a-6b7d8e9f0a1b" \
  -H "Authorization: Bearer $BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "done",
    "result_url": "https://drive.google.com/drive/folders/abc123"
  }'
```

`status` é `done` ou `failed`. `result_url` é opcional e, se vier, precisa ser http(s); parâmetros de rastreio são removidos. `error` é o texto guardado quando falha.

### Resposta 200

```json
{
  "ok": true,
  "action": {
    "id": "8d2c1c3e-1b4a-4f0e-9c2a-6b7d8e9f0a1b",
    "offer_id": "11111111-1111-4111-8111-111111111111",
    "action": "baixar_top_ads",
    "status": "done",
    "requested_by": "membro@fiara.com.br",
    "result_url": "https://drive.google.com/drive/folders/abc123",
    "error": null,
    "created_at": "2026-11-16T18:00:00.000Z"
  }
}
```

### Resposta 404

```json
{
  "error": "nao_encontrada",
  "message": "Não há pedido com esse id."
}
```

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
