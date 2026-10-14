import test from "node:test";
import assert from "node:assert/strict";
import confirm from "../server/tournamentRoutes/tournaments-match-confirm.js";
import review from "../server/tournamentRoutes/tournaments-team-review.js";

const handlers=[["Match confirmation",confirm],["Team approval",review]];
function response(){
 const headers={};
 return {headers,statusCode:200,body:null,
  setHeader(k,v){headers[k]=v;return this;},
  getHeader(k){return headers[k];},
  status(code){this.statusCode=code;return this;},
  json(value){this.body=value;return this;}};
}
function request(method="POST",extra={}){
 return {method,headers:{"content-type":"application/json",origin:"https://www.istesport.com",host:"www.istesport.com","sec-fetch-site":"same-origin",...extra},body:{}};
}
for(const [name,handler] of handlers){
 test(name+" rejects GET without reaching database",async()=>{
  const res=response();await handler(request("GET"),res);
  assert.equal(res.statusCode,405);assert.equal(res.body?.error,"METHOD_NOT_ALLOWED");
  assert.equal(res.headers.Allow,"POST");
 });
 test(name+" rejects missing JSON content type",async()=>{
  const res=response();await handler(request("POST",{"content-type":"text/plain"}),res);
  assert.equal(res.statusCode,415);assert.equal(res.body?.error,"JSON_REQUIRED");
 });
 test(name+" blocks cross-origin requests before authentication",async()=>{
  const res=response();await handler(request("POST",{origin:"https://evil.example",host:"www.istesport.com"}),res);
  assert.equal(res.statusCode,403);assert.equal(res.body?.error,"ORIGIN_NOT_ALLOWED");
 });
 test(name+" refuses requests with no origin",async()=>{
  const req=request();delete req.headers.origin;
  const res=response();await handler(req,res);
  assert.equal(res.statusCode,403);assert.equal(res.body?.error,"ORIGIN_MISSING");
 });
 test(name+" requires authenticated owner even when requested payload is valid",async()=>{
  const res=response();await handler(request(),res);
  assert.equal(res.statusCode,401);assert.equal(res.body?.error,"AUTH_REQUIRED");
 });
 test(name+" rejects oversized payloads before authentication",async()=>{
  const res=response();await handler(request("POST",{"content-length":"999999"}),res);
  assert.equal(res.statusCode,413);assert.equal(res.body?.error,"REQUEST_TOO_LARGE");
 });
}
