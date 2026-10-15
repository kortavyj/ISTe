import assert from "node:assert/strict";
import test from "node:test";
import invitationHandler from "../server/tournamentRoutes/tournaments-my-invitations.js";
import responseHandler from "../server/tournamentRoutes/tournaments-roster-response.js";

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
