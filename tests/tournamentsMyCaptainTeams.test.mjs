import assert from "node:assert/strict";
import test from "node:test";
import {createMyCaptainTeamsHandler} from "../server/tournamentRoutes/tournaments-my-captain-teams.js";
function req(cookie="iste_access=test; iste_refresh=test"){return {method:"GET",headers:{host:"www.istesport.com",cookie}};}
function res(){return {statusCode:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},getHeader(k){return this.headers[k];},status(v){this.statusCode=v;return this;},json(v){this.body=v;return this;}};}
function fixture(error=null){const calls=[];const client={
 auth:{setSession:async()=>({data:{session:{access_token:"test",refresh_token:"test"},user:{id:"10000000-0000-4000-8000-000000000010"}},error:null})},
 rpc:async(name)=>{calls.push(name);return {data:[{team_id:"30000000-0000-4000-8000-000000000003",team_name:"Alpha",member_count:4}],error};}
};return {calls,handler:createMyCaptainTeamsHandler({getClient:()=>client})};}
test("anonymous user cannot read captain teams",async()=>{const {calls,handler}=fixture(),out=res();await handler(req(""),out);assert.equal(out.statusCode,401);assert.equal(calls.length,0);});
test("authenticated captain reads only identity-scoped RPC",async()=>{const {calls,handler}=fixture(),out=res();await handler(req(),out);assert.equal(out.statusCode,200);assert.deepEqual(calls,["iste_v2_my_pending_captain_teams"]);assert.equal(out.body.teams.length,1);});
test("hidden database errors are not disclosed",async()=>{const {handler}=fixture({code:"22023",message:"private schema details"}),out=res();await handler(req(),out);assert.equal(out.statusCode,502);assert.deepEqual(out.body,{ok:false,error:"CAPTAIN_TEAMS_UNAVAILABLE"});});
test("missing RPC fails closed",async()=>{const {handler}=fixture({code:"PGRST202",message:"not installed"}),out=res();await handler(req(),out);assert.equal(out.statusCode,503);assert.equal(out.body.error,"CAPTAIN_TEAMS_NOT_READY");});
