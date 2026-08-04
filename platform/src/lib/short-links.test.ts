import test from "node:test";
import assert from "node:assert/strict";
import { isPreviewBot, replaceNarrativeLink, validateDestinationUrl } from "./short-links";

test("preserva integralmente URL e parâmetros de afiliado", () => {
  const destination = "https://s.shopee.com.br/abc123?utm_source=threads&affiliate_id=42";
  assert.equal(validateDestinationUrl(destination), destination);
});

test("bloqueia protocolos e destinos internos", () => {
  assert.throws(() => validateDestinationUrl("file:///etc/passwd"));
  assert.throws(() => validateDestinationUrl("http://127.0.0.1/admin"));
  assert.throws(() => validateDestinationUrl("http://192.168.1.10/admin"));
  assert.throws(() => validateDestinationUrl("http://service.internal/admin"));
});

test("reconhece crawler de preview do ecossistema Meta", () => {
  assert.equal(isPreviewBot("facebookexternalhit/1.1"), true);
  assert.equal(isPreviewBot("meta-externalagent/1.1"), true);
  assert.equal(isPreviewBot("Mozilla/5.0 Chrome/140"), false);
});

test("mantém a posição escolhida pela narrativa e troca apenas o link", () => {
  const original = "Ela contou tudo. [LINK] E só depois explicou o motivo.";
  assert.equal(replaceNarrativeLink(original, "https://s.shopee.com.br/x", "https://escribaai.duckdns.org/go/a8K2xP"), "Ela contou tudo. https://escribaai.duckdns.org/go/a8K2xP E só depois explicou o motivo.");
});
