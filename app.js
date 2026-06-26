const App=(()=>{const KEY="CVSS_V23";
const classNames={H:"Maiden heifer",F:"First-lactation heifer",W:"Wet cow",D:"Dry cow",C:"Cull cow",S:"Speyed cow",B:"Bull"};
let S={profiles:[],sessions:[],tallies:[],annualSchedules:[],bullPower:[],draftTemplates:[],active:null,records:[],animal:{},tally:{},draftPens:[]};
let charts=[];
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>crypto.randomUUID();
const pct=(n,d)=>d?Math.round(n/d*100):0;
const avg=a=>{let v=a.filter(x=>x!==null&&x!==undefined&&!isNaN(x));return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};
const pregNo=p=>!p||p==="E"?0:Number(String(p).replace("P",""));
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const load=()=>{let raw=localStorage.getItem(KEY);if(raw)S=JSON.parse(raw);S.profiles??=[];S.sessions??=[];S.tallies??=[];S.annualSchedules??=[];S.bullPower??=[];S.draftTemplates??=[];S.sessionTemplates??=[];S.records??=[];S.tally??={};S.draftPens??=[];};


function renderHome(){
  const last=S.sessions[0]||S.active;
  const active=S.active?`<p><b>Active session:</b> ${S.active.station} / ${S.active.mob} — ${S.records.length} head recorded.</p>`:"<p>No active session.</p>";
  const lastText=last?`<p><b>Last setup:</b> ${last.station} ${last.year} / ${last.paddock||""} / ${last.mob||""}</p>`:"<p>No previous sessions saved yet.</p>";
  homeOut.innerHTML=active+lastText+`<p><b>Daily workflow:</b> 1. Pick quick setup → 2. Start session → 3. Record animals → 4. Finish & save → 5. Add yard tally totals → 6. Open report.</p>`;
}

function quickStart(type){
  if(type==="mixed"){show("tally");return}
  show("session");
  if(type==="heifers") sessionPreset("heiferPreg");
  else if(type==="repeat") copyLastSessionSetup();
  else sessionPreset("cowPreg");
}

function setChecks(vals){
  recClass.checked=!!vals.class;
  recAge.checked=!!vals.age;
  recBCS.checked=!!vals.bcs;
  recPreg.checked=!!vals.preg;
  recWeight.checked=!!vals.weight;
  recWetDry.checked=!!vals.wetdry;
}

function sessionPreset(type){
  ssYear.value ||= new Date().getFullYear();
  ssDate.value ||= today();
  if(type==="heiferPreg"){
    setChecks({class:true,age:true,bcs:true,preg:true,weight:true,wetdry:false});
    fixClass.value="";
    fixWetDry.value="";
    loadDraftExample("heifers");
  }else if(type==="mixedTally"){
    setChecks({class:false,age:false,bcs:false,preg:false,weight:false,wetdry:false});
    show("tally");
    return;
  }else{
    setChecks({class:true,age:true,bcs:true,preg:true,weight:false,wetdry:true});
    fixClass.value="";
    fixWetDry.value="";
    loadDraftExample("cows");
  }
  renderDraftPens();
}

function copyLastSessionSetup(){
  const last=S.active||S.sessions[0];
  if(!last){alert("No previous session to copy.");return}
  ssStation.value=last.station||"";
  ssYear.value=last.year||new Date().getFullYear();
  ssPaddock.value=last.paddock||"";
  ssMob.value=last.mob||"";
  ssOperator.value=last.operator||"";
  ssDate.value=today();
  recClass.checked=!!last.recClass; recAge.checked=!!last.recAge; recBCS.checked=!!last.recBCS; recPreg.checked=!!last.recPreg; recWeight.checked=!!last.recWeight; recWetDry.checked=!!last.recWetDry;
  fixClass.value=last.fixClass||""; fixWetDry.value=last.fixWetDry||"";
  S.draftPens=JSON.parse(JSON.stringify(last.draftPens||[]));
  save(); renderDraftPens();
}

function saveSessionTemplate(){
  const name=prompt("Template name", ssMob.value||"Session template");
  if(!name)return;
  S.sessionTemplates=S.sessionTemplates||[];
  S.sessionTemplates.unshift({id:uid(),name,setup:getSessionSetupFromForm(),draftPens:JSON.parse(JSON.stringify(S.draftPens||[]))});
  save(); renderSessionTemplates();
}

function getSessionSetupFromForm(){
  return {station:ssStation.value,year:+ssYear.value||new Date().getFullYear(),paddock:ssPaddock.value,mob:ssMob.value,operator:ssOperator.value,recClass:recClass.checked,recAge:recAge.checked,recBCS:recBCS.checked,recPreg:recPreg.checked,recWeight:recWeight.checked,recWetDry:recWetDry.checked,fixClass:fixClass.value,fixWetDry:fixWetDry.value};
}

function renderSessionTemplates(){
  if(!window.sessionTemplate)return;
  sessionTemplate.innerHTML='<option value="">None</option>'+(S.sessionTemplates||[]).map(t=>`<option value="${t.id}">${t.name}</option>`).join("");
  renderRecentStations();
}

function loadSessionTemplate(){
  const t=(S.sessionTemplates||[]).find(x=>x.id===sessionTemplate.value);
  if(!t)return;
  const s=t.setup||{};
  ssStation.value=s.station||""; ssYear.value=s.year||new Date().getFullYear(); ssPaddock.value=s.paddock||""; ssMob.value=s.mob||""; ssOperator.value=s.operator||""; ssDate.value=today();
  recClass.checked=!!s.recClass; recAge.checked=!!s.recAge; recBCS.checked=!!s.recBCS; recPreg.checked=!!s.recPreg; recWeight.checked=!!s.recWeight; recWetDry.checked=!!s.recWetDry;
  fixClass.value=s.fixClass||""; fixWetDry.value=s.fixWetDry||"";
  S.draftPens=JSON.parse(JSON.stringify(t.draftPens||[]));
  save(); renderDraftPens();
}

function renderRecentStations(){
  if(!window.recentStationButtons)return;
  const names=[...new Set([...S.profiles.map(p=>p.name),...S.sessions.map(s=>s.station)].filter(Boolean))].slice(0,6);
  recentStationButtons.innerHTML=names.length?'<b>Recent stations: </b>'+names.map(n=>`<button class="recentBtn" onclick="App.pickStation('${n.replaceAll("'","\\'")}')">${n}</button>`).join(""):"";
}

function pickStation(name){
  ssStation.value=name;
  const p=profile(name);
  if(p)profileOut.innerHTML=profileHTML(p);
}

function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");if(id==="home")renderHome();if(id==="crush")setTimeout(()=>$("quickInput").focus(),50);if(id==="tally")renderTally();if(id==="library")renderLibrary();if(id==="annual"){asYear.value ||= new Date().getFullYear(); if(S.active){asStation.value=S.active.station;asYear.value=S.active.year;asPregnant.value=S.records.filter(r=>r.preg&&r.preg!=="E").length;asFemalesMated.value=S.records.length;}}if(id==="bullpower"){bpYear.value ||= new Date().getFullYear(); if(S.active){bpStation.value=S.active.station;bpYear.value=S.active.year;bpFemales.value=S.records.length;}}if(id==="report")renderReport();if(id==="session"){renderSessionTemplates();renderDraftTemplates();renderSessionTemplates();renderDraftPens();renderHome();renderCalvingGuide();}}
function profile(st){return S.profiles.find(p=>(p.name||"").toLowerCase()===(st||"").toLowerCase())}
function riskText(p){let a=[];if(["Likely deficient","Likely marginal"].includes(p.phos))a.push("Phosphorus/nutrition risk flag.");if(["Moderate","High"].includes(p.dryFeed))a.push("Dry-season feed risk flag.");if(p.country==="Northern Forest")a.push("Northern Forest: monitor lactating cow BCS and re-conception closely.");return a.join(" ")||"No major profile risk flags set."}
function profileHTML(p){return `<h3>${p.name}</h3><p><b>${p.country}</b> | ${p.size} | ${p.total||"?"} cattle | ${p.breeders||"?"} breeders | ${p.breed||""}</p><p>Production: heifers +${p.heiferGrowth||0}kg/yr, cows +${p.cowGrowth||0}kg/yr, dry BCS ${p.dryBcs||0}/yr, wet BCS ${p.wetBcs||0}/yr, puberty target ${p.puberty||"?"}kg.</p><p>${riskText(p)}</p>`}
function saveProfile(){let p={id:uid(),name:pfName.value||"Unnamed Station",manager:pfManager.value,region:pfRegion.value,country:pfCountry.value,size:pfSize.value,total:+pfTotal.value||0,breeders:+pfBreeders.value||0,breed:pfBreed.value,joining:pfJoining.value,phos:pfPhos.value,dryFeed:pfDryFeed.value,weaning:pfWeaning.value,heiferGrowth:+pfHeiferGrowth.value||0,cowGrowth:+pfCowGrowth.value||0,dryBcs:+pfDryBcs.value||0,wetBcs:+pfWetBcs.value||0,puberty:+pfPuberty.value||0,targetBcs:+pfTargetBcs.value||3,notes:pfNotes.value,updatedAt:new Date().toISOString()};S.profiles=S.profiles.filter(x=>x.name.toLowerCase()!=p.name.toLowerCase());S.profiles.unshift(p);save();profileOut.innerHTML=profileHTML(p);completeSound();}
function openProfile(id){let p=S.profiles.find(x=>x.id===id);if(!p)return;pfName.value=p.name;pfManager.value=p.manager;pfRegion.value=p.region;pfCountry.value=p.country;pfSize.value=p.size;pfTotal.value=p.total;pfBreeders.value=p.breeders;pfBreed.value=p.breed;pfJoining.value=p.joining;pfPhos.value=p.phos;pfDryFeed.value=p.dryFeed;pfWeaning.value=p.weaning;pfHeiferGrowth.value=p.heiferGrowth;pfCowGrowth.value=p.cowGrowth;pfDryBcs.value=p.dryBcs;pfWetBcs.value=p.wetBcs;pfPuberty.value=p.puberty;pfTargetBcs.value=p.targetBcs;pfNotes.value=p.notes;profileOut.innerHTML=profileHTML(p);show("profile")}
function applyProfileToSession(){if(profile(ssStation.value)){ssYear.value ||= new Date().getFullYear();}}

function selected(id){return Array.from($(id).selectedOptions).map(o=>o.value)}
function renderDraftTemplates(){draftTemplate.innerHTML='<option value="">Manual / none</option>'+S.draftTemplates.map(t=>`<option value="${t.id}">${t.name}</option>`).join("")}
function addDraftPen(){let pen={id:uid(),name:draftName.value||`Pen ${S.draftPens.length+1}`,classes:selected("draftClasses"),wetDry:draftWetDry.value,pregs:selected("draftPregs")};if(!pen.classes.length&&!pen.pregs.length&&pen.wetDry==="ANY"){alert("Pick at least one class, wet/dry filter or preg stage.");return}S.draftPens.push(pen);draftName.value="";save();renderDraftPens()}
function renderDraftPens(){draftPens.innerHTML=S.draftPens.length?S.draftPens.map((p,i)=>`<div class="draftPenItem"><b>${i+1}. ${p.name}</b><br>Classes: ${p.classes.map(c=>classNames[c]).join(", ")||"Any"}<br>Wet/Dry: ${p.wetDry}<br>Preg: ${p.pregs.join(", ")||"Any"} <button onclick="App.removeDraftPen('${p.id}')">Remove</button></div>`).join(""):"No pens selected.";renderCalvingGuide()}
function removeDraftPen(id){S.draftPens=S.draftPens.filter(p=>p.id!==id);save();renderDraftPens()}
function clearDraftPens(){S.draftPens=[];save();renderDraftPens()}
function loadDraftExample(type){S.draftPens=type==="heifers"?[{id:uid(),name:"Pen 1 - Empty heifers",classes:["H","F"],wetDry:"ANY",pregs:["E"]},{id:uid(),name:"Pen 2 - P1-P3 heifers",classes:["H","F"],wetDry:"ANY",pregs:["P1","P2","P3"]},{id:uid(),name:"Pen 3 - P4-P6 heifers",classes:["H","F"],wetDry:"ANY",pregs:["P4","P5","P6"]},{id:uid(),name:"Pen 4 - P7-P9 heifers",classes:["H","F"],wetDry:"ANY",pregs:["P7","P8","P9"]}]:[{id:uid(),name:"Pen 1 - Wet empty cows + dry P8-P9",classes:["W","D"],wetDry:"ANY",pregs:["E","P8","P9"]},{id:uid(),name:"Pen 2 - Dry P1-P6 cows",classes:["D"],wetDry:"ANY",pregs:["P1","P2","P3","P4","P5","P6"]},{id:uid(),name:"Pen 3 - Wet P1-P7 cows",classes:["W"],wetDry:"ANY",pregs:["P1","P2","P3","P4","P5","P6","P7"]},{id:uid(),name:"Pen 4 - Speyed cows / bulls / culls",classes:["S","B","C"],wetDry:"ANY",pregs:[]}];save();renderDraftPens()}
function saveDraftTemplate(){if(!S.draftPens.length){alert("No pens to save.");return}let name=prompt("Template name","Draft template");if(!name)return;S.draftTemplates.unshift({id:uid(),name,pens:JSON.parse(JSON.stringify(S.draftPens))});save();renderDraftTemplates()}
function loadDraftTemplate(){let t=S.draftTemplates.find(x=>x.id===draftTemplate.value);if(!t)return;S.draftPens=JSON.parse(JSON.stringify(t.pens)).map(p=>({...p,id:uid()}));save();renderDraftPens()}

function addMonths(d,m){let x=new Date(d);x.setMonth(x.getMonth()+m);return x}
function month(d){return d.toLocaleDateString("en-AU",{month:"short",year:"numeric"})}
function monthsToCalving(p){return p==="E"?null:Math.max(0,10-pregNo(p))}
function calvingWindow(p,d=ssDate.value||today()){if(p==="E")return"Empty";let m=monthsToCalving(p);return `${month(addMonths(d,m))}–${month(addMonths(d,m+1))}`}
function renderCalvingGuide(){if(!window.calvingGuide)return;let stages=["E","P1","P2","P3","P4","P5","P6","P7","P8","P9"];calvingGuide.innerHTML="<h4>Calving guide for draft splits</h4>"+stages.map(s=>`<div><b>${s}</b>: ${calvingWindow(s)}</div>`).join("")}

const fields=[{k:"classCode",label:"CLASS",on:s=>s.recClass,fixed:s=>s.fixClass,prompt:"ENTER CLASS",hint:"H/F/W/D/C/S/B",auto:true,val:v=>["H","F","W","D","C","S","B"].includes(v)?v:null,disp:v=>classNames[v]},{k:"age",label:"AGE",on:s=>s.recAge,fixed:s=>null,prompt:"ENTER AGE",hint:"0-9",auto:true,val:v=>/^[0-9]$/.test(v)?+v:null,disp:v=>v},{k:"bcs",label:"BCS",on:s=>s.recBCS,fixed:s=>null,prompt:"ENTER BCS 1-5",hint:"1-5",auto:true,val:v=>/^[1-5]$/.test(v)?+v:null,disp:v=>v},{k:"preg",label:"PREG",on:s=>s.recPreg,fixed:s=>null,prompt:"ENTER PREG P1-P9",hint:"E or 1-9",auto:true,val:v=>v==="E"?"E":(/^[1-9]$/.test(v)?"P"+v:/^P[1-9]$/.test(v)?v:null),disp:v=>v},{k:"weight",label:"WEIGHT",on:s=>s.recWeight,fixed:s=>null,prompt:"ENTER WEIGHT",hint:"kg + Enter",auto:false,val:v=>+v>0?+v:null,disp:v=>`${v}kg`},{k:"wetDry",label:"WET/DRY",on:s=>s.recWetDry,fixed:s=>s.fixWetDry,prompt:"ENTER WET/DRY",hint:"W or D",auto:true,val:v=>["W","WET"].includes(v)?"Wet":["D","DRY"].includes(v)?"Dry":null,disp:v=>v}];
function activeFields(){let s=S.active;return fields.filter(f=>f.on(s)||f.fixed(s))}
function resetAnimal(){S.animal={id:uid(),time:new Date().toISOString()};fields.forEach(f=>S.animal[f.k]=S.active?f.fixed(S.active)||null:null)}
function nextIdx(){let af=activeFields();for(let i=0;i<af.length;i++)if(S.animal[af[i].k]===null||S.animal[af[i].k]==="")return i;return af.length}
function startSession(){let p=profile(ssStation.value);S.active={id:uid(),station:ssStation.value||"Unnamed Station",year:+ssYear.value||new Date().getFullYear(),paddock:ssPaddock.value,mob:ssMob.value,operator:ssOperator.value,date:ssDate.value||today(),profile:p?.id||null,country:p?.country||"",recClass:recClass.checked,recAge:recAge.checked,recBCS:recBCS.checked,recPreg:recPreg.checked,recWeight:recWeight.checked,recWetDry:recWetDry.checked,fixClass:fixClass.value,fixWetDry:fixWetDry.value,draftPens:JSON.parse(JSON.stringify(S.draftPens))};S.records=[];resetAnimal();save();show("crush");renderCrush()}
function assignDraft(r){for(let p of S.active.draftPens||[]){let okC=!p.classes.length||p.classes.includes(r.classCode),okW=p.wetDry==="ANY"||p.wetDry===r.wetDry,okP=!p.pregs.length||p.pregs.includes(r.preg);if(okC&&okW&&okP)return p.name}if(r.classCode==="S")return"Speyed cows";if(r.classCode==="B")return"Bulls";if(r.classCode==="C")return"Cull cows";return"Unallocated"}
function saveAnimal(){let r={...S.animal,station:S.active.station,year:S.active.year,paddock:S.active.paddock,mob:S.active.mob,date:S.active.date};r.draft=assignDraft(r);S.records.push(r);resetAnimal();completeSound();document.body.classList.remove("savedFlash");void document.body.offsetWidth;document.body.classList.add("savedFlash");save();renderCrush(`SAVED ✓ ${r.draft}`)}
function handleValue(v){if(!S.active)return;let af=activeFields(),idx=nextIdx();if(idx>=af.length){saveAnimal();return}let f=af[idx],val=f.val(String(v).toUpperCase());if(val===null){setStatus(`Invalid ${f.label}`,"error");errorSound();return}S.animal[f.k]=val;if(nextIdx()>=af.length)saveAnimal();else{beep(650,.05);renderCrush(`Recorded ${f.label}: ${f.disp(val)}`)}}
function renderCrush(msg="Ready"){headCount.textContent=S.records.length;animalNo.textContent=S.records.length+1;sessionBanner.textContent=S.active?`${S.active.station} | ${S.active.year} | ${S.active.paddock} | ${S.active.mob}`:"No active session";let idx=nextIdx(),af=S.active?activeFields():[];prompt.textContent=S.active?(idx>=af.length?"SAVED AUTOMATICALLY":af[idx].prompt):"START SESSION";fieldStack.innerHTML=af.map((f,i)=>{let val=S.animal[f.k],done=val!==null&&val!=="";let cls=done?"done":i===idx?"current":"";return `<div class="fieldBox ${cls}"><div class="fieldLabel">${f.label}</div><div class="fieldValue">${done?f.disp(val):f.hint}</div><div class="fieldIcon">${done?"✅":i===idx?"➡️":"⬜"}</div></div>`}).join("");setStatus(msg,"saved");let preg=S.records.filter(r=>r.preg&&r.preg!=="E").length,empty=S.records.filter(r=>r.preg==="E").length;livePreg.textContent=preg;liveEmpty.textContent=empty;livePregPct.textContent=pct(preg,S.records.length)+"%";let counts={};S.records.forEach(r=>counts[r.draft]=(counts[r.draft]||0)+1);let names=[...(S.active?.draftPens||[]).map(p=>p.name),"Unallocated","Speyed cows","Bulls","Cull cows"];draftBoard.innerHTML=[...new Set(names)].map(n=>`<div class="draftItem ${counts[n]?'draftHit':''}"><b>${counts[n]||0}</b> ${n}</div>`).join("");lastFive.innerHTML=S.records.slice(-5).reverse().map((r,i)=>`<div class="lastItem">#${S.records.length-i} ${classNames[r.classCode]||""} BCS ${r.bcs??"-"} ${r.preg??""} → ${r.draft}</div>`).join("")}
function setStatus(m,cls){status.textContent=m;status.className="status "+cls}
function finishSession(){if(!S.active)return;S.sessions.unshift({...S.active,records:[...S.records],finishedAt:new Date().toISOString()});S.active=null;S.records=[];save();completeSound();show("library")}
function undoLast(){if(S.records.length){S.records.pop();save();renderCrush("Undid last animal");errorSound()}}
quickInput.addEventListener("keydown",e=>{if(e.key==="F1"){e.preventDefault();undoLast();return}if(!S.active)return;let f=activeFields()[nextIdx()];if(!f)return;if(f.auto&&e.key.length===1){e.preventDefault();handleValue(e.key);quickInput.value=""}else if(!f.auto&&e.key==="Enter"){e.preventDefault();handleValue(quickInput.value);quickInput.value=""}});


const tallyInputMap=[
  ["Calves","ytCalves"],
  ["Weaners","ytWeaners"],
  ["Maiden heifers","ytMaidenHeifers"],
  ["First-lactation heifers","ytFirstLactationHeifers"],
  ["Wet cows","ytWetCows"],
  ["Dry cows","ytDryCows"],
  ["Cull cows","ytCullCows"],
  ["Speyed cows","ytSpeyedCows"],
  ["Bulls","ytBulls"]
];

function syncTallyInputs(){
  if(!window.ytCalves)return;
  tallyInputMap.forEach(([name,id])=>{const el=$(id); if(el) el.value=S.tally[name]||0;});
}

function updateTallyFromInputs(){
  if(!window.ytCalves)return;
  const next={};
  tallyInputMap.forEach(([name,id])=>{
    const n=+($(id)?.value||0);
    if(n>0)next[name]=n;
  });
  S.tally=next;
  renderTally(false);
}

function crushSideClassCounts(records){
  const out={"Calves":0,"Weaners":0,"Maiden heifers":0,"First-lactation heifers":0,"Wet cows":0,"Dry cows":0,"Cull cows":0,"Speyed cows":0,"Bulls":0};
  records.forEach(r=>{
    if(r.classCode==="H")out["Maiden heifers"]++;
    else if(r.classCode==="F")out["First-lactation heifers"]++;
    else if(r.classCode==="W"||r.wetDry==="Wet")out["Wet cows"]++;
    else if(r.classCode==="D"||r.wetDry==="Dry")out["Dry cows"]++;
    else if(r.classCode==="C")out["Cull cows"]++;
    else if(r.classCode==="S")out["Speyed cows"]++;
    else if(r.classCode==="B")out["Bulls"]++;
  });
  return out;
}

function latestTallyForSession(session){
  if(!session)return null;
  const candidates=(S.tallies||[]).filter(t=>t.station===session.station && Number(t.year)===Number(session.year) && (!session.mob || !t.mob || t.mob===session.mob));
  return candidates[0]||null;
}

function mergedClassCounts(records, session){
  const crush=crushSideClassCounts(records);
  const saved=latestTallyForSession(session);
  const yard=saved?{...(saved.counts||{})}:{};
  const classes=["Calves","Weaners","Maiden heifers","First-lactation heifers","Wet cows","Dry cows","Cull cows","Speyed cows","Bulls"];
  const merged={};
  classes.forEach(k=>{
    // Use yard-entered number where present. Otherwise fall back to crush-side class count.
    merged[k]=(yard[k]!==undefined && yard[k]!==null) ? yard[k] : (crush[k]||0);
  });
  return {crush,yard,merged,saved};
}

function mergedTallyHtml(records, session){
  const m=mergedClassCounts(records,session);
  const total=Object.values(m.merged).reduce((a,b)=>a+(+b||0),0);
  const cows=(+m.merged["Wet cows"]||0)+(+m.merged["Dry cows"]||0)+(+m.merged["Cull cows"]||0)+(+m.merged["Speyed cows"]||0);
  const calves=+m.merged["Calves"]||0, weaners=+m.merged["Weaners"]||0;
  return `<h3>Merged yard + crush tally</h3>
  <p>${m.saved?`Using saved yard tally: <b>${m.saved.mob||"mob"}</b>. Yard-entered totals override crush class counts where entered.`:"No saved yard tally found for this station/year/mob. Using crush-side class counts only."}</p>
  <table class="table"><tr><th>Class</th><th>Yard total</th><th>Crush-side</th><th>Final report number</th></tr>
  ${Object.keys(m.merged).map(k=>`<tr><td>${k}</td><td>${m.yard[k]??"-"}</td><td>${m.crush[k]||0}</td><td><b>${m.merged[k]||0}</b></td></tr>`).join("")}</table>
  <p><b>Total cattle counted:</b> ${total}</p>
  <p><b>Calving/branding estimate:</b> ${pct(calves,cows)}% &nbsp; <b>Weaning estimate:</b> ${pct(weaners,cows)}%</p>`;
}

function addTally(k){S.tally[k]=(S.tally[k]||0)+1;beep(700,.04);renderTally();syncTallyInputs()}
function clearCurrentTally(){S.tally={};renderTally();syncTallyInputs()}
function renderTally(shouldSync=true){if(S.active){tyStation.value=S.active.station;tyYear.value=S.active.year;tyPaddock.value=S.active.paddock;tyMob.value=S.active.mob;tyTested.value=S.records.length;tyPregnant.value=S.records.filter(r=>r.preg&&r.preg!=="E").length}else tyYear.value ||= new Date().getFullYear();let total=Object.values(S.tally).reduce((a,b)=>a+b,0),cows=(S.tally["Wet cows"]||0)+(S.tally["Dry cows"]||0)+(S.tally["Cull cows"]||0)+(S.tally["Speyed cows"]||0),calves=S.tally.Calves||0,weaners=S.tally.Weaners||0;if(shouldSync)syncTallyInputs();tallyOut.innerHTML=`<h3>Current tally: ${total} head</h3><table class="table"><tr><th>Class</th><th>Head</th></tr>${Object.keys(S.tally).sort().map(k=>`<tr><td>${k}</td><td>${S.tally[k]}</td></tr>`).join("")}</table><p>Calving/branding estimate: ${pct(calves,cows)}%. Weaning estimate: ${pct(weaners,cows)}%.</p>`}
function saveTally(){updateTallyFromInputs();let t={id:uid(),station:tyStation.value||"Unnamed Station",year:+tyYear.value||new Date().getFullYear(),paddock:tyPaddock.value,mob:tyMob.value,joined:+tyJoined.value||0,tested:+tyTested.value||0,pregnant:+tyPregnant.value||0,notes:tyNotes.value,counts:{...S.tally},date:new Date().toISOString()};S.tallies.unshift(t);S.tally={};save();completeSound();renderTally()}

function benchmark(country){let b=countryBenchmark(country);return {preg:b.preg,wean:b.weaner.median,lowBcs:20,loss:b.loss,missing:b.missing,weaner:b.weaner}}
function projectionRows(records){let p=profile(S.active?.station)||{},target=p.targetBcs||3;let groups=[["Maiden heifers",r=>r.classCode==="H",p.heiferGrowth||0,p.dryBcs||0],["First-lactation heifers",r=>r.classCode==="F",p.heiferGrowth||0,p.wetBcs||0],["Wet cows",r=>r.classCode==="W"||r.wetDry==="Wet",p.cowGrowth||0,p.wetBcs||0],["Dry cows",r=>r.classCode==="D"||r.wetDry==="Dry",p.cowGrowth||0,p.dryBcs||0]];return groups.map(g=>{let x=records.filter(g[1]),aw=avg(x.map(r=>r.weight)),ab=avg(x.map(r=>r.bcs));return {name:g[0],n:x.length,aw,projW:aw?aw+g[2]:null,ab,projB:ab?Math.max(1,Math.min(5,ab+g[3])):null,below:pct(x.filter(r=>r.bcs&&r.bcs<target).length,x.length),pub:p.puberty&&aw?aw+g[2]>=p.puberty:null}}).filter(x=>x.n)}
function calvDist(records){let o={};records.filter(r=>r.preg&&r.preg!=="E").forEach(r=>{let w=calvingWindow(r.preg,S.active?.date||today());o[w]=(o[w]||0)+1});return o}
function renderReport(){let rec=S.records.length?S.records:(S.sessions[0]?.records||[]);if(!rec.length){reportSummary.innerHTML="No current or saved session selected.";return}let session=S.active||S.sessions[0],p=profile(session.station),b=benchmark(p?.country);let preg=rec.filter(r=>r.preg&&r.preg!=="E").length,empty=rec.filter(r=>r.preg==="E").length,low=pct(rec.filter(r=>r.bcs&&r.bcs<=(p?.targetBcs||3)-1).length,rec.length);reportSummary.innerHTML=`<h3>${session.station} — ${session.year} — ${session.paddock} — ${session.mob}</h3><p>Total ${rec.length}; Pregnant ${preg} (${pct(preg,rec.length)}%); Empty ${empty}; Low BCS risk ${low}%.</p>`;profileCard.innerHTML=p?profileHTML(p):"No station profile.";const annual=latestAnnual(session.station);const ak=annual?annualKpis(annual):null;kpiCard.innerHTML=`<h3>North Australia KPI checks</h3><p>Pregnancy: ${pct(preg,rec.length)}% vs benchmark ${b.preg}%.</p><p>Low BCS: ${low}% vs target max ${b.lowBcs}%.</p>${ak?`<p>Weaner production: ${ak.weanerProd} kg/cow vs median ${b.weaner.median}.</p><p>Calf loss: ${ak.calfLoss}% vs ${b.loss}%. Missing cows: ${ak.missing}% vs ${b.missing}%.</p>`:"<p>No annual schedule saved yet.</p>"}<p>${riskText(p||{})}</p>`;let rows=projectionRows(rec);forecastCard.innerHTML=`<h3>12 month forecast</h3><table class="table"><tr><th>Group</th><th>Head</th><th>Wt now</th><th>Wt 12m</th><th>BCS now</th><th>BCS 12m</th><th>Puberty</th></tr>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.n}</td><td>${r.aw?r.aw.toFixed(0):"N/A"}</td><td>${r.projW?r.projW.toFixed(0):"N/A"}</td><td>${r.ab?r.ab.toFixed(1):"N/A"}</td><td>${r.projB?r.projB.toFixed(1):"N/A"}</td><td>${r.pub===null?"N/A":r.pub?"On track":"Below target"}</td></tr>`).join("")}</table>`;advisoryCard.innerHTML=`<h3>Veterinary advisory</h3><ul class="actionList">${advisory(rec,session,annual).map(x=>`<li>${x}</li>`).join("")}</ul><h4>Action groups</h4><p>Feedbase • Lactation • Health/stress/predators • Breeding</p>`;businessCard.innerHTML=ak?`<h3>Business / BRICK-style KPIs</h3><p>Gross margin: $${ak.grossMargin.toLocaleString()}</p><p>Operating margin: $${ak.operatingMargin.toLocaleString()}</p><p>Return on cattle capital: ${ak.returnOnCattleCapital}%</p><p>Annual liveweight production: ${ak.lwProd} kg/cow</p>`:"<h3>Business / BRICK-style KPIs</h3><p>Add an annual schedule to calculate gross margin, operating margin and liveweight production.</p>";const bp=(S.bullPower||[]).find(x=>x.station===session.station);bullPowerCard.innerHTML=bp?`<h3>Bull Power</h3><p>Recommended bulls: ${bp.result.recommended}</p><p>Minimum: ${bp.result.minBulls}; capacity/bull: ${bp.result.bullCapacity} matings.</p>`:"<h3>Bull Power</h3><p>No bull power calculation saved.</p>";if(window.mergedTallyCard)mergedTallyCard.innerHTML=mergedTallyHtml(rec,session);drawCharts(rec,rows,b)}
function clearCharts(){charts.forEach(c=>c.destroy());charts=[]}
function chart(id,type,labels,datasets){charts.push(new Chart($(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,scales:type==="bar"?{y:{beginAtZero:true}}:{}}}))}
function drawCharts(rec,rows,b){clearCharts();let cls=["H","F","W","D","C","S","B"];chart("chartPregClass","bar",cls.map(c=>classNames[c]),[{label:"Preg %",data:cls.map(c=>{let x=rec.filter(r=>r.classCode===c);return pct(x.filter(r=>r.preg&&r.preg!=="E").length,x.length)})}]);let stages=["E","P1","P2","P3","P4","P5","P6","P7","P8","P9"];chart("chartStage","bar",stages,[{label:"Head by preg stage",data:stages.map(s=>rec.filter(r=>r.preg===s).length)}]);chart("chartSeason","bar",["In-season est P1-P6","Out-of-season est P7-P9"],[{label:"%",data:[pct(rec.filter(r=>pregNo(r.preg)>=1&&pregNo(r.preg)<=6).length,rec.filter(r=>r.preg&&r.preg!=="E").length),pct(rec.filter(r=>pregNo(r.preg)>=7).length,rec.filter(r=>r.preg&&r.preg!=="E").length)]}]);chart("chartBCS","bar",["1","2","3","4","5"],[{label:"Preg % by BCS",data:[1,2,3,4,5].map(v=>{let x=rec.filter(r=>r.bcs===v);return pct(x.filter(r=>r.preg&&r.preg!=="E").length,x.length)})}]);let bands=["<300","300-349","350-399","400-449","450+"];let band=w=>w<300?"<300":w<350?"300-349":w<400?"350-399":w<450?"400-449":"450+";let h=rec.filter(r=>["H","F"].includes(r.classCode)&&r.weight);chart("chartHeiferWeight","bar",bands,[{label:"Heifer preg % by weight",data:bands.map(bb=>{let x=h.filter(r=>band(r.weight)===bb);return pct(x.filter(r=>r.preg&&r.preg!=="E").length,x.length)})}]);let cd=calvDist(rec);chart("chartCalving","bar",Object.keys(cd),[{label:"Expected calvings",data:Object.values(cd)}]);chart("chartProjection","bar",rows.map(r=>r.name),[{label:"Weight now",data:rows.map(r=>r.aw||0)},{label:"Projected 12m",data:rows.map(r=>r.projW||0)}]);chart("chartBenchmark","bar",["Preg %","Low BCS max"],[{label:"This session",data:[pct(rec.filter(r=>r.preg&&r.preg!=="E").length,rec.length),pct(rec.filter(r=>r.bcs&&r.bcs<=2).length,rec.length)]},{label:"Benchmark",data:[b.preg,b.lowBcs]}]);let st=S.active?.station||S.sessions[0]?.station;let t=S.tallies.filter(x=>x.station===st);chart("chartProduction","bar",t.map(x=>`${x.year} ${x.mob}`),[{label:"Weaning %",data:t.map(x=>pct(x.counts.Weaners||0,x.joined||x.pregnant))},{label:"Calving/branding %",data:t.map(x=>pct(x.counts.Calves||0,x.joined||x.pregnant))}]);let annuals=(S.annualSchedules||[]).filter(x=>x.station===st).sort((a,b)=>a.year-b.year);chart("chartWeanerProd","bar",annuals.map(a=>a.year),[{label:"Weaner production kg/cow",data:annuals.map(a=>annualKpis(a).weanerProd)},{label:"Median benchmark",data:annuals.map(a=>b.weaner.median)}]);chart("chartAnnualTrend","line",annuals.map(a=>a.year),[{label:"Preg %",data:annuals.map(a=>annualKpis(a).pregRate)},{label:"Calf loss %",data:annuals.map(a=>annualKpis(a).calfLoss)},{label:"Missing cows %",data:annuals.map(a=>annualKpis(a).missing)}]);if(window.chartMergedTally){let session=S.active||S.sessions[0];let mc=mergedClassCounts(rec,session).merged;chart("chartMergedTally","bar",Object.keys(mc),[{label:"Final merged head count",data:Object.values(mc)}])}}

function countryBenchmark(country){return {
  "Southern Forest":{weaner:{low:164,median:191,top:240},p4m:74,preg:87,loss:5,missing:8,steerGain:190},
  "Central Forest":{weaner:{low:161,median:195,top:220},p4m:77,preg:88,loss:6,missing:6,steerGain:180},
  "Northern Downs":{weaner:{low:135,median:163,top:183},p4m:68,preg:82,loss:7,missing:7,steerGain:170},
  "Northern Forest":{weaner:{low:74,median:93,top:112},p4m:17,preg:66,loss:14,missing:12,steerGain:100},
  "Mixed / Other":{weaner:{low:135,median:163,top:183},p4m:68,preg:82,loss:7,missing:7,steerGain:160}
}[country||"Mixed / Other"]}

function annualKpis(a){
  const weanerProd = a.retainedCows ? (a.weaners / a.retainedCows) * a.weanerWeight : 0;
  const pregRate = a.femalesMated ? pct(a.pregnant, a.femalesMated) : 0;
  const calfLoss = a.pregnant ? pct(Math.max(0, a.pregnant - a.weaners), a.pregnant) : 0;
  const missing = a.cowsLastYear ? pct(Math.max(0, a.cowsLastYear - a.cowsMustered), a.cowsLastYear) : 0;
  const brandingRate = a.femalesMated ? pct(a.branders, a.femalesMated) : 0;
  const grossMargin = (a.income||0) - (a.varCosts||0);
  const operatingMargin = grossMargin - (a.fixedCosts||0);
  const avgCapital = ((a.openCapital||0) + (a.closeCapital||0)) / 2;
  const returnOnCattleCapital = avgCapital ? Math.round((operatingMargin / avgCapital) * 1000) / 10 : 0;
  const lwProd = a.retainedCows ? ((a.cowWeight||0) * (1 - missing/100) + (a.weanerWeight||0) * (a.weaners/a.retainedCows || 0) - (a.cowWeightLast||a.cowWeight||0)) : 0;
  return {weanerProd:Math.round(weanerProd),pregRate,calfLoss,missing,brandingRate,grossMargin,operatingMargin,returnOnCattleCapital,lwProd:Math.round(lwProd)};
}

function collectAnnualForm(){
  return {id:uid(),station:asStation.value||"Unnamed Station",year:+asYear.value||new Date().getFullYear(),
  retainedCows:+asRetainedCows.value||0,femalesMated:+asFemalesMated.value||0,pregnant:+asPregnant.value||0,weaners:+asWeaners.value||0,weanerWeight:+asWeanerWeight.value||0,
  cowsMustered:+asCowsMustered.value||0,cowsLastYear:+asCowsLastYear.value||0,branders:+asBranders.value||0,cowWeight:+asCowWeight.value||0,cowWeightLast:+asCowWeightLast.value||0,
  openCapital:+asOpenCapital.value||0,closeCapital:+asCloseCapital.value||0,income:+asIncome.value||0,varCosts:+asVarCosts.value||0,fixedCosts:+asFixedCosts.value||0,ae:+asAE.value||0,notes:asNotes.value||"",
  classCounts:{weaners:+asClassWeaners.value||0,h1:+asClassH1.value||0,h2:+asClassH2.value||0,cows:+asClassCows.value||0,speys:+asClassSpeys.value||0,bulls:+asClassBulls.value||0,males:+asClassMales.value||0,saleWeight:+asSaleWeight.value||0},savedAt:new Date().toISOString()};
}

function calculateAnnualPreview(){
  const a=collectAnnualForm(), p=profile(a.station), b=countryBenchmark(p?.country);
  const k=annualKpis(a);
  annualOut.innerHTML=`<h3>${a.station} ${a.year}</h3>
  <span class="kpiBadge">Weaner production: <b>${k.weanerProd} kg/cow</b> vs median ${b.weaner.median}</span>
  <span class="kpiBadge">Annual pregnancy: <b>${k.pregRate}%</b> vs ${b.preg}%</span>
  <span class="kpiBadge">Calf loss: <b>${k.calfLoss}%</b> vs ${b.loss}%</span>
  <span class="kpiBadge">Pregnant/mustered cows missing: <b>${k.missing}%</b> vs ${b.missing}%</span>
  <span class="kpiBadge">Branding rate: <b>${k.brandingRate}%</b></span>
  <span class="kpiBadge">Annual liveweight production: <b>${k.lwProd} kg/cow</b></span>
  <span class="kpiBadge">Gross margin: <b>$${k.grossMargin.toLocaleString()}</b></span>
  <span class="kpiBadge">Operating margin: <b>$${k.operatingMargin.toLocaleString()}</b></span>
  <span class="kpiBadge">Return on cattle capital: <b>${k.returnOnCattleCapital}%</b></span>`;
  return {a,k,b};
}

function saveAnnualSchedule(){
  const {a}=calculateAnnualPreview();
  S.annualSchedules.unshift(a);
  save(); completeSound();
}

function bullPowerCalc(){
  const calves=+bpCalves.value||0, wastage=(+bpWastage.value||0)/100, cycles=+bpCycles.value||1.5, matings=+bpMatings.value||2, peak=(+bpPeakPct.value||75)/100, days=+bpPeakDays.value||62, cap=+bpCapacity.value||5, backup=+bpBackup.value||0;
  const femaleMatings = (calves / Math.max(0.01, (1-wastage))) * cycles * matings * peak;
  const bullCapacity = cap * days;
  const minBulls = Math.ceil(femaleMatings / bullCapacity);
  const recommended = minBulls + backup;
  return {femaleMatings:Math.round(femaleMatings),bullCapacity,minBulls,recommended};
}

function calculateBullPower(){
  const r=bullPowerCalc(), available=+bpAvailable.value||0;
  bullPowerOut.innerHTML=`<h3>Bull Power Result</h3>
  <p><b>Peak mating demand:</b> ${r.femaleMatings} matings</p>
  <p><b>Capacity per sound bull:</b> ${r.bullCapacity} matings over peak period</p>
  <p><b>Minimum sound bulls:</b> ${r.minBulls}</p>
  <p><b>Recommended with backup:</b> ${r.recommended}</p>
  <p>${available?`Available bulls: ${available}. ${available>=r.recommended?'<span class="good">Adequate.</span>':'<span class="bad">Short by '+(r.recommended-available)+' bulls.</span>'}`:""}</p>`;
  return r;
}

function saveBullPower(){
  const r=calculateBullPower();
  S.bullPower.unshift({id:uid(),station:bpStation.value||"Unnamed Station",year:+bpYear.value||new Date().getFullYear(),inputs:{females:+bpFemales.value||0,calves:+bpCalves.value||0,wastage:+bpWastage.value||0,cycles:+bpCycles.value||0,matings:+bpMatings.value||0,peakPct:+bpPeakPct.value||0,peakDays:+bpPeakDays.value||0,capacity:+bpCapacity.value||0,backup:+bpBackup.value||0,available:+bpAvailable.value||0},result:r,savedAt:new Date().toISOString()});
  save(); completeSound();
}

function latestAnnual(station){return (S.annualSchedules||[]).filter(a=>a.station===station).sort((a,b)=>b.year-a.year)[0]}
function advisory(rec, session, annual){
  const p=profile(session.station)||{}, b=countryBenchmark(p.country), k=annual?annualKpis(annual):null;
  const pregRate=pct(rec.filter(r=>r.preg&&r.preg!=="E").length,rec.length);
  const lowBcs=pct(rec.filter(r=>r.bcs&&r.bcs<3).length,rec.length);
  const firstLact=pct(rec.filter(r=>r.classCode==="F").length,rec.length);
  const lateCalv=pct(rec.filter(r=>pregNo(r.preg)>=7).length,rec.filter(r=>r.preg&&r.preg!=="E").length);
  let flags=[];
  if(pregRate < b.preg) flags.push("Annual pregnancy/session pregnancy is below country-type benchmark: investigate nutrition, disease and joining management.");
  if(lowBcs > 20) flags.push("High proportion below BCS 3: prioritise feed budgeting, supplementation economics and early weaning.");
  if(firstLact > 15) flags.push("Large first-lactation component: manage separately because this class is a known reproduction risk group.");
  if(lateCalv > 20) flags.push("High P7-P9/early-calving or spread signal: use foetal age drafting to segregate nutrition and tighten management.");
  if(p.phos==="Likely deficient"||p.phos==="Likely marginal") flags.push("Phosphorus deficiency risk: review wet-season P supplementation and response economics.");
  if(k && k.calfLoss > b.loss) flags.push("Calf loss is above benchmark: consider pestivirus/vibriosis, mustering around calving, predation, heat/humidity and cows with prior calf loss.");
  if(k && k.missing > b.missing) flags.push("Pregnant/mustered cows missing is above benchmark: check mortality, mustering efficiency and dry-season feed risk.");
  if(!flags.length) flags.push("No major red flags detected against the current inputs; build station history over multiple years to refine benchmarks.");
  return flags;
}

function renderLibrary(){let names=[...new Set([...S.profiles.map(p=>p.name),...S.sessions.map(s=>s.station),...S.tallies.map(t=>t.station),...(S.annualSchedules||[]).map(a=>a.station),...(S.bullPower||[]).map(b=>b.station)])];libraryOut.innerHTML=names.sort().map(n=>{let prof=profile(n),sessions=S.sessions.filter(s=>s.station===n),tallies=S.tallies.filter(t=>t.station===n),annuals=(S.annualSchedules||[]).filter(a=>a.station===n),bps=(S.bullPower||[]).filter(b=>b.station===n);let years=[...new Set([...sessions.map(s=>s.year),...tallies.map(t=>t.year),...annuals.map(a=>a.year),...bps.map(b=>b.year)])].sort((a,b)=>b-a);return `<div class="panel"><h3>📁 ${n}</h3>${prof?`<div class="row">Profile: ${prof.country} ${prof.total||"?"} cattle <button onclick="App.openProfile('${prof.id}')">Open</button></div>`:""}${years.map(y=>`<div class="row"><b>📂 ${y}</b> ${sessions.filter(s=>s.year==y).length} preg sessions, ${tallies.filter(t=>t.year==y).length} tallies, ${annuals.filter(a=>a.year==y).length} annual schedules, ${bps.filter(b=>b.year==y).length} bull power</div>`).join("")}</div>`}).join("")||"No station data yet."}
function exportCSV(){let rows=[["Station","Year","Paddock","Mob","Class","Age","BCS","Preg","Weight","WetDry","Draft"]];S.records.forEach(r=>rows.push([r.station,r.year,r.paddock,r.mob,classNames[r.classCode]||r.classCode,r.age??"",r.bcs??"",r.preg??"",r.weight??"",r.wetDry??"",r.draft]));let csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="station_stats_records.csv";a.click()}
function beep(f,d=.08){try{let c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=f;o.start();o.stop(c.currentTime+d)}catch(e){}}
function completeSound(){beep(900,.12);setTimeout(()=>beep(1250,.14),140)}
function errorSound(){beep(220,.15)}
function clearAll(){if(confirm("Clear all local data?")){localStorage.removeItem(KEY);location.reload()}}
load();ssDate.value=today();ssYear.value=new Date().getFullYear();tyYear.value=new Date().getFullYear();if(window.asYear)asYear.value=new Date().getFullYear();if(window.bpYear)bpYear.value=new Date().getFullYear();renderDraftTemplates();renderSessionTemplates();renderDraftPens();renderHome();
return {show,quickStart,sessionPreset,copyLastSessionSetup,saveSessionTemplate,loadSessionTemplate,pickStation,saveProfile,openProfile,applyProfileToSession,addDraftPen,removeDraftPen,clearDraftPens,loadDraftExample,saveDraftTemplate,loadDraftTemplate,renderCalvingGuide,startSession,finishSession,addTally,clearCurrentTally,saveTally,renderLibrary,renderReport,exportCSV,saveAnnualSchedule,calculateAnnualPreview,calculateBullPower,saveBullPower,updateTallyFromInputs,clearAll}
})();