import test from "node:test";
import assert from "node:assert/strict";
import { createTeamReviewHandler } from "../server/tournamentRoutes/tournaments-team-review.js";

const teamId="12345678-1234-4234-8234-123456789abc";
const body=(overrides={})=>({teamId,expectedStatus:"pending",decision:"approve",...overrides});
const request=(data)=>({method:"POST",headers:{"content-type":"application/json",origin:"https://www.istesport.com",host:"www.istesport.com","sec-fetch-site":"same-origin"},body:data});
function response(){const headers={};return {statusCode:200,body:null,setHeader(k,v){headers[k]=v;return this;},getHeader(k){return headers[k];},status(s){this.statusCode=s;return this;},json(value){this.body=value;return this;}};}
function handler({authorized=true,enabled=true,rpc=async()=>({data:{status:"approved"},error:null}),code="MFA_REQUIRED"}={}){
 return createTeamReviewHandler({authorize:async()=>authorized?{ok:true,supabase:{rpc}}:{ok:false,status:403,error:code,message:"Access denied"},writesEnabled:()=>enabled});
}
async function run(h,b=body()){const res=response();await h(request(b),res);return res;}
test("MFA denial never invokes database RPC",async()=>{
 let calls=0;const res=await run(handler({authorized:false,rpc:async()=>{calls++;return {};}}));
 assert.equal(res.statusCode,403);assert.equal(res.body.error,"MFA_REQUIRED");assert.equal(calls,0);
});
test("writes disabled blocks review before RPC",async()=>{
 let calls=0;const res=await run(handler({enabled:false,rpc:async()=>{calls++;return {};}}));
 assert.equal(res.statusCode,503);assert.equal(res.body.error,"TOURNAMENT_WRITES_DISABLED");assert.equal(calls,0);
});
test("missing owner is denied before RPC",async()=>{
 let calls=0;const res=await run(handler({authorized:false,code:"OWNER_REQUIRED",rpc:async()=>{calls++;return {};}}));
 assert.equal(res.statusCode,403);assert.equal(res.body.error,"OWNER_REQUIRED");assert.equal(calls,0);
});
test("wrong status, decision, ID and extra fields are rejected",async()=>{
 let calls=0;const h=handler({rpc:async()=>{calls++;return {};}});
 for(const invalid of [{expectedStatus:"approved"},{decision:"withdraw"},{teamId:"not-a-uuid"},{role:"owner"},{decision:"APPROVE"}]){
  const res=await run(h,body(invalid));assert.equal(res.statusCode,400);assert.equal(res.body.error,"INVALID_REVIEW_REQUEST");
 }
 assert.equal(calls,0);
});
test("database rejects repeated or conflicting decision",async()=>{
 const res=await run(handler({rpc:async()=>({data:null,error:{code:"P0001",message:"STATUS_CONFLICT"}})}));
 assert.equal(res.statusCode,409);assert.equal(res.body.error,"TEAM_REVIEW_REJECTED");
});
test("missing SQL function is reported without success",async()=>{
 const res=await run(handler({rpc:async()=>({data:null,error:{code:"PGRST202"}})}));
 assert.equal(res.statusCode,503);assert.equal(res.body.error,"TEAM_REVIEW_RPC_NOT_INSTALLED");
});
test("valid decision sends only expected status and team identity to RPC",async()=>{
 let calls=0;const res=await run(handler({rpc:async(name,args)=>{
  calls++;assert.equal(name,"iste_owner_review_team");assert.deepEqual(args,{p_team_id:teamId,p_expected_status:"pending",p_decision:"approve"});
  return {data:{status:"approved"},error:null};
 }}));
 assert.equal(res.statusCode,200);assert.equal(calls,1);assert.equal(res.body.review.status,"approved");
});
