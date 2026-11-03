import assert from "node:assert/strict";

let deprecatedUrlWarnings = 0;
process.on("warning", warning => {
  if (warning.code === "DEP0169") {
    deprecatedUrlWarnings += 1;
    // NODE_OPTIONS=--trace-deprecation also prints the full origin stack.
    console.error("Owner route triggered DEP0169:", warning.stack);
  }
});

// Dynamic import lets the warning listener capture module initialization.
const { default: ownerHandler } = await import("../api/owner.js");

const response = {
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(name, value) { this.headers[name.toLowerCase()] = value; return this; },
  getHeader(name) { return this.headers[name.toLowerCase()]; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
};

await ownerHandler({
  method: "GET",
  query: { action: "users" },
  headers: {},
}, response);

assert.equal(response.statusCode, 401);
assert.equal(response.body?.error, "AUTH_REQUIRED");
await new Promise(resolve => setImmediate(resolve));

console.log("Unauthenticated owner API returns 401 as expected.");
console.log(`DEP0169 warnings from direct in-process handler execution: ${deprecatedUrlWarnings}`);
console.log("Note: Vercel's request adapter is not part of this diagnostic run.");
