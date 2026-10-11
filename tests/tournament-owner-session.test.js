import test from "node:test";
import assert from "node:assert/strict";
import {authenticatedUser} from "../server/tournaments/matches.js";

const id="123e4567-e89b-12d3-a456-426614174000";
function fakeSupabase({session=true,role="owner",blocked=false,aal="aal2",authError=false,mfaError=false}={}){
 let checked=0;
 const api={
  auth:{
   async setSession(){return authError||!session?{error:new Error("expired"),data:null}:{error:null,data:{user:{id},session:{access_token:"test-access",refresh_token:"test-refresh"}}};},
   mfa:{async getAuthenticatorAssuranceLevel(){checked++;return {data:{currentLevel:aal},error:mfaError?new Error("unavailable"):null};}}
  },
  from(){return {select(){return this;},eq(){return this;},async maybeSingle(){return {data:{role,is_blocked:blocked},error:null};}};}
 };
 return {api,get checks(){return checked;}};
}
function request(){return {headers:{cookie:"__Host-iste_access=test-access; __Host-iste_refresh=test-refresh"}};}
function response(){return {setHeader(){},getHeader(){return null;}};}
for(const [name,options,allowed] of [
 ["valid owner session with MFA",{},true],
 ["expired session",{authError:true},false],
 ["non-owner",{role:"user"},false],
 ["blocked owner",{blocked:true},false],
 ["owner without MFA",{aal:"aal1"},false],
 ["MFA provider error",{mfaError:true},false],
]){
 test("owner guard "+name,async()=>{
  const fake=fakeSupabase(options);
  const value=await authenticatedUser(request(),response(),fake.api);
  assert.equal(Boolean(value),allowed);
 });
}
