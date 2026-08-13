const REPO = "Chanwang98/travel";
const FILE_PATH = "data/plans.json";
const LEGACY_FILE_PATH = "data/plan.json";
const API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
const LEGACY_API = `https://api.github.com/repos/${REPO}/contents/${LEGACY_FILE_PATH}`;
const typeGroups = {
  "交通出行":["飞机","高铁","火车","地铁","公交","打车","自驾","骑行","步行","轮渡"],
  "餐饮休闲":["早餐","午餐","晚餐","下午茶","夜宵","咖啡","酒吧"],
  "住宿休息":["入住","退房","睡觉","休息","温泉 / SPA"],
  "游玩活动":["景点","博物馆","城市漫步","拍照","购物","演出","自由活动"],
  "其他事项":["集合","行李寄存","取票 / 安检","候机 / 候车","其他"]
};
const titleSuggestions = ["出发","交通出行","乘车 / 换乘","抵达目的地","前往酒店","办理入住","行李寄存","取票 / 安检","候机 / 候车","酒店休息","酒店早餐","早餐","午餐","下午茶","晚餐","夜宵","前往景点","景点游览","博物馆参观","城市漫步","拍照打卡","看日出","看日落","购物","咖啡休息","温泉 / SPA","自由活动","集合","演出 / 活动","酒吧 / 夜生活","返回酒店","办理退房","前往车站 / 机场","返程"];
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
  轮渡:'<path d="m3 17 3 2 3-2 3 2 3-2 3 2 3-2M5 14l2-7h10l2 7M8 7V4h8v3M7 11h10"/>',
  早餐:'<path d="M5 11h14v2a7 7 0 0 1-14 0v-2ZM4 20h16M8 8V5M12 8V4M16 8V5"/>',
  午餐:'<circle cx="12" cy="12" r="7"/><path d="M3 5v6M5 5v6M4 11v8M20 5v14M20 5c-3 2-3 6 0 7"/>',
  晚餐:'<path d="M4 13h16M6 13a6 6 0 0 1 12 0M12 7V4M4 19h16"/>',
  下午茶:'<path d="M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8ZM17 10h2a2 2 0 0 1 0 4h-2M7 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>',
  夜宵:'<path d="M5 12h14v1a7 7 0 0 1-14 0v-1ZM4 20h16M17 4a5 5 0 0 0 3 7 5 5 0 0 1-3-7Z"/>',
  咖啡:'<path d="M5 8h12v5a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5V8ZM17 10h2a2 2 0 0 1 0 4h-2M4 21h15"/>',
  酒吧:'<path d="M5 4h14l-6 8v7M9 20h8M7 7h10"/>',
  入住:'<path d="M4 19V9h16v10M4 14h16M7 9V6h5a3 3 0 0 1 3 3M7 17h.01"/>',
  退房:'<path d="M4 19V9h12v10M4 14h12M7 9V6h4a3 3 0 0 1 3 3M18 8l3 3-3 3M16 11h5"/>',
  睡觉:'<path d="M4 18V8M4 14h16v4M7 14V9h5a4 4 0 0 1 4 4v1M18 5h3l-3 3h3"/>',
  休息:'<path d="M5 18h14M7 18l1-8h8l1 8M9 10V6h6v4"/>',
  '温泉 / SPA':'<path d="M4 15c2-2 4 2 6 0s4 2 6 0 4 2 4 2M7 11c-2-2 2-3 0-5M12 11c-2-2 2-3 0-5M17 11c-2-2 2-3 0-5"/>',
  景点:'<path d="M5 20h14M7 20V9l5-5 5 5v11M10 20v-5h4v5M9 10h.01M15 10h.01"/>',
  博物馆:'<path d="m3 9 9-5 9 5M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 20h16"/>',
  城市漫步:'<circle cx="13" cy="4" r="2"/><path d="m10 21 1-6-3-3 2-5 4 3 3 1M11 15l5 6M8 12l-3 3"/>',
  拍照:'<path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="3"/>',
  购物:'<path d="M5 8h14l-1 12H6L5 8ZM9 9V6a3 3 0 0 1 6 0v3"/>',
  演出:'<path d="M8 18V6l11-2v12M8 10l11-2"/><circle cx="5" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
  自由活动:'<path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18"/>',
  集合:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6M15 15c3 0 5 2 5 5"/>',
  行李寄存:'<rect x="5" y="7" width="14" height="13" rx="2"/><path d="M9 7V5h6v2M9 11v5M15 11v5"/>',
  '取票 / 安检':'<path d="M5 5h14v5a2 2 0 0 0 0 4v5H5v-5a2 2 0 0 0 0-4V5ZM12 8v8"/>',
  '候机 / 候车':'<path d="M6 18h12M8 18v-6h8v6M9 12V8h6v4M12 8V4M9 4h6"/>',
  其他:'<circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="16" cy="12" r="1"/>'
};
function transportIcon(name){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name]||'<circle cx="12" cy="12" r="7"/><path d="M12 8v8M8 12h8"/>'}</svg>` }
function typeCategory(name){
  const category=Object.entries(typeGroups).find(([,values])=>values.includes(name))?.[0];
  return {"交通出行":"transport","餐饮休闲":"dining","住宿休息":"stay","游玩活动":"activity","其他事项":"other"}[category]||"other";
}
let planStore = {version:1,plans:[]};
let plan = {id:"",title:"我的旅行",destination:"",dateRange:"",companions:"",items:[]};
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
function newPlanId(){ return `trip-${Date.now()}-${Math.random().toString(36).slice(2,7)}` }
function normalizePlan(value,index=0){ return {id:value.id||`trip-migrated-${index+1}`,createdAt:value.createdAt||new Date().toISOString(),updatedAt:value.updatedAt||new Date().toISOString(),title:value.title||"未命名旅行",destination:value.destination||"",dateRange:value.dateRange||"",companions:value.companions||"",items:(value.items||[]).map(normalizedItem)} }

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
    if(!response.ok)throw new Error(`GitHub 返回 ${response.status}`);
    const result=await response.json(),loaded=JSON.parse(decodeBase64(result.content)); fileSha=result.sha; dirty=false;
    if(Array.isArray(loaded.plans)&&loaded.plans.length)planStore={version:1,plans:loaded.plans.map(normalizePlan)};
    else{
      const legacyResponse=await fetch(`${LEGACY_API}?ref=main&t=${Date.now()}`,{headers:headers(Boolean(token()))});
      if(!legacyResponse.ok)throw new Error("无法读取原有行程");
      const legacyResult=await legacyResponse.json(); planStore={version:1,plans:[normalizePlan(JSON.parse(decodeBase64(legacyResult.content)),0)]}; dirty=true;
    }
    const preferred=localStorage.getItem("travelActivePlanId"); plan=planStore.plans.find(value=>value.id===preferred)||planStore.plans[0]; localStorage.setItem("travelActivePlanId",plan.id);
    render(); setStatus(dirty?(token()?"原有行程待迁移 · 30秒内同步":"原有行程待迁移 · 请设置同步"):"已与 GitHub 同步",dirty?"":"ok");
  }catch(error){ setStatus("读取失败","error"); toast(error.message) }
}

function syncMeta(){
  $("planTitle").value=plan.title||""; $("destination").value=plan.destination||""; $("dateRange").value=plan.dateRange||""; $("companions").value=plan.companions||"";
}
function collectMeta(){ plan.title=$("planTitle").value; plan.destination=$("destination").value; plan.dateRange=$("dateRange").value; plan.companions=$("companions").value; plan.updatedAt=new Date().toISOString() }
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
function planState(value){
  if(!value.items.length)return {key:"draft",label:"规划中"};
  const states=value.items.map(item=>getItemStatus(item).key);
  if(states.includes("active"))return {key:"active",label:"进行中"};
  if(states.every(key=>key==="ended"))return {key:"history",label:"已结束"};
  return {key:"upcoming",label:"待出发"};
}
function planCardHtml(value){
  const state=planState(value),active=value.id===plan.id;
  return `<button type="button" class="plan-card${active?" selected":""}" data-plan-id="${escapeHtml(value.id)}"><span class="plan-card-main"><strong>${escapeHtml(value.title)}</strong><small>${escapeHtml(value.destination||"目的地待填写")} · ${escapeHtml(value.dateRange||"日期待填写")}</small></span><span class="plan-state ${state.key}">${state.label}</span>${active?'<span class="current-label">当前</span>':""}</button>`;
}
function renderPlanManager(){
  const current=[],history=[]; planStore.plans.forEach(value=>(planState(value).key==="history"?history:current).push(value));
  $("currentPlans").innerHTML=current.length?current.map(planCardHtml).join(""):'<p class="empty-plans">暂无当前或未来行程</p>';
  $("historyPlans").innerHTML=history.length?history.map(planCardHtml).join(""):'<p class="empty-plans">历史行程会自动出现在这里</p>';
  document.querySelectorAll("[data-plan-id]").forEach(button=>button.addEventListener("click",()=>switchPlan(button.dataset.planId)));
}
async function switchPlan(id){
  if(id===plan.id){$("plansDialog").close();return}
  collectMeta(); if(dirty&&token())await saveToGithub({automatic:true});
  const target=planStore.plans.find(value=>value.id===id); if(!target)return;
  plan=target; localStorage.setItem("travelActivePlanId",id); render(); $("plansDialog").close(); window.scrollTo({top:0,behavior:"smooth"}); toast(`已切换到「${plan.title}」`);
}
function createPlan(event){
  event.preventDefault(); collectMeta();
  const created=normalizePlan({id:newPlanId(),title:$("newPlanTitle").value.trim(),destination:$("newPlanDestination").value.trim(),dateRange:$("newPlanDateRange").value.trim(),companions:$("newPlanCompanions").value.trim(),items:[]});
  planStore.plans.unshift(created); plan=created; localStorage.setItem("travelActivePlanId",created.id); $("newPlanDialog").close(); $("plansDialog").close(); render(); markChanged(); window.scrollTo({top:0,behavior:"smooth"}); toast("新旅行已创建，可以开始添加行程");
}
function cardHtml(item){ const status=getItemStatus(item),category=typeCategory(item.transport); return `<article class="card status-${status.key} category-${category}" draggable="true" data-id="${escapeHtml(item.id)}"><button class="handle" aria-label="拖动">⠿</button><div class="time"><strong>${escapeHtml(item.startTime)}</strong><span>${escapeHtml(item.endTime)}</span><mark class="status-badge">${status.label}</mark></div><div class="icon">${transportIcon(item.transport)}</div><div class="card-main"><div class="title-row"><div><h3>${escapeHtml(item.title)}</h3><p class="location">${escapeHtml(item.location)}</p></div><button class="more" data-id="${escapeHtml(item.id)}" aria-label="编辑行程">•••</button></div><div class="pill"><span class="type-chip">${escapeHtml(item.transport)}</span>${item.details?`<span>·</span><span>${escapeHtml(item.details)}</span>`:""}<span>·</span><span>${formatDuration(item.durationMinutes)}</span></div>${item.note?`<p class="note">${escapeHtml(item.note)}</p>`:""}</div><div class="mobile-move" aria-label="调整行程顺序"><button class="move-button" data-id="${escapeHtml(item.id)}" data-direction="-1" aria-label="向上移动">↑</button><button class="move-button" data-id="${escapeHtml(item.id)}" data-direction="1" aria-label="向下移动">↓</button></div></article>` }
function reorder(target){ if(!dragging||dragging===target)return; const from=plan.items.findIndex(x=>x.id===dragging),to=plan.items.findIndex(x=>x.id===target); const [moved]=plan.items.splice(from,1); plan.items.splice(to,0,moved); recalculateSchedule(Math.min(from,to)); render(); markChanged() }
function moveItem(id,direction){ const from=plan.items.findIndex(item=>item.id===id),to=from+direction; if(from<0||to<0||to>=plan.items.length)return; [plan.items[from],plan.items[to]]=[plan.items[to],plan.items[from]]; recalculateSchedule(Math.min(from,to)); render(); markChanged() }

function selectedTimeMode(){ return document.querySelector('input[name="timeMode"]:checked').value }
function previousForItem(id){ const index=plan.items.findIndex(x=>x.id===id); return index>0?plan.items[index-1]:index<0?plan.items.at(-1):null }
function updateTimeForm(finalize=false){
  const previous=previousForItem($("itemId").value),linked=$("linkedPrevious").checked,mode=selectedTimeMode();
  $("linkedPrevious").disabled=!previous; if(!previous)$("linkedPrevious").checked=false;
  $("linkHint").textContent=previous?`开始时间将使用上一行程结束时间 ${previous.endTime}`:"当前没有可衔接的上一行程";
  $("startTime").readOnly=Boolean(previous&&linked); if(previous&&linked)$("startTime").value=previous.endTime;
  $("durationMinutes").disabled=mode==="fixedEnd"; $("durationMinutes").required=mode==="duration"; $("endTime").readOnly=mode==="duration";
  if(mode==="duration"){
    const raw=$("durationMinutes").value.trim();
    if(!raw&&!finalize){ $("durationOutput").textContent="等待输入"; return }
    const duration=Math.max(1,Number(raw)||60); if(finalize)$("durationMinutes").value=duration; $("endTime").value=minutesToTime(timeToMinutes($("startTime").value)+duration);
  }else $("durationMinutes").value=durationBetween($("startTime").value,$("endTime").value);
  $("durationOutput").textContent=formatDuration($("durationMinutes").value);
}
function renderTitleSuggestions(){
  const query=$("itemTitle").value.trim().toLowerCase();
  const matches=query?titleSuggestions.filter(value=>value.toLowerCase().includes(query)):titleSuggestions;
  $("titleMenu").innerHTML=matches.length?matches.map(value=>`<button type="button" role="option" data-title="${escapeHtml(value)}">${escapeHtml(value)}</button>`).join(""):`<p>没有匹配项，继续输入即可使用自定义名称</p>`;
}
function toggleTitleMenu(open){
  const shouldOpen=typeof open==="boolean"?open:$("titleMenu").hidden;
  $("titleMenu").hidden=!shouldOpen; $("titleMenuBtn").setAttribute("aria-expanded",String(shouldOpen)); $("titleMenuBtn").classList.toggle("open",shouldOpen);
  if(shouldOpen)renderTitleSuggestions();
}

function openItem(id){
  const previous=id?previousForItem(id):plan.items.at(-1); const fallbackStart=previous?.endTime||"09:00";
  const item=normalizedItem(plan.items.find(x=>x.id===id)||{id:`item-${Date.now()}`,date:previous?.date||"",startTime:fallbackStart,endTime:minutesToTime(timeToMinutes(fallbackStart)+60),linkedPrevious:Boolean(previous),timeMode:"duration",durationMinutes:60,title:"",location:"",transport:"步行",details:"",note:""});
  $("modalTitle").textContent=id?"编辑行程":"新增行程"; $("itemId").value=item.id; $("itemDate").value=toDateInputValue(item.date); updateWeekday(); $("linkedPrevious").checked=item.linkedPrevious; $("startTime").value=item.startTime; $("endTime").value=item.endTime; document.querySelector(`input[name="timeMode"][value="${item.timeMode}"]`).checked=true; $("durationMinutes").value=item.durationMinutes; $("itemTitle").value=item.title; toggleTitleMenu(false); $("location").value=item.location; $("transport").value=item.transport; $("details").value=item.details; $("note").value=item.note; $("deleteBtn").style.visibility=id?"visible":"hidden"; updateTimeForm(); $("itemDialog").showModal(); $("itemDialog").scrollTop=0;
}
function saveItem(event){
  event.preventDefault(); updateTimeForm(true); const item={id:$("itemId").value,date:formatDateWithWeekday($("itemDate").value),startTime:$("startTime").value,endTime:$("endTime").value,linkedPrevious:$("linkedPrevious").checked,timeMode:selectedTimeMode(),durationMinutes:Math.max(1,Number($("durationMinutes").value)||60),title:$("itemTitle").value.trim(),location:$("location").value.trim(),transport:$("transport").value,details:$("details").value.trim(),note:$("note").value.trim()}; const index=plan.items.findIndex(x=>x.id===item.id); if(index>=0)plan.items[index]=item;else plan.items.push(item); recalculateSchedule(index>=0?index:plan.items.length-1); $("itemDialog").close();render();markChanged();
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
    const response=await fetch(API,{method:"PUT",headers:{...headers(true),"Content-Type":"application/json"},body:JSON.stringify({message:`Update travel plans ${new Date().toLocaleString("zh-CN")}`,content:encodeBase64(JSON.stringify(planStore,null,2)),sha:fileSha,branch:"main"})});
    const result=await response.json(); if(!response.ok)throw new Error(result.message||`保存失败 ${response.status}`); fileSha=result.content.sha;dirty=false;setStatus("已与 GitHub 同步","ok");if(!automatic)toast("所有设备均可读取最新行程");
  }catch(error){setStatus("同步失败 · 点击重试","error");if(!automatic)toast(error.message)}finally{saving=false;$("saveBtn").disabled=false}
}
function exportWord(){ collectMeta(); const rows=plan.items.map(x=>`<tr><td>${escapeHtml(x.date)}</td><td>${escapeHtml(x.startTime)}–${escapeHtml(x.endTime)}</td><td>${escapeHtml(x.title)}<br>${escapeHtml(x.location)}</td><td>${escapeHtml(x.transport)}<br>${escapeHtml(x.details)}</td><td>${escapeHtml(x.note)}</td></tr>`).join(""); const html=`<meta charset="utf-8"><h1>${escapeHtml(plan.title)}</h1><table border="1" cellpadding="8"><tr><th>日期</th><th>时间</th><th>行程</th><th>类型</th><th>备注</th></tr>${rows}</table>`;const url=URL.createObjectURL(new Blob(["\ufeff",html],{type:"application/msword"}));const a=document.createElement("a");a.href=url;a.download=`${plan.title}.doc`;a.click();URL.revokeObjectURL(url) }

Object.entries(typeGroups).forEach(([label,values])=>{const group=document.createElement("optgroup");group.label=label;values.forEach(value=>group.append(new Option(value,value)));$("transport").append(group)});
fields.forEach(id=>$(id).addEventListener("input",()=>{collectMeta();markChanged()}));
$("addBtn").onclick=$("addRowBtn").onclick=()=>openItem(); $("itemForm").onsubmit=saveItem; $("saveBtn").onclick=saveToGithub; $("pdfBtn").onclick=()=>window.print(); $("wordBtn").onclick=exportWord;
$("itemDate").addEventListener("change",updateWeekday);
["linkedPrevious","startTime","endTime","durationMinutes"].forEach(id=>$(id).addEventListener("input",()=>updateTimeForm(false)));
$("durationMinutes").addEventListener("blur",()=>updateTimeForm(true));
document.querySelectorAll('input[name="timeMode"]').forEach(input=>input.addEventListener("change",()=>updateTimeForm(true)));
$("titleMenuBtn").onclick=()=>toggleTitleMenu();
$("itemTitle").addEventListener("input",()=>{if(!$("titleMenu").hidden)renderTitleSuggestions()});
$("titleMenu").addEventListener("click",event=>{const button=event.target.closest("[data-title]");if(!button)return;$("itemTitle").value=button.dataset.title;toggleTitleMenu(false);$("itemTitle").focus()});
document.addEventListener("click",event=>{if(!event.target.closest(".editable-select"))toggleTitleMenu(false)});
$("deleteBtn").onclick=()=>{const index=plan.items.findIndex(x=>x.id===$("itemId").value);plan.items=plan.items.filter(x=>x.id!==$("itemId").value);recalculateSchedule(Math.max(0,index));$("itemDialog").close();render();markChanged()};
$("settingsBtn").onclick=()=>{$("tokenInput").value=token();$("settingsDialog").showModal()};
$("plansBtn").onclick=()=>{renderPlanManager();$("plansDialog").showModal()};
$("plansSettingsBtn").onclick=()=>{$("plansDialog").close();$("tokenInput").value=token();$("settingsDialog").showModal()};
$("newPlanBtn").onclick=()=>{$("newPlanForm").reset();$("newPlanTitle").value="新的旅行";$("newPlanDialog").showModal();setTimeout(()=>$("newPlanTitle").select(),0)};
$("newPlanForm").onsubmit=createPlan;
$("syncStatus").onclick=()=>{if(dirty)saveToGithub()};
$("settingsForm").onsubmit=e=>{e.preventDefault();localStorage.setItem("travelGithubToken",$("tokenInput").value.trim());$("settingsDialog").close();toast("令牌已保存在本机");loadPlan()};
$("clearTokenBtn").onclick=()=>{localStorage.removeItem("travelGithubToken");$("tokenInput").value="";toast("本机令牌已清除")};
document.querySelectorAll("[data-close]").forEach(button=>button.onclick=()=>$(button.dataset.close).close());
loadPlan();
setInterval(()=>render(),60000);
setInterval(()=>saveToGithub({automatic:true}),30000);
