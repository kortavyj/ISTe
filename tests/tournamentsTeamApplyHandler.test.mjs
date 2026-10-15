import assert from "node:assert/strict";
import test from "node:test";
import { createTeamApplyHandler } from "../server/tournamentRoutes/tournaments-team-apply.js";

const captain="10000000-0000-4000-8000-000000000001";
const tournamentId="20000000-0000-4000-8000-000000000001";
const members=Array.from({length:5},(_,i)=>({userId:`10000000-0000-4000-8000-${String(i+1).padStart(12,"0")}`}));
function request(roster=members) {
 return {method:"POST",headers:{host:"www.istesport.com",origin:"https://www.istesport.com","content-type":"application/json",cookie:"iste_access=test; iste_refresh=test"},body:{tournamentId,name:"Alpha",members:roster}};
}
function response() {return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},getHeader(k){return this.headers[k];},status(n){this.statusCode=n;return this;},json(v){this.body=v;return this;}};}
function fixture(){
 const rpcCalls=[];
 const client={
  auth:{setSession:async()=>({data:{user:{id:captain},session:{access_token:"test",refresh_token:"test"}},error:null})},
  from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{is_blocked:false},error:null})})})}),
  rpc:async(name,args)=>{rpcCalls.push({name,args});return {data:{id:"30000000-0000-4000-8000-000000000001"},error:null};}
 };
 return {rpcCalls,handler:createTeamApplyHandler({getClient:()=>client,writesEnabled:()=>true})};
}
test("captain application uses account-only roster and authenticated captain",async()=>{
 const {handler,rpcCalls}=fixture(),out=response();
 await handler(request(),out);
 assert.equal(out.statusCode,201,JSON.stringify(out.body));
 assert.equal(rpcCalls.length,1);
 assert.equal(rpcCalls[0].name,"iste_apply_tournament_team");
 assert.equal(rpcCalls[0].args.p_application.members.length,5);
 assert.ok(rpcCalls[0].args.p_application.members.every(x=>x.userId));
});
test("FACEIT-only applicant is rejected before database mutation",async()=>{
 const {handler,rpcCalls}=fixture(),out=response();
 await handler(request([members[0],{faceitPlayerId:"faceit123"},...members.slice(2)]),out);
 assert.equal(out.statusCode,400,JSON.stringify(out.body));
 assert.equal(out.body.error,"ROSTER_ACCOUNT_REQUIRED");
 assert.equal(rpcCalls.length,0);
});
