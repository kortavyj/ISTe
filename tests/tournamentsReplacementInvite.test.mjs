import assert from "node:assert/strict";
import test from "node:test";
import {createReplacementInviteHandler} from "../server/tournamentRoutes/tournaments-replacement-invite.js";
const teamId="30000000-0000-4000-8000-000000000003";
const userId="10000000-0000-4000-8000-000000000012";
function request(body={teamId,userId},cookie="iste_access=stub; iste_refresh=stub"){return {method:"POST",headers:{host:"www.istesport.com",origin:"https://www.istesport.com","content-type":"application/json",cookie},body};}
function response(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},getHeader(k){return this.headers[k];},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};}
function create({writes=true,error=null}={}){const calls=[];const client={auth:{setSession:async()=>({data:{session:{access_token:"stub",refresh_token:"stub"},user:{id:"10000000-0000-4000-8000-000000000010"}},error:null})},rpc:async(n,a)=>{calls.push({n,a});return {data:{memberId:"40000000-0000-4000-8000-000000000040"},error};}};return {calls,handler:createReplacementInviteHandler({getClient:()=>client,writesEnabled:()=>writes})};}
test("reject anonymous replacement",async()=>{const {handler,calls}=create(),out=response();await handler(request({teamId,userId},""),out);assert.equal(out.statusCode,401);assert.equal(calls.length,0);});
test("reject invalid replacement request",async()=>{const {handler,calls}=create(),out=response();await handler(request({teamId,userId:"invalid"}),out);assert.equal(out.statusCode,400);assert.equal(calls.length,0);});
test("respect global write flag",async()=>{const {handler,calls}=create({writes:false}),out=response();await handler(request(),out);assert.equal(out.statusCode,503);assert.equal(calls.length,0);});
test("authenticated player invokes identity-scoped RPC",async()=>{const {handler,calls}=create(),out=response();await handler(request(),out);assert.equal(out.statusCode,201);assert.deepEqual(calls,[{n:"iste_v2_invite_replacement",a:{p_team_id:teamId,p_user_id:userId}}]);});
test("hide database error details",async()=>{const {handler}=create({error:{code:"22023",message:"private SQL"}}),out=response();await handler(request(),out);assert.equal(out.statusCode,409);assert.deepEqual(out.body,{ok:false,error:"REPLACEMENT_REJECTED"});});
