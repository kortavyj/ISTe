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

test("webhook HTTP returns 400 for interrupted request stream",async()=>{
 const broken=Readable.from((async function*(){yield Buffer.from("{");throw new Error("transport aborted");})());
 broken.method="POST";broken.headers={};
 const res=response();
 await handler(broken,res);
 assert.equal(res.statusCode,400);
 assert.equal(res.payload.error,"INVALID_BODY");
});
test("webhook HTTP accepts exactly maximum raw body bytes and defers to credential guard",async()=>{
 const secret=process.env.ISTE_CS2_WEBHOOK_SECRET;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 try{
  delete process.env.ISTE_CS2_WEBHOOK_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res=response();
  await handler(request([Buffer.alloc(MAX_RAW_BODY_BYTES)]),res);
  assert.equal(res.statusCode,503);
  assert.equal(res.payload.error,"WEBHOOK_NOT_CONFIGURED");
 }finally{
  if(secret===undefined)delete process.env.ISTE_CS2_WEBHOOK_SECRET;
  else process.env.ISTE_CS2_WEBHOOK_SECRET=secret;
  if(key===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY=key;
 }
});
