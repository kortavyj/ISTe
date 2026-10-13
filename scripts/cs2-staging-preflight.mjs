#!/usr/bin/env node
// Read-only preflight for an isolated CS2 beta environment.
// Intentionally refuses the ISTe production project and localhost fallback.
const PROD_REF = "niwgrrprbcgbdaloijhq";
const urlInput = process.env.CS2_STAGING_SUPABASE_URL || "";
const key = process.env.CS2_STAGING_SUPABASE_ANON_KEY || "";
const explicitRef = process.env.CS2_STAGING_PROJECT_REF || "";
const declaredConsent = process.env.CS2_ISOLATED_STAGING === "yes";

function verify({urlInput, key, explicitRef, declaredConsent}) {
  if (!declaredConsent) throw new Error("STAGING_OPT_IN_REQUIRED: set CS2_ISOLATED_STAGING=yes");
  if (!explicitRef || !/^[a-z]{20}$/.test(explicitRef)) throw new Error("STAGING_PROJECT_REF_REQUIRED");
  if (explicitRef === PROD_REF) throw new Error("PRODUCTION_PROJECT_FORBIDDEN");
  const url = new URL(urlInput);
  if (url.protocol !== "https:" || url.username || url.password || url.port || url.pathname !== "/" || url.search || url.hash ||
    url.hostname !== `${explicitRef}.supabase.co`) {
    throw new Error("STAGING_URL_MISMATCH");
  }
  if (key.length < 20) throw new Error("STAGING_ANON_KEY_REQUIRED");
  return url;
}

async function main() {
  const url=verify({urlInput,key,explicitRef,declaredConsent});
  const res=await fetch(new URL("/rest/v1/",url),{
    method:"GET",headers:{apikey:key,Authorization:`Bearer ${key}`},
    signal:AbortSignal.timeout(8000)
  });
  if (!res.ok) throw new Error(`STAGING_API_NOT_READY: HTTP ${res.status}`);
  console.log("CS2 staging isolation check passed. Project:",explicitRef);
  console.log("No migrations, writes, or authenticated test requests were performed.");
}
if (process.argv.includes("--self-test")) {
  const assert=(fn,code)=>{try{fn();throw new Error("Expected failure "+code);}catch(e){if(!String(e.message).includes(code))throw e;}};
  const base={urlInput:"https://abcdefghijklmnopqrst.supabase.co/",key:"test-publishable-key-long",explicitRef:"abcdefghijklmnopqrst",declaredConsent:true};
  verify(base);
  assert(()=>verify({...base,explicitRef:PROD_REF,urlInput:`https://${PROD_REF}.supabase.co/`}),"PRODUCTION_PROJECT_FORBIDDEN");
  assert(()=>verify({...base,urlInput:`https://${PROD_REF}.supabase.co/`}),"STAGING_URL_MISMATCH");
  assert(()=>verify({...base,declaredConsent:false}),"STAGING_OPT_IN_REQUIRED");
  assert(()=>verify({...base,urlInput:"http://abcdefghijklmnopqrst.supabase.co/"}),"STAGING_URL_MISMATCH");
  console.log("Staging guard self-test passed.");
} else main().catch(e=>{console.error(e.message);process.exitCode=1;});
