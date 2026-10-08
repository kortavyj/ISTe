import { useCallback, useEffect, useState } from "react";
import "./ExtensionMediaAdmin.css";
const BUCKET="iste-extension-wallpapers";
const STORAGE_ORIGIN="https://niwgrrprbcgbdaloijhq.supabase.co";
const PUBLISHABLE_KEY="sb_publishable_6tmxQkwDg3l7NZjsdBgV-g_uIx5zTeb";
async function request(action,body={}){
 const response=await fetch("/api/auth/session",{method:"POST",credentials:"include",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"extension-media",mediaAction:action,...body})});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.ok)throw Error(data.message||data.error||"Server error");
 return data;
}
export default function ExtensionMediaAdmin(){
 const [items,setItems]=useState([]),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 const [title,setTitle]=useState(""),[category,setCategory]=useState("gaming"),[file,setFile]=useState(null);
 const refresh=useCallback(async()=>{try{setItems((await request("list")).items||[])}catch(e){setNotice("Не удалось загрузить каталог: "+e.message)}},[]);
 useEffect(()=>{void refresh()},[refresh]);
 async function upload(event){
  event.preventDefault();if(!file||!title.trim()||busy)return;
  const types=["image/jpeg","image/png","image/webp","video/mp4","video/webm"];
  if(!types.includes(file.type)){setNotice("Поддерживаются JPG, PNG, WebP, MP4 и WebM.");return}
  if(file.size>(file.type.startsWith("video/")?100:12)*1024*1024){setNotice("Файл превышает разрешённый размер.");return}
  const form=event.currentTarget;
  setBusy(true);setNotice("Загружаю файл…");
  try{
   const ticket=await request("upload-ticket",{mime:file.type,size:file.size});
   const destination=STORAGE_ORIGIN+"/storage/v1/object/upload/sign/"+BUCKET+"/"+ticket.path+"?token="+encodeURIComponent(ticket.token);
   const response=await fetch(destination,{method:"PUT",headers:{"Content-Type":file.type,"apikey":PUBLISHABLE_KEY},body:file});
   if(!response.ok)throw Error("Не удалось загрузить файл в Storage: "+response.status);
   await request("create",{path:ticket.path,title:title.trim(),category,mime:file.type,size:file.size});
   setFile(null);setTitle("");form.reset();setNotice("Черновик добавлен. Для пользователей он пока скрыт.");await refresh();
  }catch(e){setNotice("Ошибка загрузки: "+e.message)}finally{setBusy(false)}
 }
 async function mutate(action,body){
  setBusy(true);try{await request(action,body);setNotice("Изменения сохранены.");await refresh()}catch(e){setNotice("Ошибка: "+e.message)}finally{setBusy(false)}
 }
 return <section className="extension-admin"><header><span className="extension-admin-kicker">ISTe / OWNER CONTROL</span><h1>Библиотека расширения</h1><p>Управляйте обоями ISTe FACEIT через вашу учётную запись сайта. Публикуются только выбранные материалы.</p></header>
 <div className="extension-admin-stat"><div><strong>{items.length}</strong><span>Всего файлов</span></div><div><strong>{items.filter(x=>x.status==="published").length}</strong><span>Опубликовано</span></div><div><strong>{items.filter(x=>x.status==="draft").length}</strong><span>Черновики</span></div></div>
 <form className="extension-admin-panel" onSubmit={upload}><h2>Загрузить фото или видео</h2><label>Файл<input type="file" required accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]||null)}/></label><div className="extension-admin-fields"><label>Название<input required maxLength={100} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Например: ISTe Crimson Motion"/></label><label>Категория<select value={category} onChange={e=>setCategory(e.target.value)}><option value="gaming">Игровые</option><option value="abstract">Абстракция</option><option value="nature">Природа</option><option value="other">Другое</option></select></label></div><button type="submit" disabled={busy}>Загрузить черновик</button></form>
 <div className="extension-admin-panel"><div className="extension-admin-heading"><h2>Материалы библиотеки</h2><button disabled={busy} onClick={()=>void refresh()}>Обновить</button></div>{items.length===0?<p>Материалов пока нет.</p>:items.map(item=><article className="extension-admin-row" key={item.id}><div><strong>{item.title}</strong><small>{item.media_type==="video"?"Видео":"Фото"} · {item.status==="published"?"Опубликовано":"Черновик"} · {item.category}</small></div><div className="extension-admin-actions"><button disabled={busy} onClick={()=>void mutate("status",{id:item.id,status:item.status==="published"?"draft":"published"})}>{item.status==="published"?"Снять с публикации":"Опубликовать"}</button><button className="extension-admin-delete" disabled={busy} onClick={()=>{if(window.confirm("Удалить этот файл навсегда?"))void mutate("delete",{id:item.id})}}>Удалить</button></div></article>)}</div><p className="extension-admin-notice" role="status">{notice}</p></section>;
}
