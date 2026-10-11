import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, access } from "node:fs/promises";
import { join, dirname, resolve, extname } from "node:path";
const ROOT=process.cwd();
async function listJs(dir){
 const out=[];
 for(const ent of await readdir(dir,{withFileTypes:true})){
  const p=join(dir,ent.name);
  if(ent.isDirectory()) out.push(...await listJs(p));
  else if(ent.isFile() && ent.name.endsWith(".js")) out.push(p);
 }
 return out;
}
test("Hobby deployment keeps API JavaScript entry count at or below 12",async()=>{
 const files=await listJs(join(ROOT,"api"));
 assert.ok(files.length<=12,"Vercel Hobby allows 12 functions; found "+files.length+": "+files.map(x=>x.slice(ROOT.length+1)).join(", "));
});
test("server and API relative JavaScript imports resolve to real files",async()=>{
 for(const file of [...await listJs(join(ROOT,"api")),...await listJs(join(ROOT,"server"))]){
  const source=await readFile(file,"utf8");
  // Covers static imports, reexports and literal dynamic imports (not computed expressions).
  const regex=/(?:\\bfrom\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s*)["'](\\.[^"']+)["']/g;
  for(const match of source.matchAll(regex)){
   const target=resolve(dirname(file),match[1]);
   if(extname(target)!==".js")continue;
   await assert.doesNotReject(access(target),file.slice(ROOT.length+1)+" imports missing "+match[1]);
  }
 }
});
