import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adsReadout, formatCalendarDate, formatSince, formatUpdated, heatPrefix } from "./format";

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
  });
});
