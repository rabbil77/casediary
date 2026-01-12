let currentDate = new Date();
let data = JSON.parse(localStorage.getItem("cases")) || {};
let editCaseNo = null;

function $(id){ return document.getElementById(id); }

/* ---------- UTIL ---------- */
function formatDate(d){
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,"0"), day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}

function toBanglaNumber(str){
  const map={'0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯'};
  return String(str).replace(/[0-9]/g,d=>map[d]);
}

function banglaDate(d){ return toBanglaNumber(formatDate(d)); }

function banglaToEnglishNumber(str){
  const map={'০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9'};
  return str.replace(/[০-৯]/g,d=>map[d]);
}

function normalizeText(t){
  return banglaToEnglishNumber(t||"").normalize("NFC").replace(/[\u200C\u200D]/g,"").replace(/\s+/g,"").toLowerCase();
}

/* ---------- DATE ---------- */
function changeDate(d){ currentDate.setDate(currentDate.getDate()+d); loadTable(); }
function toggleCalendar(){ $("calendarPicker").style.display = $("calendarPicker").style.display==="none" ? "block" : "none"; }
function jumpToDate(v){ currentDate = new Date(v); loadTable(); }

/* ---------- TABLE ---------- */
function loadTable(){
  $("dateDisplay").innerText = banglaDate(currentDate);
  $("tableBody").innerHTML = "";
  const selected = formatDate(currentDate);
  const q = normalizeText($("searchBox").value);
  let i=1;

  Object.values(data).forEach(c=>{
    let stage=null;
    if(q){
      if(!normalizeText(c.caseNo).includes(q) && !normalizeText(c.party).includes(q) && !normalizeText(c.advocate).includes(q)) return;
      stage = c.stageHistory.slice(-1)[0];
    } else {
      stage = c.stageHistory.find(h=>h.nextDate===selected);
      if(!stage) return;
    }

    $("tableBody").innerHTML += `
    <tr>
      <td>${toBanglaNumber(i++)}</td>
      <td>${toBanglaNumber(c.caseNo)}</td>
      <td>${c.party}</td>
      <td>${c.advocate}</td>
      <td>${c.court}</td>
      <td>${stage.nextPurpose||""}</td>
      <td>
        <button onclick="editCase('${c.caseNo}')">✏️</button>
        <button onclick="nextDatePrompt('${c.caseNo}')">📅</button>
        <button onclick="openHistory('${c.caseNo}')">📜</button>
        <button onclick="deleteCase('${c.caseNo}')">🗑️</button>
      </td>
    </tr>`;
  });
}

/* ---------- FORM ---------- */
function openForm(){ $("entryForm").style.display="block"; }
function closeForm(){ $("entryForm").style.display="none"; editCaseNo=null; }

function saveEntry(){
  if(!caseNo.value){ alert("মামলা নং দিন"); return; }
  if(editCaseNo){
    const c = data[editCaseNo];
    c.caseNo = caseNo.value; c.party = party.value; c.advocate = advocate.value; c.court = court.value;
    const h = c.stageHistory.slice(-1)[0];
    h.nextDate = nextDate.value; h.nextPurpose = nextPurpose.value; h.notes = nextNotes.value || "";
    if(editCaseNo!==caseNo.value){ data[caseNo.value]=c; delete data[editCaseNo]; }
  } else {
    data[caseNo.value] = { caseNo:caseNo.value, party:party.value, advocate:advocate.value, court:court.value, stageHistory:[{nextDate:nextDate.value, nextPurpose:nextPurpose.value, notes:nextNotes.value || ""}]};
  }
  localStorage.setItem("cases",JSON.stringify(data));
  closeForm();
  loadTable();
}

/* ---------- ACTIONS ---------- */
function editCase(cn){
  const c = data[cn];
  const h = c.stageHistory.slice(-1)[0];
  caseNo.value=c.caseNo; party.value=c.party; advocate.value=c.advocate; court.value=c.court;
  nextDate.value=h.nextDate; nextPurpose.value=h.nextPurpose; nextNotes.value=h.notes||"";
  editCaseNo=cn; openForm();
}

function nextDatePrompt(cn){
  const c=data[cn]; const last=c.stageHistory.slice(-1)[0];
  const d=prompt("পরবর্তী তারিখ",last.nextDate); if(!d) return;
  const p=prompt("উদ্দেশ্য",last.nextPurpose||""); if(!p) return;
  const n=prompt("নোট লিখুন (ঐচ্ছিক)",last.notes||"");
  if(d===last.nextDate){ last.nextPurpose=p; last.notes=n; } else { c.stageHistory.push({nextDate:d,nextPurpose:p,notes:n}); }
  localStorage.setItem("cases",JSON.stringify(data));
  loadTable();
}

function openHistory(cn){ localStorage.setItem("viewHistory",cn); location.href="history.html"; }
function deleteCase(cn){ if(!confirm("এই মামলাটি সম্পূর্ণভাবে মুছে ফেলবেন?")) return; delete data[cn]; localStorage.setItem("cases", JSON.stringify(data)); loadTable(); }

/* ---------- PRINT ---------- */
function printBangla(){
  const selected=formatDate(currentDate);
  let i=1, html=`<h2 style="text-align:center">অ্যাডভোকেট মোঃ আব্দুর রাজ্জাক</h2>
  <h3 style="text-align:center">দৈনিক কার্যতালিকা</h3>
  <p style="text-align:center">তারিখ: ${banglaDate(currentDate)}</p>
  <table border="1" width="100%" style="border-collapse:collapse;font-size:13px">
  <tr><th>ক্রমিক</th><th>মামলা নং</th><th>পক্ষ</th><th>আইনজীবী</th><th>আদালত</th><th>তারিখের উদ্দেশ্য</th></tr>`;
  Object.values(data).forEach(c=>{
    const h=c.stageHistory.find(x=>x.nextDate===selected); if(!h) return;
    html+=`<tr><td>${toBanglaNumber(i++)}</td><td>${toBanglaNumber(c.caseNo)}</td><td>${c.party}</td><td>${c.advocate}</td><td>${c.court}</td><td>${h.nextPurpose||""}</td></tr>`;
  });
  const w=window.open(""); w.document.write(html+"</table>"); w.print();
}

/* ---------- BACKUP / RESTORE ---------- */
function backupData(){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob);
  a.download="case-backup-"+formatDate(new Date())+".json"; a.click();
}

function restoreData(){
  $("restoreFile").onchange=function(){
    const file=this.files[0]; if(!file) return;
    if(!confirm("বর্তমান সব ডাটা মুছে যাবে। চালু রাখবেন?")) return;
    const r=new FileReader();
    r.onload=e=>{ data=JSON.parse(e.target.result); localStorage.setItem("cases",JSON.stringify(data)); loadTable(); alert("রিস্টোর সম্পন্ন"); };
    r.readAsText(file);
  };
  $("restoreFile").click();
}

loadTable();
