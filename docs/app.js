const REPO = "Chanwang98/travel";
const FILE_PATH = "data/plan.json";
const API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
const transports = ["飞机","高铁","火车","地铁","公交","打车","自驾","骑行","步行","轮渡"];
const iconPaths = {
  飞机:'<path d="M3 11.5 21 4l-5.5 7 4.5 2-2 2-5-1.5-3.5 4.5-2 .5 1.5-6L3 11.5Z"/>',
  高铁:'<path d="M7 3h10c2 0 3 1.6 3 4v7c0 2-1.5 3-3.5 3h-9C5.5 17 4 16 4 14V7c0-2.4 1-4 3-4Z"/><path d="M7 7h10M7 13h.01M17 13h.01M8 17l-2 3M16 17l2 3M8 20h8"/>',
  火车:'<path d="M6 3h12v13H6zM6 8h12M9 12h.01M15 12h.01M8 16l-2 4M16 16l2 4M7 20h10"/>',
  地铁:'<circle cx="12" cy="12" r="9"/><path d="M8 16V8l4 5 4-5v8"/>',
  公交:'<path d="M5 4h14v13H5zM5 9h14M8 13h.01M16 13h.01M7 17v3M17 17v3"/>',
  打车:'<path d="m5 10 2-5h10l2 5M4 10h16v7H4zM7 14h.01M17 14h.01M7 17v2M17 17v2M9 5l1-2h4l1 2"/>',
  自驾:'<path d="m4 12 2-6h12l2 6v6H4zM7 15h.01M17 15h.01M6 18v2M18 18v2M6 10h12"/>',
  骑行:'<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><circle cx="13" cy="5" r="2"/><path d="m9 17 3-6 3 3h3M9 17l-2-6h5l3 6"/>',
  步行:'<circle cx="13" cy="4" r="2"/><path d="m10 21 1-6-3-3 2-5 4 3 3 1M11 15l5 6M8 12l-3 3"/>',
  轮渡:'<path d="m3 17 3 2 3-2 3 2 3-2 3 2 3-2M5 14l2-7h10l2 7M8 7V4h8v3M7 11h10"/>'
};
function transportIcon(name){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||'<circle cx="12" cy="12" r="7"/><path d="M12 8v8M8 12h8"/>'}</svg>` }
let plan = {title:"我的旅行",destination:"",dateRange:"",companions:"",items:[]};
let fileSha = null;
let dragging = null;
let dirty = false;
let saving = false;

const $ = (id) => document.getElementById(id);
const fields = ["planTitle","destination","dateRange","companions"];

function token(){ return localStorage.getItem("travelGithubToken") || "" }
function headers(auth=false){ const value={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}; if(auth&&token()) value.Authorization=`Bearer ${token()}`; return value }
function decodeBase64(content){ const bytes=Uint8Array.from(atob(content.replace(/\n/g,"")),c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes) }
function encodeBase64(value){ const bytes=new TextEncoder().encode(value); let binary=""; bytes.forEach(byte=>binary+=String.fromCharCode(byte)); return btoa(binary) }
function escapeHtml(value=""){ return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])) }
function setStatus(text,type=""){ $("syncStatus").className=`sync ${type}`; $("syncStatus").innerHTML=`<i></i>${escapeHtml(text)}` }
function toast(text){ const node=$("toast"); node.textContent=text; node.classList.add("show"); setTimeout(()=>node.classList.remove("show"),2400) }
function markChanged(){ dirty=true; setStatus(token()?"有修改 · 30秒内自动同步":"有修改 · 请设置同步") }

function parseItemDate(dateText, now=new Date()){
  const normalized=String(dateText||"").trim();
  let match=normalized.match(/(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/);
  if(match)return {year:Number(match[1]),month:Number(match[2]),day:Number(match[3])};
  match=normalized.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日?/);
  if(!match)return null;
  let year=now.getFullYear(); const month=Number(match[1]),day=Number(match[2]);
  const candidate=new Date(year,month-1,day); const distance=candidate.getTime()-now.getTime();
  if(distance>1000*60*60*24*180)year-=1;
  if(distance<-(1000*60*60*24*180))year+=1;
  return {year,month,day};
}
function toDateInputValue(dateText){
  const parsed=parseItemDate(dateText); if(!parsed)return "";
  return `${parsed.year}-${String(parsed.month).padStart(2,"0")}-${String(parsed.day).padStart(2,"0")}`;
}
function formatDateWithWeekday(value){
  if(!value)return ""; const [year,month,day]=value.split("-").map(Number); const date=new Date(year,month-1,day);
  const weekday=new Intl.DateTimeFormat("zh-CN",{weekday:"short"}).format(date);
  return `${year}年${month}月${day}日 · ${weekday}`;
}
function updateWeekday(){
  const value=$("itemDate").value; $("weekdayOutput").textContent=value?formatDateWithWeekday(value).split(" · ")[1]:"请选择日期";
}
function timeToMinutes(value){ const [hours,minutes]=String(value||"00:00").split(":").map(Number); return (hours||0)*60+(minutes||0) }
function minutesToTime(value){ const normalized=((Number(value)||0)%1440+1440)%1440; return `${String(Math.floor(normalized/60)).padStart(2,"0")}:${String(normalized%60).padStart(2,"0")}` }
function durationBetween(start,end){ let value=timeToMinutes(end)-timeToMinutes(start); if(value<=0)value+=1440; return value }
function formatDuration(value){ const minutes=Math.max(0,Math.round(Number(value)||0)); if(minutes<60)return `${minutes}分钟`; const hours=Math.floor(minutes/60),rest=minutes%60; return `${hours}小时${rest?`${rest}分钟`:""}` }
function normalizedItem(item){
  const duration=Math.max(1,Number(item.durationMinutes)||durationBetween(item.startTime,item.endTime));
  return {...item,linkedPrevious:Boolean(item.linkedPrevious),timeMode:item.timeMode==="fixedEnd"?"fixedEnd":"duration",durationMinutes:duration};
}
function recalculateSchedule(fromIndex=0){
  plan.items=plan.items.map(normalizedItem);
  for(let index=Math.max(0,fromIndex);index<plan.items.length;index+=1){
    const item=plan.items[index],previous=plan.items[index-1];
    if(item.linkedPrevious&&previous)item.startTime=previous.endTime;
    if(item.timeMode==="fixedEnd")item.durationMinutes=durationBetween(item.startTime,item.endTime);
    else item.endTime=minutesToTime(timeToMinutes(item.startTime)+item.durationMinutes);
  }
}
function getItemStatus(item,now=new Date()){
  const date=parseItemDate(item.date,now); if(!date)return {key:"unknown",label:"日期待完善"};
  const toDate=(time,fallback)=>{const parts=String(time||fallback).split(":").map(Number);return new Date(date.year,date.month-1,date.day,parts[0]||0,parts[1]||0,0)};
  const start=toDate(item.startTime,"00:00"),end=toDate(item.endTime,"23:59");
  if(now<start)return {key:"upcoming",label:"待开始"};
  if(now>end)return {key:"ended",label:"已结束"};
  return {key:"active",label:"进行中"};
}

async function loadPlan(){
  try{
    const response=await fetch(`${API}?ref=main&t=${Date.now()}`,{headers:headers(Boolean(token()))});
    if(!response.ok) throw new Error(`GitHub 返回 ${response.status}`);
    const result=await response.json(); fileSha=result.sha; plan=JSON.parse(decodeBase64(result.content)); plan.items=(plan.items||[]).map(normalizedItem); dirty=false; render(); setStatus("已与 GitHub 同步","ok");
  }catch(error){ setStatus("读取失败","error"); toast(error.message) }
}

function syncMeta(){
  $("planTitle").value=plan.title||""; $("destination").value=plan.destination||""; $("dateRange").value=plan.dateRange||""; $("companions").value=plan.companions||"";
}
function collectMeta(){ plan.title=$("planTitle").value; plan.destination=$("destination").value; plan.dateRange=$("dateRange").value; plan.companions=$("companions").value }
function render(){
  syncMeta(); const groups=[];
  plan.items.forEach(item=>{ let group=groups.find(x=>x.date===item.date); if(!group){group={date:item.date||"待定日期",items:[]};groups.push(group)} group.items.push(item) });
  $("timeline").innerHTML=groups.map(group=>`<section class="day"><div class="day-label">${escapeHtml(group.date)}</div><div class="cards">${group.items.map(cardHtml).join("")}</div></section>`).join("");
  document.querySelectorAll(".card").forEach(card=>{
    card.draggable=!window.matchMedia("(max-width: 760px)").matches;
    card.addEventListener("dragstart",()=>{dragging=card.dataset.id;card.classList.add("dragging")});
    card.addEventListener("dragend",()=>card.classList.remove("dragging"));
    card.addEventListener("dragover",e=>e.preventDefault()); card.addEventListener("drop",()=>reorder(card.dataset.id));
  });
  document.querySelectorAll(".more").forEach(button=>button.addEventListener("click",()=>openItem(button.dataset.id)));
  document.querySelectorAll(".move-button").forEach(button=>button.addEventListener("click",()=>moveItem(button.dataset.id,Number(button.dataset.direction))));
}
function cardHtml(item){ const status=getItemStatus(item); return `<article class="card status-${status.key}" draggable="true" data-id="${escapeHtml(item.id)}"><button class="handle" aria-label="拖动">⠿</button><div class="time"><strong>${escapeHtml(item.startTime)}</strong><span>${escapeHtml(item.endTime)}</span><mark class="status-badge">${status.label}</mark></div><div class="icon">${transportIcon(item.transport)}</div><div class="card-main"><div class="title-row"><div><h3>${escapeHtml(item.title)}</h3><p class="location">${escapeHtml(item.location)}</p></div><button class="more" data-id="${escapeHtml(item.id)}" aria-label="编辑行程">•••</button></div><div class="pill"><span>${escapeHtml(item.transport)}</span>${item.details?`<span>·</span><span>${escapeHtml(item.details)}</span>`:""}<span>·</span><span>${formatDuration(item.durationMinutes)}</span></div>${item.note?`<p class="note">${escapeHtml(item.note)}</p>`:""}</div><div class="mobile-move" aria-label="调整行程顺序"><button class="move-button" data-id="${escapeHtml(item.id)}" data-direction="-1" aria-label="向上移动">↑</button><button class="move-button" data-id="${escapeHtml(item.id)}" data-direction="1" aria-label="向下移动">↓</button></div></article>` }
function reorder(target){ if(!dragging||dragging===target)return; const from=plan.items.findIndex(x=>x.id===dragging),to=plan.items.findIndex(x=>x.id===target); const [moved]=plan.items.splice(from,1); plan.items.splice(to,0,moved); recalculateSchedule(Math.min(from,to)); render(); markChanged() }
function moveItem(id,direction){ const from=plan.items.findIndex(item=>item.id===id),to=from+direction; if(from<0||to<0||to>=plan.items.length)return; [plan.items[from],plan.items[to]]=[plan.items[to],plan.items[from]]; recalculateSchedule(Math.min(from,to)); render(); markChanged() }

function selectedTimeMode(){ return document.querySelector('input[name="timeMode"]:checked').value }
function previousForItem(id){ const index=plan.items.findIndex(x=>x.id===id); return index>0?plan.items[index-1]:index<0?plan.items.at(-1):null }
function updateTimeForm(){
  const previous=previousForItem($("itemId").value),linked=$("linkedPrevious").checked,mode=selectedTimeMode();
  $("linkedPrevious").disabled=!previous; if(!previous)$("linkedPrevious").checked=false;
  $("linkHint").textContent=previous?`开始时间将使用上一行程结束时间 ${previous.endTime}`:"当前没有可衔接的上一行程";
  $("startTime").readOnly=Boolean(previous&&linked); if(previous&&linked)$("startTime").value=previous.endTime;
  $("durationMinutes").disabled=mode==="fixedEnd"; $("durationMinutes").required=mode==="duration"; $("endTime").readOnly=mode==="duration";
  if(mode==="duration"){
    const duration=Math.max(1,Number($("durationMinutes").value)||60); $("durationMinutes").value=duration; $("endTime").value=minutesToTime(timeToMinutes($("startTime").value)+duration);
  }else $("durationMinutes").value=durationBetween($("startTime").value,$("endTime").value);
  $("durationOutput").textContent=formatDuration($("durationMinutes").value);
}

function openItem(id){
  const previous=id?previousForItem(id):plan.items.at(-1); const fallbackStart=previous?.endTime||"09:00";
  const item=normalizedItem(plan.items.find(x=>x.id===id)||{id:`item-${Date.now()}`,date:previous?.date||"",startTime:fallbackStart,endTime:minutesToTime(timeToMinutes(fallbackStart)+60),linkedPrevious:Boolean(previous),timeMode:"duration",durationMinutes:60,title:"",location:"",transport:"步行",details:"",note:""});
  $("modalTitle").textContent=id?"编辑行程":"新增行程"; $("itemId").value=item.id; $("itemDate").value=toDateInputValue(item.date); updateWeekday(); $("linkedPrevious").checked=item.linkedPrevious; $("startTime").value=item.startTime; $("endTime").value=item.endTime; document.querySelector(`input[name="timeMode"][value="${item.timeMode}"]`).checked=true; $("durationMinutes").value=item.durationMinutes; $("itemTitle").value=item.title; $("location").value=item.location; $("transport").value=item.transport; $("details").value=item.details; $("note").value=item.note; $("deleteBtn").style.visibility=id?"visible":"hidden"; updateTimeForm(); $("itemDialog").showModal();
}
function saveItem(event){
  event.preventDefault(); updateTimeForm(); const item={id:$("itemId").value,date:formatDateWithWeekday($("itemDate").value),startTime:$("startTime").value,endTime:$("endTime").value,linkedPrevious:$("linkedPrevious").checked,timeMode:selectedTimeMode(),durationMinutes:Math.max(1,Number($("durationMinutes").value)||1),title:$("itemTitle").value.trim(),location:$("location").value.trim(),transport:$("transport").value,details:$("details").value.trim(),note:$("note").value.trim()}; const index=plan.items.findIndex(x=>x.id===item.id); if(index>=0)plan.items[index]=item;else plan.items.push(item); recalculateSchedule(index>=0?index:plan.items.length-1); $("itemDialog").close();render();markChanged();
}

async function saveToGithub(options={}){
  const automatic=Boolean(options.automatic); collectMeta();
  if(saving||(!dirty&&automatic))return;
  if(!token()){
    setStatus("未同步 · 需要设置","error");
    if(!automatic){$("settingsDialog").showModal();toast("请先设置 GitHub 令牌")}
    return;
  }
  saving=true; setStatus(automatic?"正在自动同步…":"正在提交到 GitHub…"); $("saveBtn").disabled=true;
  try{
    const response=await fetch(API,{method:"PUT",headers:{...headers(true),"Content-Type":"application/json"},body:JSON.stringify({message:`Update travel plan ${new Date().toLocaleString("zh-CN")}`,content:encodeBase64(JSON.stringify(plan,null,2)),sha:fileSha,branch:"main"})});
    const result=await response.json(); if(!response.ok)throw new Error(result.message||`保存失败 ${response.status}`); fileSha=result.content.sha;dirty=false;setStatus("已与 GitHub 同步","ok");if(!automatic)toast("所有设备均可读取最新行程");
  }catch(error){setStatus("同步失败 · 点击重试","error");if(!automatic)toast(error.message)}finally{saving=false;$("saveBtn").disabled=false}
}
function exportWord(){ collectMeta(); const rows=plan.items.map(x=>`<tr><td>${escapeHtml(x.date)}</td><td>${escapeHtml(x.startTime)}–${escapeHtml(x.endTime)}</td><td>${escapeHtml(x.title)}<br>${escapeHtml(x.location)}</td><td>${escapeHtml(x.transport)}<br>${escapeHtml(x.details)}</td><td>${escapeHtml(x.note)}</td></tr>`).join(""); const html=`<meta charset="utf-8"><h1>${escapeHtml(plan.title)}</h1><table border="1" cellpadding="8"><tr><th>日期</th><th>时间</th><th>行程</th><th>交通</th><th>备注</th></tr>${rows}</table>`;const url=URL.createObjectURL(new Blob(["\ufeff",html],{type:"application/msword"}));const a=document.createElement("a");a.href=url;a.download=`${plan.title}.doc`;a.click();URL.revokeObjectURL(url) }

transports.forEach(value=>$("transport").add(new Option(value,value)));
fields.forEach(id=>$(id).addEventListener("input",()=>{collectMeta();markChanged()}));
$("addBtn").onclick=$("addRowBtn").onclick=()=>openItem(); $("itemForm").onsubmit=saveItem; $("saveBtn").onclick=saveToGithub; $("pdfBtn").onclick=()=>window.print(); $("wordBtn").onclick=exportWord;
$("itemDate").addEventListener("change",updateWeekday);
["linkedPrevious","startTime","endTime","durationMinutes"].forEach(id=>$(id).addEventListener("input",updateTimeForm));
document.querySelectorAll('input[name="timeMode"]').forEach(input=>input.addEventListener("change",updateTimeForm));
$("deleteBtn").onclick=()=>{const index=plan.items.findIndex(x=>x.id===$("itemId").value);plan.items=plan.items.filter(x=>x.id!==$("itemId").value);recalculateSchedule(Math.max(0,index));$("itemDialog").close();render();markChanged()};
$("settingsBtn").onclick=()=>{$("tokenInput").value=token();$("settingsDialog").showModal()};
$("syncStatus").onclick=()=>{if(dirty)saveToGithub()};
$("settingsForm").onsubmit=e=>{e.preventDefault();localStorage.setItem("travelGithubToken",$("tokenInput").value.trim());$("settingsDialog").close();toast("令牌已保存在本机");loadPlan()};
$("clearTokenBtn").onclick=()=>{localStorage.removeItem("travelGithubToken");$("tokenInput").value="";toast("本机令牌已清除")};
document.querySelectorAll("[data-close]").forEach(button=>button.onclick=()=>$(button.dataset.close).close());
loadPlan();
setInterval(()=>render(),60000);
setInterval(()=>saveToGithub({automatic:true}),30000);
