import assert from "node:assert/strict";
import test from "node:test";
import invitationHandler, { createMyInvitationsHandler } from "../server/tournamentRoutes/tournaments-my-invitations.js";
import responseHandler, { createRosterResponseHandler } from "../server/tournamentRoutes/tournaments-roster-response.js";

function res() { return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},getHeader(k){return this.headers[k];},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}}; }
function req(method,body) { return {method,headers:{"content-type":"application/json",origin:"https://www.istesport.com",host:"www.istesport.com"},body,query:{}}; }
const memberId="40000000-0000-4000-8000-000000000001";

test("anonymous invitation read denies access",async()=>{
 const result=res();
 await invitationHandler(req("GET"),result);
 assert.equal(result.statusCode,401);
 assert.equal(result.body.error,"AUTH_REQUIRED");
 assert.equal(result.headers["Cache-Control"],"no-store, private");
});
test("anonymous decision denies access",async()=>{
 const result=res();
 await responseHandler(req("POST",{memberId,accept:true}),result);
 assert.equal(result.statusCode,401);
 assert.equal(result.body.error,"AUTH_REQUIRED");
});
test("decision rejects malformed identifiers and invalid accept types",async()=>{
 for(const body of [{memberId:"not-a-uuid",accept:true},{memberId,accept:"true"},{memberId,accept:true,admin:true}]){
   const result=res();
   await responseHandler(req("POST",body),result);
   assert.equal(result.statusCode,400,JSON.stringify(result.body));
   assert.equal(result.body.error,"INVALID_REQUEST");
 }
});
test("decision refuses GET and does not silently mutate",async()=>{
 const result=res();
 await responseHandler(req("GET"),result);
 assert.equal(result.statusCode,405);
});

function authed(error = null, writes = true) {
 const calls = [];
 const supabase = {
   auth: { setSession: async () => ({data: {session: {access_token:"stub",refresh_token:"stub"},user:{id:"10000000-0000-4000-8000-000000000001"}},error:null}) },
   rpc: async (name,args) => {calls.push({name,args});return {data:{accepted:true},error};},
 };
 return {calls,handler:createRosterResponseHandler({getClient:()=>supabase,writesEnabled:()=>writes})};
}
function sessionRequest(accept=true) {
 const r=req("POST",{memberId,accept});
 r.headers.cookie="iste_access=fake; iste_refresh=fake";
 return r;
}
test("authenticated responses still respect disabled writes",async()=>{
 const {handler,calls}=authed(null,false),result=res();
 await handler(sessionRequest(),result);
 assert.equal(result.statusCode,503);
 assert.equal(result.body.error,"TOURNAMENT_WRITES_DISABLED");
 assert.equal(calls.length,0);
});
test("authenticated roster acceptance invokes user-scoped RPC",async()=>{
 const {handler,calls}=authed(),result=res();
 await handler(sessionRequest(),result);
 assert.equal(result.statusCode,200);
 assert.equal(result.body.ok,true);
 assert.deepEqual(calls,[{name:"iste_v2_respond_roster_membership",args:{p_member_id:memberId,p_accept:true}}]);
});
test("database errors do not disclose SQL details",async()=>{
 const {handler}=authed({code:"22023",message:"private sql internals"}),result=res();
 await handler(sessionRequest(false),result);
 assert.equal(result.statusCode,409);
 assert.deepEqual(result.body,{ok:false,error:"ROSTER_RESPONSE_REJECTED"});
});

function invited(error = null, data = []) {
 const calls = [];
 const supabase = {
   auth: {setSession: async () => ({data:{session:{access_token:"stub",refresh_token:"stub"},user:{id:"10000000-0000-4000-8000-000000000001"}},error:null})},
   rpc: async (name) => { calls.push(name); return {data,error}; },
 };
 return {calls,handler:createMyInvitationsHandler({getClient:()=>supabase})};
}
function invitationSessionRequest() {
 const request=req("GET");
 request.headers.cookie="iste_access=fake; iste_refresh=fake";
 return request;
}
test("authenticated player gets only own invitation RPC result",async()=>{
 const rows=[{member_id:memberId,team_name:"Alpha",tournament_title:"Test Cup"}];
 const {handler,calls}=invited(null,rows),result=res();
 await handler(invitationSessionRequest(),result);
 assert.equal(result.statusCode,200);
 assert.deepEqual(result.body,{ok:true,invitations:rows});
 assert.deepEqual(calls,["iste_v2_my_roster_invitations"]);
});
test("invitation SQL errors remain private",async()=>{
 const {handler}=invited({code:"22023",message:"internal private information"}),result=res();
 await handler(invitationSessionRequest(),result);
 assert.equal(result.statusCode,502);
 assert.deepEqual(result.body,{ok:false,error:"INVITATIONS_UNAVAILABLE"});
});
