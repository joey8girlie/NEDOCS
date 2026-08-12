const $ = id => document.getElementById(id);
const STORAGE_KEY = "nedocs_thai_history_v1";
const API_KEY = "nedocs_thai_google_apps_script_url";

let lastResult = null;

const bands = [
  {min:0,max:20,name:"ไม่แออัด",class:"green",hint:"Not Busy"},
  {min:21,max:60,name:"ค่อนข้างยุ่ง",class:"green",hint:"Busy"},
  {min:61,max:100,name:"ยุ่งมาก",class:"yellow",hint:"Extremely Busy"},
  {min:101,max:140,name:"แออัด",class:"orange",hint:"Overcrowded"},
  {min:141,max:180,name:"แออัดรุนแรง",class:"red",hint:"Severely Overcrowded"},
  {min:181,max:200,name:"แออัดระดับอันตราย",class:"black",hint:"Dangerously Overcrowded"}
];

function minutes(h,m){
  return (Number(h)||0)*60 + (Number(m)||0);
}

/*
  Original NEDOCS formula:
  -20 + 85.8*(ED patients / ED beds)
       + 600*(ED admits / IP beds)
       + 13.4*(1:1 patients)
       + 0.93*(longest admit hours)
       + 5.64*(last door-to-bed hours)
  Display is capped at 200.
*/
function calculate(data){
  const raw = -20
    + 85.8 * (data.totalpat / data.edbeds)
    + 600 * (data.totaladmits / data.ipbeds)
    + 13.4 * data.ventilators
    + 0.93 * (data.longestAdmitMinutes / 60)
    + 5.64 * (data.lastBedMinutes / 60);

  const score = Math.max(0, Math.min(200, Math.round(raw)));
  const band = bands.find(b => score >= b.min && score <= b.max) || bands[bands.length-1];
  return {score, raw, band};
}

function readForm(){
  return {
    totalpat:Number($("totalpat").value),
    edbeds:Number($("edbeds").value),
    ipbeds:Number($("ipbeds").value),
    totaladmits:Number($("totaladmits").value),
    ventilators:Number($("ventilators").value),
    longestAdmitMinutes:minutes($("longestHours").value,$("longestMinutes").value),
    lastBedMinutes:minutes($("lastBedHours").value,$("lastBedMinutes").value),
    note:$("note").value.trim()
  };
}

function validate(d){
  if(!Number.isFinite(d.totalpat) || d.totalpat < 0) return "กรุณากรอกจำนวนผู้ป่วย ER";
  if(!Number.isFinite(d.edbeds) || d.edbeds <= 0) return "กรุณากรอกจำนวนเตียง ER ที่มากกว่า 0";
  if(!Number.isFinite(d.ipbeds) || d.ipbeds <= 0) return "กรุณากรอกจำนวนเตียงผู้ป่วยในที่มากกว่า 0";
  if(!Number.isFinite(d.totaladmits) || d.totaladmits < 0) return "กรุณากรอกจำนวน Admit";
  if(!Number.isFinite(d.ventilators) || d.ventilators < 0) return "กรุณากรอกจำนวน 1:1 / Ventilator";
  return "";
}

function showResult(result){
  $("score").textContent = result.score;
  $("level").textContent = result.band.name;
  $("scoreHint").textContent = result.band.hint + " • ช่วง " + result.band.min + "–" + result.band.max;
  const card = $("statusCard");
  card.className = "status-card " + result.band.class;
  $("saveBtn").disabled = false;
}

function toast(msg){
  const el=$("toast");
  el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}

function nowText(iso){
  return new Date(iso).toLocaleString("th-TH",{dateStyle:"short",timeStyle:"short"});
}

function history(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return[]}
}

function saveLocal(record){
  const arr=history();
  arr.unshift(record);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(arr.slice(0,50)));
  renderHistory();
}

function renderHistory(){
  const arr=history();
  if(!arr.length){$("history").innerHTML='<div class="empty">ยังไม่มีประวัติการประเมินในเครื่องนี้</div>';return}
  $("history").innerHTML=arr.map(r=>`
    <div class="history-item">
      <div class="history-top">
        <div>${nowText(r.timestamp)}</div>
        <div class="history-score">${r.score} • ${r.level}</div>
      </div>
      <div class="history-meta">ผู้ป่วย ${r.totalpat} • ER ${r.edbeds} เตียง • Admit ${r.totaladmits} • 1:1 ${r.ventilators}</div>
      ${r.note?`<div class="history-note">${escapeHtml(r.note)}</div>`:""}
    </div>`).join("");
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function apiUrl(){return localStorage.getItem(API_KEY)||""}

async function saveGoogle(){
  if(!lastResult){toast("กรุณาคำนวณก่อน");return}
  const url=apiUrl();
  if(!url){$("settingsDialog").showModal();toast("กรุณาตั้งค่า Google Apps Script URL ก่อน");return}
  const d=readForm();
  const payload={
    timestamp:new Date().toISOString(),
    score:lastResult.score,
    level:lastResult.band.name,
    rawScore:lastResult.raw,
    totalpat:d.totalpat, edbeds:d.edbeds, ipbeds:d.ipbeds,
    totaladmits:d.totaladmits, ventilators:d.ventilators,
    longestAdmitMinutes:d.longestAdmitMinutes,
    lastBedMinutes:d.lastBedMinutes,
    note:d.note
  };
  $("saveBtn").disabled=true;
  try{
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
    const out=await res.json();
    if(!out.ok) throw new Error(out.message||"บันทึกไม่สำเร็จ");
    saveLocal(payload);
    toast("บันทึกลง Google Sheets แล้ว");
  }catch(e){
    saveLocal(payload);
    toast("ส่ง Google Sheets ไม่สำเร็จ แต่เก็บข้อมูลไว้ในเครื่องแล้ว");
  }finally{
    $("saveBtn").disabled=false;
  }
}

$("calculateBtn").addEventListener("click",()=>{
  const d=readForm(), err=validate(d);
  if(err){toast(err);return}
  lastResult=calculate(d);
  showResult(lastResult);
});

$("saveBtn").addEventListener("click",saveGoogle);

$("clearBtn").addEventListener("click",()=>{
  $("nedocsForm").reset();
  lastResult=null;
  $("score").textContent="—";
  $("level").textContent="กรอกข้อมูลแล้วกดคำนวณ";
  $("scoreHint").textContent="NEDOCS 0–200";
  $("statusCard").className="status-card neutral";
  $("saveBtn").disabled=true;
});

$("clearHistoryBtn").addEventListener("click",()=>{
  if(confirm("ล้างประวัติในเครื่องทั้งหมดหรือไม่?")){
    localStorage.removeItem(STORAGE_KEY); renderHistory();
  }
});

$("settingsBtn").addEventListener("click",()=>{
  $("apiUrl").value=apiUrl();
  $("settingsDialog").showModal();
});
$("closeSettings").addEventListener("click",()=>$("settingsDialog").close());
$("saveSettings").addEventListener("click",()=>{
  localStorage.setItem(API_KEY,$("apiUrl").value.trim());
  $("settingsDialog").close();
  toast("บันทึกการตั้งค่าแล้ว");
});

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
renderHistory();
