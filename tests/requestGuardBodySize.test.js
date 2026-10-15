import assert from "node:assert/strict";
import { test } from "node:test";
import { guardRequest } from "../server/apiLib/requestGuard.js";

function request(body, headers = {}) {
  return {
    method: "POST",
    body,
    headers: { "content-type": "application/json", ...headers },
  };
}

const options = { requireOrigin: false, maxBodyBytes: 64 };

test("accepts small parsed JSON requests", () => {
  assert.equal(guardRequest(request({ value: "ok" }), options).ok, true);
});

test("rejects oversized parsed bodies despite a misleading Content-Length", () => {
  const result = guardRequest(request({ value: "x".repeat(200) }, { "content-length": "2" }), options);
  assert.equal(result.status, 413);
  assert.equal(result.error, "REQUEST_TOO_LARGE");
});

test("rejects oversized string and Buffer bodies with no Content-Length", () => {
  for (const body of ["x".repeat(200), Buffer.alloc(200)]) {
    assert.equal(guardRequest(request(body), options).status, 413);
  }
});

test("rejects JSON body that cannot be serialized safely", () => {
  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(guardRequest(request(cyclic), options).status, 400);
});

test("still enforces declared Content-Length", () => {
  assert.equal(guardRequest(request({}, { "content-length": "1000" }), options).status, 413);
});

test("rejects missing origin on browser-facing POST APIs", () => {
  const result = guardRequest(request({ message: "help" }), {
    methods: ["POST"], requireJson: true, requireOrigin: true,
  });
  assert.equal(result.status, 403);
  assert.equal(result.error, "ORIGIN_MISSING");
});

test("rejects cross-origin support requests", () => {
  const result = guardRequest(request({ message: "help" }, {
    origin: "https://untrusted.example",
    host: "www.istesport.com",
    "sec-fetch-site": "cross-site",
  }), { methods: ["POST"], requireJson: true, requireOrigin: true });
  assert.equal(result.status, 403);
  assert.equal(result.error, "ORIGIN_NOT_ALLOWED");
});

test("accepts same-origin JSON requests", () => {
  const result = guardRequest(request({ message: "help" }, {
    origin: "https://www.istesport.com",
    host: "www.istesport.com",
    "sec-fetch-site": "same-origin",
  }), { methods: ["POST"], requireJson: true, requireOrigin: true });
  assert.equal(result.ok, true);
});

test("malformed Origin cannot be replaced by trusted Referer", () => {
  const result = guardRequest(request({ message: "help" }, {
    origin: "null",
    referer: "https://www.istesport.com/support",
    host: "www.istesport.com",
    "sec-fetch-site": "same-origin",
  }), { requireOrigin: true });
  assert.equal(result.status, 403);
  assert.equal(result.error, "ORIGIN_MISSING");
});

test("valid Origin takes precedence over conflicting Referer", () => {
  const result = guardRequest(request({ message: "help" }, {
    origin: "https://evil.example",
    referer: "https://www.istesport.com/support",
    host: "www.istesport.com",
    "sec-fetch-site": "same-origin",
  }), { requireOrigin: true });
  assert.equal(result.status, 403);
  assert.equal(result.error, "ORIGIN_NOT_ALLOWED");
});

test("rejects deceptive application/json suffixes", () => {
  for (const type of ["application/jsonp", "application/json-extra", "application/json2"]) {
    const result = guardRequest(request({ok: true}, {"content-type": type}), options);
    assert.equal(result.status, 415, type);
  }
});

test("accepts standard JSON media type with charset", () => {
  const result = guardRequest(request({ok: true}, {
    "content-type": "application/json; charset=utf-8",
  }), options);
  assert.equal(result.ok, true);
});
