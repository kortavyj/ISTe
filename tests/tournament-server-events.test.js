import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyCs2EventSignature, validateCs2Event } from "../server/tournaments/serverEventSecurity.js";

const now=1791681000000;
const secret="a-very-long-secret-used-only-for-testing-purposes";
const body=JSON.stringify({version:1,kind:"test"});
const timestamp=String(now);
function sign(message=body,t=timestamp) {
 return "sha256="+createHmac("sha256",secret).update(t+"."+message).digest("hex");
}
test("valid signed event",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret,now}),true));
test("modified message is rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body+" ",timestamp,signature:sign(),secret,now}),false));
test("expired event rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret,now:now+90_000}),false));
test("missing or weak secret rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:sign(),secret:"short",now}),false));
test("invalid signature rejected",()=>assert.equal(verifyCs2EventSignature({rawBody:body,timestamp,signature:"sha256="+"0".repeat(64),secret,now}),false));
test("CS2 envelope requires event identity and sequence",()=>{
 const event={version:1,eventId:"event-1234567890",serverId:"123e4567-e89b-12d3-a456-426614174000",matchId:"123e4567-e89b-12d3-a456-426614174001",sequence:1,type:"round_end",payload:{scoreA:1,scoreB:0}};
 assert.equal(validateCs2Event(event),true);
 assert.equal(validateCs2Event({...event,sequence:0}),false);
 assert.equal(validateCs2Event({...event,type:"arbitrary-command"}),false);
});

// Verify the owner router refuses unauthenticated tournament requests.
