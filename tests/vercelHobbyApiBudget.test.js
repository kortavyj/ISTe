import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import test from "node:test";

const oldToRoute = {
  "tournaments-owner":"owner",
  "tournaments-match-confirm":"match-confirm",
  "tournaments-team-apply":"team-apply",
  "tournaments-team-review":"team-review",
  "tournaments-team-list":"team-list",
  "tournaments-bracket-generate":"bracket-generate",
  "tournaments-bracket":"bracket",
  "tournaments-status-transition":"status-transition",
};
test("Vercel Hobby has at most twelve JS serverless functions",()=>{
  const root=readdirSync("api",{withFileTypes:true}).filter(f=>f.isFile()&&f.name.endsWith(".js")).length;
  const nested=readdirSync("api",{withFileTypes:true}).filter(f=>f.isDirectory())
    .reduce((sum,d)=>sum+readdirSync("api/"+d.name).filter(f=>f.endsWith(".js")).length,0);
  assert.ok(root+nested<=12,`Hobby limit exceeded: ${root+nested}`);
  assert.equal(root+nested,8);
});
test("every original tournament endpoint is preserved by rewrite",()=>{
  const config=JSON.parse(readFileSync("vercel.json","utf8"));
  const rewrites=new Map(config.rewrites.map(x=>[x.source,x.destination]));
  for(const [name,route] of Object.entries(oldToRoute)){
    assert.equal(rewrites.get("/api/"+name),"/api/tournaments?route="+route);
    assert.ok(existsSync("server/tournamentRoutes/"+name+".js"));
    assert.equal(existsSync("api/"+name+".js"),false);
  }
});
