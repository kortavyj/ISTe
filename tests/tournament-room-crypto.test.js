import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encryptRoomPassword, decryptRoomPassword } from "../server/tournaments/roomCrypto.js";

test("server password is encrypted with randomized AES-GCM and roundtrips", () => {
 const previous=process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY;
 try {
  process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY=randomBytes(32).toString("base64");
  const a=encryptRoomPassword("secure cs2 pass");
  const b=encryptRoomPassword("secure cs2 pass");
  assert.match(a,/^enc1:/);assert.notEqual(a,b);
  assert.equal(decryptRoomPassword(a),"secure cs2 pass");
  assert.equal(decryptRoomPassword(""),"");
  assert.throws(()=>decryptRoomPassword("plaintext"),/UNENCRYPTED_ROOM_PASSWORD/);
  const malformed=a.slice(0,-2)+"AA";
  assert.throws(()=>decryptRoomPassword(malformed));
 } finally {
  if(previous===undefined)delete process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY;
  else process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY=previous;
 }
});
test("missing key fails closed for nonempty credentials",()=>{
 const previous=process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY;
 try {
  delete process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY;
  assert.throws(()=>encryptRoomPassword("password"),/ROOM_ENCRYPTION_KEY_UNAVAILABLE/);
  assert.throws(()=>decryptRoomPassword("enc1:AA=="));
 } finally {
  if(previous===undefined)delete process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY;
  else process.env.ISTE_CS2_ROOM_ENCRYPTION_KEY=previous;
 }
});
