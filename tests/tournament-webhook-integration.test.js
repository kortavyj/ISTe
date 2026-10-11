import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { createHmac } from "node:crypto";
import handler from "../api/cs2-ingest.js";

function mockResponse() {
 return {
  statusCode:200, data:null, headers:{},
  setHeader(key,value){this.headers[key]=value;},
  status(code){this.statusCode=code;return this;},
  json(data){this.data=data;return this;}
 };
}
function request(bytes,headers) {
 const req=Readable.from([bytes]);
 req.method="POST";
 req.headers=headers;
 return req;
}
test("signed CS2 event flows through raw HTTP boundary to isolated PostgREST mock",async()=>{
 const received=[];
 const server=createServer(async(req,res)=>{
  const chunks=[];
  for await(const part of req) chunks.push(part);
  received.push({
   path:req.url,auth:req.headers.authorization,
   data:JSON.parse(Buffer.concat(chunks).toString("utf8"))
  });
  res.writeHead(200,{"Content-Type":"application/json"});
  res.end("null");
 });
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const base="http://127.0.0.1:"+server.address().port;
 const keys=["ISTE_CS2_WEBHOOK_SECRET","ISTE_CS2_ALLOWED_SERVER_IDS","SUPABASE_SERVICE_ROLE_KEY","SUPABASE_URL"];
 const previous=keys.map(k=>process.env[k]);
 const secret="integration-ci-only-secret-123456789012345";
 const event={
  version:1,eventId:"test-event-00000001",
  serverId:"123e4567-e89b-12d3-a456-426614174099",
  matchId:"123e4567-e89b-12d3-a456-426614174001",
  sequence:1,type:"map_started",payload:{map:"de_mirage"}
 };
 try{
  process.env.ISTE_CS2_WEBHOOK_SECRET=secret;
  process.env.ISTE_CS2_ALLOWED_SERVER_IDS=event.serverId;
  process.env.SUPABASE_SERVICE_ROLE_KEY="integration-ci-fake-service-role";
  process.env.SUPABASE_URL=base;
  const bytes=Buffer.from(JSON.stringify(event));
  const timestamp=String(Date.now());
  const signature="sha256="+createHmac("sha256",secret).update(timestamp+".").update(bytes).digest("hex");
  const response=mockResponse();
  await handler(request(bytes,{"x-iste-timestamp":timestamp,"x-iste-signature":signature}),response);
  assert.equal(response.statusCode,202);
  assert.equal(response.data.ok,true);
  assert.equal(received.length,1);
  assert.equal(received[0].path,"/rest/v1/rpc/iste_ingest_cs2_event");
  assert.equal(received[0].data.p_match_id,event.matchId);
  assert.equal(received[0].data.p_server_id,event.serverId);
  assert.equal(received[0].data.p_sequence,1);
  assert.equal(received[0].auth,"Bearer integration-ci-fake-service-role");
  const bad=mockResponse();
  await handler(request(bytes,{"x-iste-timestamp":timestamp,"x-iste-signature":"sha256"+"0".repeat(64)}),bad);
  assert.equal(bad.statusCode,401);
  assert.equal(received.length,1);
 } finally {
  keys.forEach((k,i)=>{if(previous[i]===undefined)delete process.env[k];else process.env[k]=previous[i];});
  await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
 }
});
