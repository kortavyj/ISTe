import test from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import handler from "../api/cs2-ingest.js";
import { MAX_RAW_BODY_BYTES } from "../server/tournaments/serverEventSecurity.js";
function response() {return {statusCode:200, payload:null, headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(v){this.payload=v;return this;}};}
function request(parts,method="POST"){
 const stream=Readable.from(parts);
 stream.method=method;
 stream.headers={};
 return stream;
}
test("webhook HTTP rejects body larger than limit before checking credentials",async()=>{
 const res=response();
 await handler(request([Buffer.alloc(MAX_RAW_BODY_BYTES),Buffer.from("x")]),res);
 assert.equal(res.statusCode,413);
 assert.equal(res.payload.error,"REQUEST_TOO_LARGE");
});
test("webhook HTTP rejects unsupported methods before reading body",async()=>{
 const res=response();
 await handler(request([],"GET"),res);
 assert.equal(res.statusCode,405);
 assert.equal(res.payload.error,"METHOD_NOT_ALLOWED");
});
test("webhook HTTP keeps credential-less ingestion fail closed",async()=>{
 const before=process.env.ISTE_CS2_WEBHOOK_SECRET;
 try {
  delete process.env.ISTE_CS2_WEBHOOK_SECRET;
  const res=response();
  await handler(request([Buffer.from("{}")]),res);
  assert.equal(res.statusCode,503);
  assert.equal(res.payload.error,"WEBHOOK_NOT_CONFIGURED");
 } finally {
  if(before===undefined)delete process.env.ISTE_CS2_WEBHOOK_SECRET;
  else process.env.ISTE_CS2_WEBHOOK_SECRET=before;
 }
});
