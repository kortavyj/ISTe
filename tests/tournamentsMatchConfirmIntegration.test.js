import test from "node:test";
import assert from "node:assert/strict";
import { createMatchConfirmationHandler } from "../server/tournamentRoutes/tournaments-match-confirm.js";

const uuid="12345678-1234-4234-8234-123456789abc";
const mirage={name:"Mirage",scoreA:13,scoreB:8};
const request=(body)=>({method:"POST",headers:{"content-type":"application/json",origin:"https://www.istesport.com",host:"www.istesport.com","sec-fetch-site":"same-origin"},body});
function response(){const headers={};return {statusCode:200,body:null,setHeader(k,v){headers[k]=v;return this;},getHeader(k){return headers[k];},status(s){this.statusCode=s;return this;},json(value){this.body=value;return this;}};}
const body=(overrides={})=>({matchId:uuid,expectedVersion:1,result:{bestOf:1,maps:[mirage]},...overrides});
function handler({authorized=true,enabled=true,rpc=async()=>({data:{id:uuid,version:2},error:null}),code="MFA_REQUIRED"}={}){
 return createMatchConfirmationHandler({authorize:async()=>authorized?{ok:true,supabase:{rpc}}:{ok:false,status:403,error:code,message:"Access denied"},writesEnabled:()=>enabled});
}
async function run(h,b=body()){const res=response();await h(request(b),res);return res;}
test("AAL1 / missing MFA cannot reach RPC",async()=>{
 let calls=0;const res=await run(handler({authorized:false,rpc:async()=>{calls++;return {};}}));assert.equal(res.statusCode,403);assert.equal(res.body.error,"MFA_REQUIRED");assert.equal(calls,0);
});
test("disabled server writes fail closed before RPC",async()=>{
 let calls=0;const res=await run(handler({enabled:false,rpc:async()=>{calls++;return {};}}));assert.equal(res.statusCode,503);assert.equal(res.body.error,"TOURNAMENT_WRITES_DISABLED");assert.equal(calls,0);
});
test("invalid or stale version payloads rejected before RPC",async()=>{
 let calls=0;const h=handler({rpc:async()=>{calls++;return {};}});
 for(const expectedVersion of [-1,1.2,"1",null,Number.MAX_SAFE_INTEGER+1]){
  const res=await run(h,body({expectedVersion}));assert.equal(res.statusCode,400);assert.equal(res.body.error,"INVALID_CONFIRMATION_REQUEST");
 }
 assert.equal(calls,0);
});
test("duplicate maps, tied scores and client-supplied winner rejected",async()=>{
 let calls=0;const h=handler({rpc:async()=>{calls++;return {};}});
 const attempts=[{bestOf:3,maps:[mirage,mirage]},{bestOf:1,maps:[{...mirage,scoreB:13}]},{bestOf:1,maps:[mirage],winner:"B"}];
 for(const result of attempts){const res=await run(h,body({result}));assert.equal(res.statusCode,400);}
 assert.equal(calls,0);
});
test("stale version conflict from database never reports success",async()=>{
 const res=await run(handler({rpc:async()=>({data:null,error:{code:"P0001",message:"STALE_VERSION"}})}));
 assert.equal(res.statusCode,409);assert.equal(res.body.error,"MATCH_CONFIRM_REJECTED");
});
test("absent RPC responds 503",async()=>{
 const res=await run(handler({rpc:async()=>({data:null,error:{code:"PGRST202"}})}));
 assert.equal(res.statusCode,503);assert.equal(res.body.error,"MATCH_CONFIRM_RPC_NOT_INSTALLED");
});
test("valid BO1 forwards only validated maps and expected version",async()=>{
 let called=0;const res=await run(handler({rpc:async(name,args)=>{called++;assert.equal(name,"iste_owner_confirm_match");assert.equal(args.p_expected_version,1);assert.equal(args.p_match_id,uuid);assert.deepEqual(args.p_result,{bestOf:1,maps:[{index:1,...mirage}]});return {data:{version:2},error:null};}}));
 assert.equal(res.statusCode,200);assert.equal(called,1);
});
