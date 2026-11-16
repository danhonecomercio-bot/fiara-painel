-- DADOS DE EXEMPLO
-- Três ofertas fictícias para demonstrar o painel.
-- Não foram mineradas da Biblioteca de Anúncios.
-- Apague com:
--   delete from public.offers where raw->>'example' = 'true';

delete from public.offers where slug like 'exemplo-%';

insert into public.offers (
  id, slug, title, niche, language_country, opportunity, opportunity_notes,
  expert, promise, front_ticket, funnel_model, running_since, destination_urls,
  checkout_url, order_bumps, upsells, modeling_notes, raw, status, created_at, updated_at
) values
(
  '11111111-1111-4111-8111-111111111111',
  'exemplo-protocolo-queima-21',
  'Exemplo: Protocolo Queima 21',
  'Emagrecimento',
  'Português / Brasil',
  'alta',
  'Criativo de antes e depois com quiz curto. O salto de anúncios na última madrugada sugere escala ativa. Modelar o quiz, não a página de vendas.',
  true,
  'Perca até 7 kg em 21 dias sem academia, com chá, jejum e um plano de prato único.',
  'R$ 47 à vista ou 12x R$ 4,91',
  'Quiz+VSL',
  '2026-06-03',
  array[
    'https://protocoloqueima21.exemplo/quiz/inicio?utm_source=meta&utm_campaign=escala-br',
    'https://protocoloqueima21.exemplo/vsl/aula-aberta'
  ],
  'https://pay.protocoloqueima21.exemplo/checkout/queima-21?src=meta',
  '[
    {"title":"Chás de apoio — kit 21 dias","description":"Lista de compras e modo de preparo do chá da manhã.","price_cash":"R$ 27","price_installments":"3x R$ 10,11"},
    {"title":"Planner de jejum","description":"PDF com as janelas de jejum dos 21 dias.","price_cash":"R$ 17","price_installments":"2x R$ 9,51"}
  ]'::jsonb,
  '[
    {"kind":"upsell","title":"Acompanhamento com a nutricionista","url":"https://protocoloqueima21.exemplo/upsell/nutri","price":"R$ 197"},
    {"kind":"downsell","title":"Grupo de WhatsApp por 30 dias","url":"https://protocoloqueima21.exemplo/downsell/grupo","price":"R$ 47"}
  ]'::jsonb,
  'DADO DE EXEMPLO. Não é uma oferta real e não foi minerada da Biblioteca de Anúncios. Existe só para demonstrar o painel. Na modelagem, o quiz pede idade, peso e objetivo antes da VSL de 18 minutos.',
  '{"example":true,"source":"seed","vertical":"infoproduto"}'::jsonb,
  'active',
  '2026-11-13T10:00:00Z',
  '2026-11-16T10:00:00Z'
),
(
  '22222222-2222-4222-8222-222222222222',
  'exemplo-reserva-blindada',
  'Exemplo: Reserva Blindada',
  'Finanças',
  'Português / Brasil',
  'media',
  'SaaS de assinatura baixa, sem expert na capa. O volume subiu forte na leitura das 7h. Oportunidade média até a análise confirmar se o criativo aguenta.',
  false,
  'Veja para onde vai cada real e cancele assinatura esquecida em menos de dez minutos.',
  'R$ 29/mês',
  'VSL',
  '2026-08-19',
  array['https://reservablindada.exemplo/vsl?utm_source=meta'],
  'https://pay.reservablindada.exemplo/assinar/mensal',
  '[{"title":"Planilha de corte de gastos","description":"A planilha que a VSL mostra no minuto 4.","price_cash":"R$ 19","price_installments":"2x R$ 10,70"}]'::jsonb,
  '[{"kind":"upsell","title":"Plano anual","url":"https://reservablindada.exemplo/upsell/anual","price":"R$ 197/ano"}]'::jsonb,
  'DADO DE EXEMPLO. Não é uma oferta real. SaaS de low ticket com checkout recorrente e um único order bump.',
  '{"example":true,"source":"seed","vertical":"saas"}'::jsonb,
  'active',
  '2026-11-13T10:00:00Z',
  '2026-11-16T10:00:00Z'
),
(
  '33333333-3333-4333-8333-333333333333',
  'exemplo-reconquista-14-dias',
  'Exemplo: Reconquista em 14 dias',
  'Relacionamento',
  'Espanhol / México',
  'nao_avaliada',
  null,
  true,
  'El método de 14 días para reabrir la conversación sin rogar ni mandar un texto enorme.',
  'MX$ 97 à vista',
  'Quiz',
  '2026-10-02',
  array[
    'https://reconquista14.exemplo/mx/quiz?utm_source=meta',
    'https://reconquista14.exemplo/mx/obrigado'
  ],
  'https://pay.reconquista14.exemplo/mx/checkout',
  '[]'::jsonb,
  '[{"kind":"downsell","title":"Audio de emergencia","url":"https://reconquista14.exemplo/mx/downsell/audio","price":"MX$ 47"}]'::jsonb,
  'DADO DE EXEMPLO. Não é uma oferta real. Low ticket em espanhol, ainda sem avaliação do bot de análise.',
  '{"example":true,"source":"seed","vertical":"low-ticket"}'::jsonb,
  'active',
  '2026-11-13T10:00:00Z',
  '2026-11-16T01:00:00Z'
);

insert into public.offer_libraries (offer_id, page_name, library_url, active_ads) values
(
  '11111111-1111-4111-8111-111111111111',
  'Dra. Helena Queima',
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all',
  320
),
(
  '11111111-1111-4111-8111-111111111111',
  'Queima 21 Oficial',
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100002&search_type=page&media_type=all',
  226
),
(
  '22222222-2222-4222-8222-222222222222',
  'Reserva Blindada',
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all',
  160
),
(
  '22222222-2222-4222-8222-222222222222',
  'Blindada App',
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100005&search_type=page&media_type=all',
  88
),
(
  '33333333-3333-4333-8333-333333333333',
  'Reconquista MX',
  'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all',
  86
);

insert into public.offer_snapshots (offer_id, captured_at, total_active_ads, per_library)
select offer_id, captured_at, total_active_ads, per_library
from (
  values
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-13T10:00:00Z'::timestamptz, 310, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":310}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-14T01:00:00Z'::timestamptz, 348, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":348}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-14T10:00:00Z'::timestamptz, 390, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":390}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-15T01:00:00Z'::timestamptz, 421, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":421}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-15T10:00:00Z'::timestamptz, 448, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":448}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-16T01:00:00Z'::timestamptz, 466, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":466}]'::jsonb),
    ('11111111-1111-4111-8111-111111111111'::uuid, '2026-11-16T10:00:00Z'::timestamptz, 546, '[{"page_name":"Dra. Helena Queima","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100001&search_type=page&media_type=all","active_ads":320},{"page_name":"Queima 21 Oficial","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100002&search_type=page&media_type=all","active_ads":226}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-13T10:00:00Z'::timestamptz, 90, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":90}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-14T01:00:00Z'::timestamptz, 102, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":102}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-14T10:00:00Z'::timestamptz, 110, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":110}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-15T01:00:00Z'::timestamptz, 121, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":121}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-15T10:00:00Z'::timestamptz, 130, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":130}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-16T01:00:00Z'::timestamptz, 138, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":138}]'::jsonb),
    ('22222222-2222-4222-8222-222222222222'::uuid, '2026-11-16T10:00:00Z'::timestamptz, 248, '[{"page_name":"Reserva Blindada","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100003&search_type=page&media_type=all","active_ads":160},{"page_name":"Blindada App","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&view_all_page_id=100005&search_type=page&media_type=all","active_ads":88}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-13T10:00:00Z'::timestamptz, 140, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":140}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-14T01:00:00Z'::timestamptz, 132, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":132}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-14T10:00:00Z'::timestamptz, 125, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":125}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-15T01:00:00Z'::timestamptz, 118, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":118}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-15T10:00:00Z'::timestamptz, 101, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":101}]'::jsonb),
    ('33333333-3333-4333-8333-333333333333'::uuid, '2026-11-16T01:00:00Z'::timestamptz, 86, '[{"page_name":"Reconquista MX","library_url":"https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=MX&view_all_page_id=100004&search_type=page&media_type=all","active_ads":86}]'::jsonb)
) as rows(offer_id, captured_at, total_active_ads, per_library);
