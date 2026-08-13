const REPO = "Chanwang98/travel";
const FILE_PATH = "data/plan.json";
const API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
const transports = ["飞机","高铁","火车","地铁","公交","打车","自驾","骑行","步行","轮渡"];
const icons = {飞机:"✈",高铁:"⌁",火车:"▰",地铁:"M",公交:"▣",打车:"◆",自驾:"◇",骑行:"◉",步行:"●",轮渡:"≈"};
let plan = {title:"我的旅行",destination:"",dateRange:"",companions:"",items:[]};
let fileSha = null;
let dragging = null;

const $ = (id) => document.getElementById(id);
const fields = ["planTitle","destination","dateRange","companions"];

function token(){ return localStorage.getItem("travelGithubToken") || "" }
function headers(auth=false){ const value={Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"}; if(auth&&token()) value.Authorization=`Bearer ${token()}`; return value }
function decodeBase64(content){ const bytes=Uint8Array.from(atob(content.replace(/\n/g,"")),c=>c.charCodeAt(0)); return new TextDecoder().decode(bytes) }
function encodeBase64(value){ const bytes=new TextEncoder().encode(value); let binary=""; bytes.forEach(byte=>binary+=String.fromCharCode(byte)); return btoa(binary) }
function escapeHtml(value=""){ return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c])) }
function setStatus(text,type=""){ $("syncStatus").className=`sync ${type}`; $("syncStatus").innerHTML=`<i></i>${escapeHtml(text)}` }
function toast(text){ const node=$("toast"); node.textContent=text; node.classList.add("show"); setTimeout(()=>node.classList.remove("show"),2400) }
function markChanged(){ setStatus("有未同步修改") }

async function loadPlan(){
  try{
    const response=await fetch(`${API}?ref=main&t=${Date.now()}`,{headers:headers(Boolean(token()))});
    if(!response.ok) throw new Error(`GitHub 返回 ${response.status}`);
    const result=await response.json(); fileSha=result.sha; plan=JSON.parse(decodeBase64(result.content)); render(); setStatus("已与 GitHub 同步","ok");
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
    card.addEventListener("dragstart",()=>{dragging=card.dataset.id;card.classList.add("dragging")});
    card.addEventListener("dragend",()=>card.classList.remove("dragging"));
    card.addEventListener("dragover",e=>e.preventDefault()); card.addEventListener("drop",()=>reorder(card.dataset.id));
  });
  document.querySelectorAll(".more").forEach(button=>button.addEventListener("click",()=>openItem(button.dataset.id)));
}
function cardHtml(item){ return `<article class="card" draggable="true" data-id="${escapeHtml(item.id)}"><button class="handle" aria-label="拖动">⠿</button><div class="time"><strong>${escapeHtml(item.startTime)}</strong><span>${escapeHtml(item.endTime)}</span></div><div class="icon">${icons[item.transport]||"•"}</div><div class="card-main"><div class="title-row"><div><h3>${escapeHtml(item.title)}</h3><p class="location">${escapeHtml(item.location)}</p></div><button class="more" data-id="${escapeHtml(item.id)}" aria-label="编辑">•••</button></div><div class="pill"><span>${escapeHtml(item.transport)}</span><span>·</span><span>${escapeHtml(item.details)}</span></div>${item.note?`<p class="note">${escapeHtml(item.note)}</p>`:""}</div></article>` }
function reorder(target){ if(!dragging||dragging===target)return; const from=plan.items.findIndex(x=>x.id===dragging),to=plan.items.findIndex(x=>x.id===target); const [moved]=plan.items.splice(from,1); plan.items.splice(to,0,moved); render(); markChanged() }

function openItem(id){
  const item=plan.items.find(x=>x.id===id)||{id:`item-${Date.now()}`,date:"",startTime:"09:00",endTime:"10:00",title:"",location:"",transport:"步行",details:"",note:""};
  $("modalTitle").textContent=id?"编辑行程":"新增行程"; $("itemId").value=item.id; $("itemDate").value=item.date; $("startTime").value=item.startTime; $("endTime").value=item.endTime; $("itemTitle").value=item.title; $("location").value=item.location; $("transport").value=item.transport; $("details").value=item.details; $("note").value=item.note; $("deleteBtn").style.visibility=id?"visible":"hidden"; $("itemDialog").showModal();
}
function saveItem(event){
  event.preventDefault(); const item={id:$("itemId").value,date:$("itemDate").value,startTime:$("startTime").value,endTime:$("endTime").value,title:$("itemTitle").value.trim(),location:$("location").value.trim(),transport:$("transport").value,details:$("details").value.trim(),note:$("note").value.trim()}; const index=plan.items.findIndex(x=>x.id===item.id); if(index>=0)plan.items[index]=item;else plan.items.push(item); $("itemDialog").close();render();markChanged();
}

async function saveToGithub(){
  collectMeta(); if(!token()){ $("settingsDialog").showModal();toast("请先设置 GitHub 令牌");return }
  setStatus("正在提交到 GitHub…"); $("saveBtn").disabled=true;
  try{
    const response=await fetch(API,{method:"PUT",headers:{...headers(true),"Content-Type":"application/json"},body:JSON.stringify({message:`Update travel plan ${new Date().toLocaleString("zh-CN")}`,content:encodeBase64(JSON.stringify(plan,null,2)),sha:fileSha,branch:"main"})});
    const result=await response.json(); if(!response.ok)throw new Error(result.message||`保存失败 ${response.status}`); fileSha=result.content.sha;setStatus("已与 GitHub 同步","ok");toast("所有设备均可读取最新行程");
  }catch(error){setStatus("保存失败","error");toast(error.message)}finally{$("saveBtn").disabled=false}
}
function exportWord(){ collectMeta(); const rows=plan.items.map(x=>`<tr><td>${escapeHtml(x.date)}</td><td>${escapeHtml(x.startTime)}–${escapeHtml(x.endTime)}</td><td>${escapeHtml(x.title)}<br>${escapeHtml(x.location)}</td><td>${escapeHtml(x.transport)}<br>${escapeHtml(x.details)}</td><td>${escapeHtml(x.note)}</td></tr>`).join(""); const html=`<meta charset="utf-8"><h1>${escapeHtml(plan.title)}</h1><table border="1" cellpadding="8"><tr><th>日期</th><th>时间</th><th>行程</th><th>交通</th><th>备注</th></tr>${rows}</table>`;const url=URL.createObjectURL(new Blob(["\ufeff",html],{type:"application/msword"}));const a=document.createElement("a");a.href=url;a.download=`${plan.title}.doc`;a.click();URL.revokeObjectURL(url) }

transports.forEach(value=>$("transport").add(new Option(value,value)));
fields.forEach(id=>$(id).addEventListener("input",()=>{collectMeta();markChanged()}));
$("addBtn").onclick=$("addRowBtn").onclick=()=>openItem(); $("itemForm").onsubmit=saveItem; $("saveBtn").onclick=saveToGithub; $("pdfBtn").onclick=()=>window.print(); $("wordBtn").onclick=exportWord;
$("deleteBtn").onclick=()=>{plan.items=plan.items.filter(x=>x.id!==$("itemId").value);$("itemDialog").close();render();markChanged()};
$("settingsBtn").onclick=()=>{$("tokenInput").value=token();$("settingsDialog").showModal()};
$("settingsForm").onsubmit=e=>{e.preventDefault();localStorage.setItem("travelGithubToken",$("tokenInput").value.trim());$("settingsDialog").close();toast("令牌已保存在本机");loadPlan()};
$("clearTokenBtn").onclick=()=>{localStorage.removeItem("travelGithubToken");$("tokenInput").value="";toast("本机令牌已清除")};
document.querySelectorAll("[data-close]").forEach(button=>button.onclick=()=>$(button.dataset.close).close());
loadPlan();
