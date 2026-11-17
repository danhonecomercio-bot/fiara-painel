import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adsReadout,
  formatBumpPrice,
  formatCalendarDate,
  formatListUpdated,
  formatScanStamp,
  formatScore,
  formatTicketCompact,
  isHalfStepScore,
  formatSince,
  formatUpdated,
  heatPrefix,
  stripTracking,
} from "./format";

describe("leitura de anúncios", () => {
  it("formata o delta no horário de Brasília", () => {
    const readout = adsReadout(546, 466, "2026-11-16T01:00:00.000Z");
    assert.equal(readout.text, "546 (+80 desde 15/11 22h)");
    assert.equal(readout.delta, 80);
    assert.equal(formatUpdated("2026-11-16T10:00:00.000Z"), "atualizado em 16/11 - 7h");
    assert.equal(formatSince("2026-11-15T10:00:00.000Z"), "15/11 7h");
  });

  it("mostra queda e a primeira leitura sem histórico", () => {
    assert.equal(adsReadout(86, 101, "2026-11-15T10:00:00.000Z").text, "86 (-15 desde 15/11 7h)");
    assert.equal(adsReadout(86, null, null).text, "86");
    assert.equal(adsReadout(null, null, null).text, "sem leitura");
    assert.equal(adsReadout(10, 10, "2026-11-16T01:00:00.000Z").text, "10 (+0 desde 15/11 22h)");
  });

  it("marca estrela acima de 500 e fogo acima de 200", () => {
    assert.equal(heatPrefix(501), "⭐");
    assert.equal(heatPrefix(500), "🔥");
    assert.equal(heatPrefix(201), "🔥");
    assert.equal(heatPrefix(200), "");
    assert.equal(heatPrefix(null), "");
  });

  it("formata data de calendário sem deslocar o dia", () => {
    assert.equal(formatCalendarDate("2026-06-03"), "03/06/2026");
    assert.equal(formatScanStamp("2026-11-16T10:00:00.000Z"), "varredura em 16/11 - 7h");
    assert.equal(formatListUpdated("2026-11-16T17:00:00.000Z"), "16/11 - 14h");
    assert.equal(formatTicketCompact("R$ 47 à vista ou 12x R$ 4,91"), "R$ 47,00");
    assert.equal(formatTicketCompact("R$ 27,5"), "R$ 27,50");
    assert.equal(formatTicketCompact("sem preço"), null);
    assert.equal(formatScore(3.5), "3,5");
    assert.equal(formatScore(4), "4");
    assert.equal(isHalfStepScore(4.5), true);
    assert.equal(isHalfStepScore(4.2), false);
  });

  it("junta o preço do order bump numa linha e tira o rastreio da URL", () => {
    assert.equal(formatBumpPrice("R$ 27", "3x R$ 10,11"), "R$ 27 (ou 3x de R$10,11)");
    assert.equal(formatBumpPrice("R$ 27", null), "R$ 27");
    assert.equal(
      stripTracking("https://oferta.exemplo/quiz?utm_source=meta&fbclid=abc&id=1&src=meta&sck=1"),
      "https://oferta.exemplo/quiz?id=1",
    );
    assert.equal(
      stripTracking("https://oferta.exemplo/vsl?gclid=1&gbraid=2&utm_campaign=x"),
      "https://oferta.exemplo/vsl",
    );
  });
});
