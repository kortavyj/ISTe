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
