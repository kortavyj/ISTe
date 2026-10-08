import { randomUUID } from "node:crypto";
import { getSupabaseAdminClient } from "./supabaseAdmin.js";
const BUCKET="iste-extension-wallpapers";
const TYPES={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm"};
const MAX=100*1024*1024;
const respond=(res,status,data)=>res.status(status).json(data);
export async function handleExtensionMedia(req,res,payload,auth){
 if(auth.access?.role!=="owner")return respond(res,403,{ok:false,error:"OWNER_REQUIRED"});
 try{
  const db=getSupabaseAdminClient();
  const action=String(payload?.action||"");
  if(action==="list"){
   const {data,error}=await db.from("iste_extension_wallpapers").select("id,title,category,media_type,status,object_path,created_at,size_bytes").order("created_at",{ascending:false}).limit(200);
   if(error)throw error;return respond(res,200,{ok:true,items:data||[]});
  }
  if(action==="upload-ticket"){
   const mime=String(payload?.mime||"");const bytes=Number(payload?.size);
   if(!TYPES[mime]||!Number.isSafeInteger(bytes)||bytes<=0||bytes>MAX)return respond(res,400,{ok:false,error:"INVALID_MEDIA"});
   const path="library/"+randomUUID()+"."+TYPES[mime];
   const {data,error}=await db.storage.from(BUCKET).createSignedUploadUrl(path);
   if(error)throw error;
   return respond(res,200,{ok:true,path,token:data.token});
  }
  if(action==="create"){
   const path=String(payload?.path||"");
   const title=String(payload?.title||"").trim();
   const category=String(payload?.category||"other");
   const mime=String(payload?.mime||"");
   const bytes=Number(payload?.size);
   if(!/^library\/[a-f0-9-]{36}\.(jpg|png|webp|mp4|webm)$/.test(path)||!title||title.length>100||!["gaming","abstract","nature","other"].includes(category)||!TYPES[mime]||!path.endsWith("."+TYPES[mime])||!Number.isSafeInteger(bytes)||bytes<1||bytes>MAX)return respond(res,400,{ok:false,error:"INVALID_MEDIA"});
   const {data:objectInfo,error:lookupError}=await db.storage.from(BUCKET).info(path);
   if(lookupError||!objectInfo)return respond(res,400,{ok:false,error:"MEDIA_NOT_UPLOADED"});
   const {data,error}=await db.from("iste_extension_wallpapers").insert({title,category,media_type:mime.startsWith("image/")?"image":"video",object_path:path,mime_type:mime,size_bytes:bytes,status:"draft",created_by:auth.user.id}).select("id").single();
   if(error)throw error;return respond(res,200,{ok:true,id:data.id});
  }
  if(action==="status"){
   const id=String(payload?.id||"");const status=String(payload?.status||"");
   if(!/^[0-9a-f-]{36}$/i.test(id)||!["draft","published"].includes(status))return respond(res,400,{ok:false,error:"INVALID_REQUEST"});
   const {error}=await db.from("iste_extension_wallpapers").update({status,updated_at:new Date().toISOString()}).eq("id",id);
   if(error)throw error;return respond(res,200,{ok:true});
  }
  if(action==="delete"){
   const id=String(payload?.id||"");
   if(!/^[0-9a-f-]{36}$/i.test(id))return respond(res,400,{ok:false,error:"INVALID_REQUEST"});
   const {data,error}=await db.from("iste_extension_wallpapers").select("object_path").eq("id",id).single();if(error)throw error;
   const removed=await db.storage.from(BUCKET).remove([data.object_path]);if(removed.error)throw removed.error;
   const deleted=await db.from("iste_extension_wallpapers").delete().eq("id",id);if(deleted.error)throw deleted.error;
   return respond(res,200,{ok:true});
  }
  return respond(res,400,{ok:false,error:"UNKNOWN_ACTION"});
 }catch(e){console.error("Extension media API:",e);return respond(res,503,{ok:false,error:"MEDIA_UNAVAILABLE"})}
}
