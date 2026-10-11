import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyCs2EventSignature, validateCs2Event } from "../server/tournaments/serverEventSecurity.js";

const now=1791681000000;
const secret="a-very-long-secret-used-only-for-testing-purposes";
const body=JSON.stringify({version:1,kind:"test"});
const timestamp=String(now);
function sign(message=body,t=timestamp) {
 return "sha256="+createHmac("sha256",secret).update(t+"."+message).digest("hex");
}
test("valid signed event",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret,now}),true));
test("modified message is rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body+" ",timestamp,signature:sign(),secret,now}),false));
test("expired event rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret,now:now+90_000}),false));
test("missing or weak secret rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret:"short",now}),false));
test("invalid signature rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:"sha256="+"0".repeat(64),secret,now}),false));
test("CS2 envelope requires event identity and sequence",()=>{
 const event={version:1,eventId:"event-1234567890",serverId:"123e4567-e89b-12d3-a456-426614174000",matchId:"123e4567-e89b-12d3-a456-426614174001",sequence:1,type:"round_end",payload:{scoreA:1,scoreB:0}};
 assert.equal(validateCs2Event(event),true);
 assert.equal(validateCs2Event({...event,sequence:0}),false);
 assert.equal(validateCs2Event({...event,type:"arbitrary-command"}),false);
});


import ownerHandler from "../api/owner.js";
function ownerResponseMock() {
 const headers=new Map();
 return {statusCode:200,payload:null,setHeader(key,value){headers.set(key.toLowerCase(),value);},getHeader(key){return headers.get(key.toLowerCase());},status(code){this.statusCode=code;return this;},json(value){this.payload=value;return this;}};
}
for (const submodule of ["","teams","matches","action"]) {
 for (const method of ["GET","POST"]) {
  test("anonymous tournament API denied: "+method+" "+(submodule||"root"),async()=>{
   const request={method,headers:{},query:{module:"tournaments",...(submodule?{submodule}:{})}};
   const response=ownerResponseMock();
   await ownerHandler(request,response);
   assert.equal(response.statusCode,401);
   assert.equal(response.payload?.error,"AUTH_REQUIRED");
   assert.equal(response.payload?.ok,false);
   assert.match(response.getHeader("Cache-Control"),/no-store/);
  });
 }
}

import { ownerMfaPassed, ownerRoleDecision } from '../api/lib/ownerRequest.js';
test('owner role decision',()=>{
 assert.equal(ownerRoleDecision({role:'owner',is_blocked:false}),null);
 assert.equal(ownerRoleDecision({role:'user',is_blocked:false}),'OWNER_REQUIRED');
 assert.equal(ownerRoleDecision({role:'owner',is_blocked:true}),'ACCOUNT_BLOCKED');
});

test('owner MFA assurance decisions',()=>{
 assert.equal(ownerMfaPassed({currentLevel:'aal2'},null),true);
 assert.equal(ownerMfaPassed({currentLevel:'aal1'},null),false);
 assert.equal(ownerMfaPassed(null,null),false);
 assert.equal(ownerMfaPassed({currentLevel:'aal2'},new Error('unavailable')),false);
});

import { guardRequest } from "../api/lib/requestGuard.js";

test("tournament mutating requests reject cross-site origin and missing origin",()=>{
 const options={methods:["POST"],requireJson:true,requireOrigin:true,maxBodyBytes:4096};
 const base={method:"POST",headers:{"content-type":"application/json","host":"www.istesport.com"}};
 assert.equal(guardRequest(base,options).error,"ORIGIN_MISSING");
 assert.equal(guardRequest({...base,headers:{...base.headers,origin:"https://evil.example"}},options).error,"ORIGIN_NOT_ALLOWED");
 assert.equal(guardRequest({...base,headers:{...base.headers,origin:"https://www.istesport.com","sec-fetch-site":"cross-site"}},options).error,"CROSS_SITE_REQUEST_BLOCKED");
 assert.equal(guardRequest({...base,headers:{...base.headers,origin:"https://www.istesport.com","content-length":"8192"}},options).error,"REQUEST_TOO_LARGE");
 assert.equal(guardRequest({...base,headers:{...base.headers,origin:"https://www.istesport.com","content-type":"text/plain"}},options).error,"JSON_REQUIRED");
 assert.equal(guardRequest({...base,headers:{...base.headers,origin:"https://www.istesport.com"}},options).ok,true);
});

import { isNextCs2Event } from '../server/tournaments/serverEventSecurity.js';
test('CS2 event sequence rejects repeats, skips and cross-match events',()=>{
 const first={version:1,eventId:'event-1234567890',serverId:'123e4567-e89b-12d3-a456-426614174000',matchId:'123e4567-e89b-12d3-a456-426614174001',sequence:1,type:'round_end',payload:{}};
 assert.equal(isNextCs2Event(null,first),true);
 assert.equal(isNextCs2Event(first,{...first,eventId:'event-1234567891',sequence:2}),true);
 assert.equal(isNextCs2Event(first,first),false);
 assert.equal(isNextCs2Event(first,{...first,eventId:'event-1234567892',sequence:3}),false);
 assert.equal(isNextCs2Event(first,{...first,eventId:'event-1234567893',matchId:'123e4567-e89b-12d3-a456-426614174002',sequence:2}),false);
});

import cs2Ingest from '../server/tournaments/cs2Ingest.js';
test('CS2 webhook refuses missing server configuration',async()=>{
 const oldSecret=process.env.ISTE_CS2_WEBHOOK_SECRET;
 const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 try {
  delete process.env.ISTE_CS2_WEBHOOK_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  const response=ownerResponseMock();
  await cs2Ingest({method:'POST',headers:{},body:'{}'},response);
  assert.equal(response.statusCode,503);
  assert.equal(response.payload.error,'WEBHOOK_NOT_CONFIGURED');
 } finally {
  if(oldSecret===undefined)delete process.env.ISTE_CS2_WEBHOOK_SECRET; else process.env.ISTE_CS2_WEBHOOK_SECRET=oldSecret;
  if(oldKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY; else process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;
 }
});
