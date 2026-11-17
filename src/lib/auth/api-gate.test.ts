import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { gateDecision, hasBearerAuthorization, isBotApiPath } from "./api-gate";

const id = "00000000-0000-4000-8000-000000000001";

describe("portão da API", () => {
  it("reconhece as rotas dos bots", () => {
    assert.equal(isBotApiPath("/api/offers"), true);
    assert.equal(isBotApiPath("/api/offers/queima-21"), true);
    assert.equal(isBotApiPath(`/api/offer-actions/${id}`), true);
    assert.equal(isBotApiPath("/api/offers-extra"), false);
    assert.equal(isBotApiPath("/ofertas/queima-21"), false);
  });

  it("deixa o Bearer seguir para a rota e responde 401 sem ele, nunca login", () => {
    const path = `/api/offer-actions/${id}`;
    assert.equal(gateDecision(path, { loggedIn: false, hasBearer: true }), "next");
    assert.equal(gateDecision("/api/offers", { loggedIn: false, hasBearer: true }), "next");
    assert.equal(gateDecision(path, { loggedIn: false, hasBearer: false }), "unauthorized");
    assert.equal(gateDecision("/api/outra", { loggedIn: false, hasBearer: false }), "unauthorized");
    assert.equal(gateDecision("/ofertas/queima-21", { loggedIn: false, hasBearer: false }), "login");
    assert.equal(hasBearerAuthorization("Bearer segredo"), true);
    assert.equal(hasBearerAuthorization("Bearer "), false);
    assert.equal(hasBearerAuthorization(null), false);
  });
});
