import test from "node:test";
import assert from "node:assert/strict";
import { currentUser } from "../server/tournaments/teams.js";

const id="123e4567-e89b-12d3-a456-426614174000";
function request(authenticated=true){
 return {headers:{cookie:authenticated?"__Host-iste_access=test-access; __Host-iste_refresh=test-refresh":""}};
}
function response(){return {setHeader(){},getHeader(){return undefined;}};}
function fakeClient({blocked=false,expired=false,role="player"}={}){
 let calls=0;
 return {auth:{async setSession(){calls++;return expired?{data:null,error:new Error("expired")}:
  {data:{user:{id},session:{access_token:"test-access",refresh_token:"test-refresh"}},error:null};}},
  from(table){assert.equal(table,"user_roles");return {
   select(){return this;},eq(){return this;},
   async maybeSingle(){return {data:{role,is_blocked:blocked},error:null};}
  };},
  get calls(){return calls;}
 };
}
test("roster request without cookies is unauthenticated",async()=>{
 const fake=fakeClient();
 assert.equal(await currentUser(request(false),response(),fake),null);
 assert.equal(fake.calls,0);
});
test("roster session is recovered for active player",async()=>{
 const fake=fakeClient();
 const user=await currentUser(request(),response(),fake);
 assert.equal(user?.id,id);
 assert.equal(user?.isOwner,false);
 assert.equal(fake.calls,1);
});
test("blocked roster requester is rejected",async()=>{
 assert.equal(await currentUser(request(),response(),fakeClient({blocked:true})),null);
});
test("expired roster cookie is rejected",async()=>{
 assert.equal(await currentUser(request(),response(),fakeClient({expired:true})),null);
});
