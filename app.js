const HerdIQ=(()=>{const KEY="HERDIQ_1_0", LEGACY_KEYS=["HERDIQ_V60","HERDIQ_V52","HERDIQ_V51","HERDIQ_V50"], DB_NAME="HERDIQ_OFFLINE", DB_STORE="snapshots";
const classNames={H:"Heifer",C:"Cow",S:"Speyed",A:"Aged"};
const wetDryNames={W:"Wet",D:"Dry"};
const pregStages=["E","P1","P2","P3","P4","P5","P6","P7","P8","P9"];
const yardClasses=["Calves","Weaners","Bulls","Steers","Mickies","Speyed cows","Cull cows","Other"];
let S={stations:[],sessions:[],calendarEvents:[],economicScenarios:[],bullPowerScenarios:[],evidenceRuns:[],active:null,records:[],draftRules:[],yard:{},animal:{}};let charts=[];
const $=id=>document.getElementById(id), uid=()=>crypto.randomUUID(), today=()=>new Date().toISOString().slice(0,10);
const pct=(n,d)=>d?Math.round(n/d*100):0;const avg=a=>{let v=a.filter(x=>x!==null&&x!==undefined&&!isNaN(x));return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};const pregNo=p=>!p||p==="E"?0:Number(String(p).replace("P",""));
function openDb(){return new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error("IndexedDB unavailable"));let q=indexedDB.open(DB_NAME,1);q.onupgradeneeded=()=>{let db=q.result;if(!db.objectStoreNames.contains(DB_STORE))db.createObjectStore(DB_STORE)};q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)})}
async function mirrorToDb(){try{let db=await openDb(),tx=db.transaction(DB_STORE,"readwrite");tx.objectStore(DB_STORE).put({savedAt:new Date().toISOString(),state:S},"latest");await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();renderStorageStatus()}catch(e){console.warn("Offline mirror failed",e)}}
async function recoverFromDb(){try{let db=await openDb(),tx=db.transaction(DB_STORE,"readonly"),q=tx.objectStore(DB_STORE).get("latest");let row=await new Promise((res,rej)=>{q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)});db.close();if(row?.state&&!localStorage.getItem(KEY)){localStorage.setItem(KEY,JSON.stringify(row.state));location.reload()}}catch(e){console.warn("Offline recovery unavailable",e)}}
function save(){S.meta??={};S.meta.lastSaved=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(S));mirrorToDb()}function load(){let r=localStorage.getItem(KEY);if(!r)for(let k of LEGACY_KEYS){r=localStorage.getItem(k);if(r)break}if(r)S=JSON.parse(r);else setTimeout(recoverFromDb,0);S.stations??=[];S.sessions??=[];S.calendarEvents??=[];S.economicScenarios??=[];S.bullPowerScenarios??=[];S.evidenceRuns??=[];S.records??=[];S.draftRules??=[];S.draftRules.forEach(r=>r.wetDry??=[]);S.yard??={};S.animal??={}}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");if(id==="home")renderHome();if(id==="setup"){renderDraftRules();renderCalvingGuide()}if(id==="crush"){renderCrush()}if(id==="endmob")renderYardInputs();if(id==="calendar")renderCalendar();if(id==="economics"){if(S.active&&!ecoStation.value)ecoStation.value=S.active.station;loadStrategyDefaults();}if(id==="bullpower"){if(S.active&&!bpStation.value){bpStation.value=S.active.station;bpYear.value=S.active.year;bpFemales.value=S.records.length||1000;}if(!bpYear.value)bpYear.value=new Date().getFullYear();}if(id==="evidence"){if(S.active&&!evStation.value){evStation.value=S.active.station;evYear.value=S.active.year;}if(!evYear.value)evYear.value=new Date().getFullYear();}if(id==="report")renderReport();if(id==="history")renderHistory()}
function station(name){return S.stations.find(s=>(s.name||"").toLowerCase()===(name||"").toLowerCase())}
function benchmark(country){return {"Southern Forest":{preg:87,weaner:191,loss:5,missing:8},"Central Forest":{preg:88,weaner:195,loss:6,missing:6},"Northern Downs":{preg:82,weaner:163,loss:7,missing:7},"Northern Forest":{preg:66,weaner:93,loss:14,missing:12},"Mixed / Other":{preg:82,weaner:163,loss:7,missing:7}}[country||"Mixed / Other"]}
function renderHome(){let a=S.active,l=S.sessions[0];homeSummary.innerHTML=`<p>${a?`<b>Active:</b> ${a.station} / ${a.mob} — ${S.records.length} females recorded`:"No active session."}</p><p>${l?`<b>Last:</b> ${l.station} ${l.year} / ${l.paddock} / ${l.mob}`:"No saved sessions yet."}</p><p><b>Workflow:</b> Setup → Crush females → End-of-mob tally → Report.</p>`}
function quickStart(type){show("setup");applyPreset(type)}
function repeatLast(){let l=S.sessions[0];if(!l){alert("No previous session.");return}show("setup");sessionType.value=l.type;sessionStation.value=l.station;sessionYear.value=l.year;sessionDate.value=today();sessionPaddock.value=l.paddock;sessionMob.value=l.mob;sessionVet.value=l.vet;sessionRecorder.value=l.recorder;fieldClass.checked=l.fields.class;fieldAge.checked=l.fields.age;fieldPreg.checked=l.fields.preg;fieldBCS.checked=l.fields.bcs;fieldWeight.checked=l.fields.weight;fieldWetDry.checked=l.fields.wetDry!==false;defaultClass.value=l.defaultClass||"";weightMode.value=l.weightMode||"off";S.draftRules=JSON.parse(JSON.stringify(l.draftRules||[]));renderDraftRules()}
function applyPreset(type){sessionYear.value=new Date().getFullYear();sessionDate.value=today();if(type==="heifer"){sessionType.value="crush";fieldClass.checked=true;fieldAge.checked=true;fieldPreg.checked=true;fieldBCS.checked=true;fieldWeight.checked=true;fieldWetDry.checked=true;weightMode.value="heifers";defaultClass.value="";draftPreset("heifers")}else if(type==="mob"){sessionType.value="mob";fieldClass.checked=false;fieldAge.checked=false;fieldPreg.checked=false;fieldBCS.checked=false;fieldWeight.checked=false;fieldWetDry.checked=false;weightMode.value="off"}else{sessionType.value="crush";fieldClass.checked=true;fieldAge.checked=true;fieldPreg.checked=true;fieldBCS.checked=true;fieldWeight.checked=false;fieldWetDry.checked=true;weightMode.value="off";defaultClass.value="";draftPreset("cows")}}
function saveStation(){let s={id:uid(),name:stName.value||"Unnamed Station",manager:stManager.value,email:(window.stEmail?.value||""),region:stRegion.value,country:stCountry.value,total:+stTotal.value||0,breeders:+stBreeders.value||0,heiferGrowth:+stHeiferGrowth.value||0,cowGrowth:+stCowGrowth.value||0,puberty:+stPuberty.value||320,targetBCS:+stTargetBCS.value||3,dryBcsChange:+stDryBcsChange.value||0,wetBcsChange:+stWetBcsChange.value||0,phos:stPhos.value,dryFeed:stDryFeed.value,wetPStatus:stWetPStatus.value,proteinRisk:stProteinRisk.value,utilisation:stUtilisation.value,landCondition:stLandCondition.value,bosIndicusPct:+stBosIndicusPct.value||0,firstJoinMonths:+stFirstJoinMonths.value||0,calvingStartMonth:stCalvingStartMonth.value,earlyWeanCost:+stEarlyWeanCost.value||0,economics:{cowValue:+stCowValue.value||0,pticValue:+stPticValue.value||0,weanerValue:+stWeanerValue.value||0,calfValue:+stCalfValue.value||0,heiferValue:+stHeiferValue.value||0,bullValue:+stBullValue.value||0,steerValue:+stSteerValue.value||0,cullCowValue:+stCullCowValue.value||0,lickCostDay:+stLickCostDay.value||0,musteringCost:+stMusteringCost.value||0,transportCost:+stTransportCost.value||0,vetCostHead:+stVetCostHead.value||0,pgCost:+stPgCost.value||0,hgpCost:+stHgpCost.value||0,hgpGainKg:+stHgpGainKg.value||0,kgPrice:+stKgPrice.value||0,oosDiscount:+stOosDiscount.value||0,calfWastage:+stCalfWastage.value||0,rejoinPregPct:+stRejoinPregPct.value||0,discountRate:+stDiscountRate.value||0,targetWeanerKg:+stTargetWeanerKg.value||0,peakJoinPct:+stPeakJoinPct.value||0,bullCapacityDay:+stBullCapacityDay.value||0,peakMatingDays:+stPeakMatingDays.value||0,backupBulls:+stBackupBulls.value||0}};S.stations=S.stations.filter(x=>x.name.toLowerCase()!=s.name.toLowerCase());S.stations.unshift(s);save();stationPreview.innerHTML=stationHtml(s);completeSound()}
function stationHtml(s){return `<h3>${s.name}</h3><p>${s.country} | ${s.total||"?"} cattle | ${s.breeders||"?"} breeders</p><p>Heifer growth ${s.heiferGrowth}kg/yr; cow growth ${s.cowGrowth}kg/yr; puberty target ${s.puberty}kg; target BCS ${s.targetBCS}.</p><p>Economics: weaner $${s.economics?.weanerValue||0}, cow $${s.economics?.cowValue||0}, lick $${s.economics?.lickCostDay||0}/hd/day, HGP $${s.economics?.hgpCost||0}, PG $${s.economics?.pgCost||0}.</p><p>CashCow assumptions: calf wastage ${s.economics?.calfWastage||0}%, rejoin conception ${s.economics?.rejoinPregPct||0}%, discount rate ${s.economics?.discountRate||0}%.</p><p>Evidence settings: P ${s.wetPStatus||"Unknown"}, protein risk ${s.proteinRisk||"Unknown"}, utilisation ${s.utilisation||"Unknown"}, land condition ${s.landCondition||"Unknown"}.</p>`}
function loadStationDefaults(){let s=station(sessionStation.value);if(s)stationPreview.innerHTML=stationHtml(s)}
function vals(id){return Array.from($(id).selectedOptions).map(o=>o.value)}
function addDraftRule(){S.draftRules.push({id:uid(),name:draftName.value||`Pen ${S.draftRules.length+1}`,classes:vals("draftClasses"),pregs:vals("draftPregs"),wetDry:vals("draftWetDry")});draftName.value="";save();renderDraftRules()}
function clearDraftRules(){S.draftRules=[];save();renderDraftRules()}
function draftPreset(type){S.draftRules=type==="heifers"?[{id:uid(),name:"Empty heifers",classes:["H"],pregs:["E"],wetDry:[]},{id:uid(),name:"P1-P3 heifers",classes:["H"],pregs:["P1","P2","P3"],wetDry:[]},{id:uid(),name:"P4-P6 heifers",classes:["H"],pregs:["P4","P5","P6"],wetDry:[]},{id:uid(),name:"P7-P9 heifers",classes:["H"],pregs:["P7","P8","P9"],wetDry:[]}]:[{id:uid(),name:"Empty cows",classes:["C","A"],pregs:["E"],wetDry:[]},{id:uid(),name:"P1-P3 cows",classes:["C","A"],pregs:["P1","P2","P3"],wetDry:[]},{id:uid(),name:"P4-P6 cows",classes:["C","A"],pregs:["P4","P5","P6"],wetDry:[]},{id:uid(),name:"P7-P9 cows",classes:["C","A"],pregs:["P7","P8","P9"],wetDry:[]},{id:uid(),name:"Speyed",classes:["S"],pregs:[],wetDry:[]}];save();renderDraftRules()}
function renderDraftRules(){if(!window.draftRuleList)return;draftRuleList.innerHTML=S.draftRules.length?S.draftRules.map((r,i)=>`<div class="draft-rule"><b>${i+1}. ${r.name}</b><br>Classes: ${r.classes.map(c=>classNames[c]).join(", ")||"Any"}<br>Preg: ${r.pregs.join(", ")||"Any"}<br>Wet/Dry: ${(r.wetDry||[]).map(x=>wetDryNames[x]).join(", ")||"Any"} <button onclick="HerdIQ.removeDraft('${r.id}')">Remove</button></div>`).join(""):"No rules selected."}
function removeDraft(id){S.draftRules=S.draftRules.filter(r=>r.id!==id);save();renderDraftRules()}
function addMonths(d,m){let x=new Date(d);x.setMonth(x.getMonth()+m);return x}function mon(d){return d.toLocaleDateString("en-AU",{month:"short",year:"numeric"})}function calvingWindow(p,date=sessionDate.value||today()){if(p==="E")return"Empty";let m=Math.max(0,10-pregNo(p));return `${mon(addMonths(date,m))}–${mon(addMonths(date,m+1))}`}
function renderCalvingGuide(){if(!window.calvingGuide)return;calvingGuide.innerHTML="<h4>Gestation calving guide</h4>"+pregStages.map(p=>`<div><b>${p}</b>: ${calvingWindow(p)}</div>`).join("")}
function startSession(){S.active={id:uid(),type:sessionType.value,station:sessionStation.value||"Unnamed Station",year:+sessionYear.value||new Date().getFullYear(),date:sessionDate.value||today(),paddock:sessionPaddock.value,mob:sessionMob.value,vet:sessionVet.value,recorder:sessionRecorder.value,fields:{class:fieldClass.checked,age:fieldAge.checked,preg:fieldPreg.checked,bcs:fieldBCS.checked,weight:fieldWeight.checked,wetDry:fieldWetDry.checked},defaultClass:defaultClass.value,weightMode:weightMode.value,draftRules:JSON.parse(JSON.stringify(S.draftRules))};S.records=[];S.yard={};resetAnimal();save();if(S.active.type==="mob")show("endmob");else show("crush")}
function activeFields(){let s=S.active;if(!s)return[];let arr=[];if(s.fields.class&&!s.defaultClass)arr.push(F.classCode);if(s.fields.age)arr.push(F.age);if(s.fields.bcs)arr.push(F.bcs);if(s.fields.preg)arr.push(F.preg);let cls=S.animal.classCode||s.defaultClass;if(s.fields.weight&&(s.weightMode==="all"||(cls==="H"&&s.weightMode==="heifers")))arr.push(F.weight);if(s.fields.wetDry!==false)arr.push(F.wetDry);return arr}
const F={
 classCode:{k:"classCode",label:"CLASS",prompt:"SELECT CLASS",hint:"Heifer / Cow / Speyed / Aged",auto:true,val:v=>["H","C","S","A"].includes(v)?v:null,disp:v=>classNames[v],options:[['H','Heifer'],['C','Cow'],['S','Speyed'],['A','Aged']]},
 age:{k:"age",label:"AGE",prompt:"SELECT AGE / BRAND",hint:"0–9",auto:true,val:v=>/^[0-9]$/.test(v)?+v:null,disp:v=>v,options:Array.from({length:10},(_,i)=>[String(i),String(i)])},
 bcs:{k:"bcs",label:"BCS",prompt:"SELECT BODY CONDITION SCORE",hint:"1.0–5.0",auto:false,val:v=>{let n=Number(String(v).trim());if(Number.isFinite(n)&&n>=1&&n<=5&&Math.round(n*2)===n*2)return n;let t=String(v).replace(/[^0-9]/g,'');if(/^(10|15|20|25|30|35|40|45|50)$/.test(t))return Number(t)/10;return null},disp:v=>Number(v).toFixed(1),options:[[1,'1.0'],[1.5,'1.5'],[2,'2.0'],[2.5,'2.5'],[3,'3.0'],[3.5,'3.5'],[4,'4.0'],[4.5,'4.5'],[5,'5.0']]},
 preg:{k:"preg",label:"PREG",prompt:"SELECT PREGNANCY",hint:"Empty or P1–P9",auto:true,val:v=>v==="E"?"E":/^P?[1-9]$/.test(v)?"P"+String(v).replace('P',''):null,disp:v=>v,options:[['E','Empty'],...Array.from({length:9},(_,i)=>['P'+(i+1),'P'+(i+1)])]},
 weight:{k:"weight",label:"WEIGHT",prompt:"ENTER WEIGHT",hint:"kg",auto:false,val:v=>+v>0?+v:null,disp:v=>v+" kg",options:null},
 wetDry:{k:"wetDry",label:"WET / DRY",prompt:"SELECT WET OR DRY",hint:"Wet / Dry",auto:true,val:v=>["W","D"].includes(v)?v:null,disp:v=>wetDryNames[v],options:[['W','Wet'],['D','Dry']]}
};
function resetAnimal(){S.animal={id:uid(),classCode:S.active?.defaultClass||null}}
function nextIdx(){let a=activeFields();for(let i=0;i<a.length;i++)if(S.animal[a[i].k]===null||S.animal[a[i].k]===undefined||S.animal[a[i].k]==="")return i;return a.length}
function assignDraft(r){for(let d of S.active.draftRules||[]){let okC=!d.classes.length||d.classes.includes(r.classCode),okP=!d.pregs.length||d.pregs.includes(r.preg),okW=!(d.wetDry||[]).length||(d.wetDry||[]).includes(r.wetDry);if(okC&&okP&&okW)return d.name}return"Unallocated"}
function saveAnimal(){let r={...S.animal,station:S.active.station,year:S.active.year,paddock:S.active.paddock,mob:S.active.mob,date:S.active.date};r.draft=assignDraft(r);S.records.push(r);resetAnimal();completeSound();document.body.classList.remove("saved-flash");void document.body.offsetWidth;document.body.classList.add("saved-flash");save();renderCrush("SAVED ✓ "+r.draft)}
function handleEntry(v){let a=activeFields(),i=nextIdx();if(i>=a.length){saveAnimal();return}let f=a[i],val=f.val(String(v).trim().toUpperCase());if(val===null){saveStatus.textContent="Invalid "+f.label;saveStatus.className="save-status error";errorSound();return}S.animal[f.k]=val;if(nextIdx()>=activeFields().length)saveAnimal();else{beep(650,.045);renderCrush("Recorded "+f.label)}}
function selectTouchValue(v){handleEntry(v)}
function confirmTypedEntry(){let f=activeFields()[nextIdx()];if(!f)return;handleEntry(quickInput.value);quickInput.value=""}
function backField(){let a=activeFields(),i=nextIdx();if(i<=0)return;let target=a[Math.min(i-1,a.length-1)];S.animal[target.k]=null;save();renderCrush("Back to "+target.label)}
function clearCurrentAnimal(){resetAnimal();save();renderCrush("Current animal cleared")}
function undoLast(){if(!S.records.length)return;let r=S.records.pop();save();renderCrush("Removed animal #"+(S.records.length+1));errorSound()}
function editRecord(index){let r=S.records[index];if(!r)return;S.records.splice(index,1);S.animal={id:r.id,classCode:r.classCode,age:r.age,bcs:r.bcs,preg:r.preg,weight:r.weight,wetDry:r.wetDry};save();renderCrush("Editing previous animal #"+(index+1))}
function optionClass(field,value){if(field.k==='bcs'){let n=Number(value);if(n<=2)return 'risk-high';if(n<=3)return 'risk-mid';return 'risk-good'}if(field.k==='preg'){if(value==='E')return 'risk-high';let p=pregNo(value);return p<=3?'risk-mid':p<=6?'risk-good':'risk-late'}return ''}
function renderTouchOptions(field){if(!window.touchOptions)return;if(!field){touchOptions.innerHTML='';return}if(field.k==='weight'){touchOptions.innerHTML='<div class="weight-message">Type the liveweight below, then press Confirm.</div>';weightKeyboard.classList.remove('hidden');setTimeout(()=>quickInput?.focus(),20);return}weightKeyboard.classList.add('hidden');touchOptions.innerHTML=(field.options||[]).map(([value,label])=>`<button type="button" class="touch-option ${optionClass(field,value)}" data-value="${value}">${label}</button>`).join('');touchOptions.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>selectTouchValue(b.dataset.value)))}
function renderCrush(msg="Ready"){if(!S.active){crushBanner.textContent="No active session.";return}crushBanner.textContent=`${S.active.station} • ${S.active.paddock||'No paddock'} • ${S.active.mob||'No mob'} • ${S.active.date}`;let a=activeFields(),i=nextIdx(),field=a[i];animalNumber.textContent=S.records.length+1;mainPrompt.textContent=i>=a.length?"ANIMAL SAVED":field.prompt;renderTouchOptions(field);fieldStack.innerHTML=a.map((f,idx)=>{let v=S.animal[f.k],done=v!==null&&v!==undefined&&v!=="";return `<button type="button" class="field-box ${done?'done':idx===i?'current':''}" data-field="${f.k}"><span class="field-label">${f.label}</span><span class="field-value">${done?f.disp(v):f.hint}</span><span class="field-icon">${done?'✓':idx===i?'→':'·'}</span></button>`}).join('');fieldStack.querySelectorAll('.field-box.done').forEach((b,idx)=>b.addEventListener('click',()=>{let fields=activeFields();let target=fields.find(x=>x.k===b.dataset.field);if(target){S.animal[target.k]=null;save();renderCrush('Edit '+target.label)}}));saveStatus.textContent=msg;saveStatus.className="save-status saved";liveRecorded.textContent=S.records.length;let preg=S.records.filter(r=>r.preg&&r.preg!=="E").length;livePregnant.textContent=preg;livePregRate.textContent=pct(preg,S.records.length)+"%";let preview={...S.animal};if(nextIdx()>=activeFields().length)preview.draft=assignDraft(preview);let last=S.records[S.records.length-1];currentDraft.textContent=preview.draft||last?.draft||"No draft yet";let dc={};S.records.forEach(r=>dc[r.draft]=(dc[r.draft]||0)+1);draftBoard.innerHTML=[...new Set([...(S.active.draftRules||[]).map(d=>d.name),"Unallocated"])].map(n=>`<div class="draft-item"><b>${dc[n]||0}</b> ${n}</div>`).join("");lastFive.innerHTML=S.records.slice(-5).map((r,offset)=>({r,index:S.records.length-Math.min(5,S.records.length)+offset})).reverse().map(x=>`<button class="last-item previous-animal" onclick="HerdIQ.editRecord(${x.index})"><b>#${x.index+1}</b><span>${classNames[x.r.classCode]||''} • age ${x.r.age??'-'}</span><span>BCS ${x.r.bcs!=null?Number(x.r.bcs).toFixed(1):'-'} • ${x.r.preg||'-'} • ${wetDryNames[x.r.wetDry]||'-'}</span></button>`).join("")||'<div class="empty-previous">No animals yet</div>'}
document.addEventListener('keydown',e=>{if(!S.active||!document.getElementById('crush')?.classList.contains('active'))return;if(e.key==='F1'){e.preventDefault();undoLast();return}if(e.key==='Backspace'&&document.activeElement!==quickInput){e.preventDefault();backField();return}let f=activeFields()[nextIdx()];if(!f)return;if(f.k==='weight'){if(e.key==='Enter'){e.preventDefault();confirmTypedEntry()}return}if(e.key.length===1){let key=e.key.toUpperCase();if(f.k==='bcs')return;e.preventDefault();handleEntry(key)}});
function renderYardInputs(){yardInputs.innerHTML=yardClasses.map(c=>`<label>${c}<input type="number" min="0" value="${S.yard[c]||0}" oninput="HerdIQ.setYard('${c}',this.value)"></label>`).join("");renderYardSummary()}function setYard(c,v){S.yard[c]=+v||0;save();renderYardSummary()}function renderYardSummary(){let cows=(S.records.filter(r=>["H","C","A"].includes(r.classCode)).length)+(S.yard["Speyed cows"]||0)+(S.yard["Cull cows"]||0),calves=S.yard.Calves||0,weaners=S.yard.Weaners||0;yardSummary.innerHTML=`<h3>End-of-mob summary</h3><p>Calves: ${calves}; Weaners: ${weaners}; Bulls: ${S.yard.Bulls||0}; Steers: ${S.yard.Steers||0}; Speyed: ${S.yard["Speyed cows"]||0}</p><p>Calving/branding estimate: ${pct(calves,cows)}%. Weaning estimate: ${pct(weaners,cows)}%.</p>`}
function finishSession(){if(!S.active)return;S.sessions.unshift({...S.active,records:[...S.records],yard:{...S.yard},finishedAt:new Date().toISOString()});S.active=null;S.records=[];completeSound();save();show("report")}
function latest(){return S.active?{...S.active,records:S.records,yard:S.yard}:S.sessions[0]}
function merge(session=latest()){let rec=session?.records||[],yard=session?.yard||{};let preg={};pregStages.forEach(p=>preg[p]=0);let bcs={};for(let x=1;x<=5;x+=.5)bcs[x.toFixed(1)]=0;let classes={...yard},ages={},wetDry={Wet:0,Dry:0};rec.forEach(r=>{if(r.preg)preg[r.preg]=(preg[r.preg]||0)+1;if(r.bcs!=null)bcs[Number(r.bcs).toFixed(1)]=(bcs[Number(r.bcs).toFixed(1)]||0)+1;if(r.age!=null)ages[r.age]=(ages[r.age]||0)+1;if(r.wetDry)wetDry[wetDryNames[r.wetDry]]++;let k=classNames[r.classCode];if(k)classes[k]=(classes[k]||0)+1});return{rec,yard,preg,bcs,classes,ages,wetDry}}

function stationEconomics(name){
  const s=station(name)||{};
  return s.economics||{cowValue:900,pticValue:1100,weanerValue:650,calfValue:250,heiferValue:800,bullValue:3000,steerValue:950,cullCowValue:800,lickCostDay:0.45,musteringCost:12,transportCost:35,vetCostHead:8,pgCost:6.5,hgpCost:12,hgpGainKg:18,kgPrice:3.2,oosDiscount:120,calfWastage:12,rejoinPregPct:65,discountRate:8,targetWeanerKg:180,peakJoinPct:75,bullCapacityDay:5,peakMatingDays:62,backupBulls:1};
}
function addCalendarEvent(){
  const e={id:uid(),station:calStation.value||"Unnamed Station",year:+calYear.value||new Date().getFullYear(),className:calClass.value,head:+calHead.value||0,date:calDate.value||today(),action:calAction.value,costHead:+calCostHead.value||0,benefitHead:+calBenefitHead.value||0,notes:calNotes.value||""};
  e.totalCost=Math.round(e.head*e.costHead);e.totalBenefit=Math.round(e.head*e.benefitHead);e.net=e.totalBenefit-e.totalCost;
  S.calendarEvents.unshift(e);save();renderCalendar();completeSound();
}
function renderCalendar(){
  if(S.active&&!calStation.value){calStation.value=S.active.station;calYear.value=S.active.year;}
  calYear.value ||= new Date().getFullYear();calDate.value ||= today();
  const stationName=calStation.value||"",year=+calYear.value||new Date().getFullYear();
  const list=(S.calendarEvents||[]).filter(e=>(!stationName||e.station===stationName)&&e.year===year).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
  const cost=list.reduce((a,e)=>a+e.totalCost,0),ben=list.reduce((a,e)=>a+e.totalBenefit,0);
  calendarList.innerHTML=`<h3>${stationName||"All stations"} ${year}</h3><p>Cost $${cost.toLocaleString()}. Benefit $${ben.toLocaleString()}. Net <b class="${ben-cost>=0?'profit':'loss'}">$${(ben-cost).toLocaleString()}</b></p>`+(list.map(e=>`<div class="calendarItem"><b>${e.date}</b> — ${e.className} — ${e.action}<br>${e.head} head × cost $${e.costHead}/hd; benefit $${e.benefitHead}/hd. Net <b class="${e.net>=0?'profit':'loss'}">$${e.net.toLocaleString()}</b><br>${e.notes||""}</div>`).join("")||"No events yet.");
}
function loadStrategyDefaults(){
  if(!ecoStation.value&&S.active)ecoStation.value=S.active.station;
  const econ=stationEconomics(ecoStation.value);
  ecoMedHead.value=0;ecoVetHead.value=econ.vetCostHead||0;ecoFeedHead.value=0;ecoMusterHead.value=econ.musteringCost||0;ecoTransportHead.value=0;ecoOtherHead.value=0;ecoRiskPct.value=0;ecoIncomeHead.value=0;
  if(ecoStrategy.value==="oos_calves"){ecoIncomeHead.value=Math.max(0,(econ.weanerValue||0)-(econ.oosDiscount||0));if(window.ecoCalfWastagePct)ecoCalfWastagePct.value=econ.calfWastage||12;}
  if(ecoStrategy.value==="pg_rejoin"){ecoIncomeHead.value=Math.max(0,(econ.pticValue||0)-(econ.cowValue||0));ecoMedHead.value=econ.pgCost||0;ecoRiskPct.value=20;if(window.ecoConceptionPct)ecoConceptionPct.value=econ.rejoinPregPct||65;if(window.ecoCalfWastagePct)ecoCalfWastagePct.value=econ.calfWastage||12;if(window.ecoMonthsDelay)ecoMonthsDelay.value=12;}
  if(ecoStrategy.value==="hgp"){ecoIncomeHead.value=(econ.hgpGainKg||0)*(econ.kgPrice||0);ecoMedHead.value=econ.hgpCost||0;ecoVetHead.value=0;}
  if(ecoStrategy.value==="lick"){ecoIncomeHead.value=Math.round((econ.weanerValue||0)*0.08);ecoFeedHead.value=Math.round((econ.lickCostDay||0)*90*100)/100;ecoMusterHead.value=0;}
  if(ecoStrategy.value==="do_nothing"){ecoIncomeHead.value=Math.round((econ.weanerValue||0)*0.65);ecoRiskPct.value=25;ecoVetHead.value=0;ecoMusterHead.value=0;}
}
function economicInputs(){
  return {id:uid(),station:ecoStation.value||S.active?.station||"Unnamed Station",name:ecoName.value||ecoStrategy.options[ecoStrategy.selectedIndex].text,className:ecoClass.value,head:+ecoHead.value||0,strategy:ecoStrategy.value,incomeHead:+ecoIncomeHead.value||0,medHead:+ecoMedHead.value||0,vetHead:+ecoVetHead.value||0,feedHead:+ecoFeedHead.value||0,musterHead:+ecoMusterHead.value||0,transportHead:+ecoTransportHead.value||0,otherHead:+ecoOtherHead.value||0,riskPct:+ecoRiskPct.value||0,notes:ecoNotes.value||"",date:new Date().toISOString()};
}
function calculateScenario(s){
  const costHead=s.medHead+s.vetHead+s.feedHead+s.musterHead+s.transportHead+s.otherHead;
  const econ=stationEconomics(s.station);const rawBenefit=cashCowScenarioBenefit(s,econ);const benefit=rawBenefit*(1-(s.riskPct/100));
  const netHead=benefit-costHead;
  return {costHead,benefit,netHead,totalCost:Math.round(costHead*s.head),totalBenefit:Math.round(benefit*s.head),net:Math.round(netHead*s.head),roi:costHead?Math.round((netHead/costHead)*100):0};
}
function calculateEconomics(){
  const s=economicInputs(),r=calculateScenario(s);
  economicOut.innerHTML=`<h3>${s.name}</h3><div class="ecoResult"><div class="ecoBox">Head<br><b>${s.head}</b></div><div class="ecoBox">Cost/head<br><b>$${r.costHead.toFixed(2)}</b></div><div class="ecoBox">Benefit/head<br><b>$${r.benefit.toFixed(2)}</b></div><div class="ecoBox">Net/head<br><b class="${r.netHead>=0?'profit':'loss'}">$${r.netHead.toFixed(2)}</b></div><div class="ecoBox">Total cost<br><b>$${r.totalCost.toLocaleString()}</b></div><div class="ecoBox">Total benefit<br><b>$${r.totalBenefit.toLocaleString()}</b></div><div class="ecoBox">Net<br><b class="${r.net>=0?'profit':'loss'}">$${r.net.toLocaleString()}</b></div><div class="ecoBox">ROI<br><b>${r.roi}%</b></div></div><p>${s.notes||""}</p>`;
  return {scenario:s,result:r};
}
function saveScenario(){const x=calculateEconomics();S.economicScenarios.unshift({...x.scenario,result:x.result});save();completeSound();}
function renderEconomicSummary(stationName){
  const list=(S.economicScenarios||[]).filter(s=>!stationName||s.station===stationName);
  if(!list.length)return "<h3>Management economics</h3><p>No saved scenarios yet.</p>";
  return `<h3>Management economics</h3><table class="table"><tr><th>Scenario</th><th>Class</th><th>Head</th><th>Net</th><th>ROI</th></tr>${list.slice(0,8).map(s=>`<tr><td>${s.name}</td><td>${s.className}</td><td>${s.head}</td><td class="${s.result.net>=0?'profit':'loss'}">$${s.result.net.toLocaleString()}</td><td>${s.result.roi}%</td></tr>`).join("")}</table>`;
}
function renderCalendarSummary(stationName,year){
  const list=(S.calendarEvents||[]).filter(e=>(!stationName||e.station===stationName)&&(!year||e.year===year));
  const cost=list.reduce((a,e)=>a+e.totalCost,0),ben=list.reduce((a,e)=>a+e.totalBenefit,0);
  return `<h3>Management calendar</h3><p>${list.length} events. Cost $${cost.toLocaleString()}. Benefit $${ben.toLocaleString()}. Net <b class="${ben-cost>=0?'profit':'loss'}">$${(ben-cost).toLocaleString()}</b>.</p>`;
}


function cashCowBench(country){
  return {
    "Southern Forest":{weanerKgCow:191,preg:87,calfLoss:5,missing:8,p4m:74},
    "Central Forest":{weanerKgCow:195,preg:88,calfLoss:6,missing:6,p4m:77},
    "Northern Downs":{weanerKgCow:163,preg:82,calfLoss:7,missing:7,p4m:68},
    "Northern Forest":{weanerKgCow:93,preg:66,calfLoss:14,missing:12,p4m:17},
    "Mixed / Other":{weanerKgCow:163,preg:82,calfLoss:7,missing:7,p4m:68}
  }[country||"Mixed / Other"];
}
function discountPV(value,months,ratePct){
  return value/Math.pow(1+(ratePct/100),months/12);
}
function cashCowScenarioBenefit(s,econ){
  let income=s.incomeHead;
  if(s.strategy==="pg_rejoin" && ecoCashCowMode?.value==="yes"){
    const futureCalf=(econ.weanerValue||0)*(1-(+ecoCalfWastagePct.value||econ.calfWastage||0)/100);
    const conception=(+ecoConceptionPct.value||econ.rejoinPregPct||0)/100;
    income=discountPV(futureCalf*conception,+ecoMonthsDelay.value||12,econ.discountRate||0);
  }
  if(s.strategy==="lick" && ecoCashCowMode?.value==="yes"){
    // Benefit approximates extra weaner value protected by maintaining BCS and conception probability.
    income=(econ.weanerValue||0)*0.08 + ((econ.pticValue||0)-(econ.cowValue||0))*0.05;
  }
  if(s.strategy==="oos_calves" && ecoCashCowMode?.value==="yes"){
    income=Math.max(0,(econ.weanerValue||0)-(econ.oosDiscount||0))* (1-(econ.calfWastage||0)/100);
  }
  return income;
}
function cashCowOpportunity(stationName,year,classes){
  const st=station(stationName)||{}, econ=stationEconomics(stationName), bench=cashCowBench(st.country), cows=(classes["Cow"]||0)+(classes["Aged"]||0);
  const weaners=classes["Weaners"]||0;
  const currentKgCow=cows?Math.round((weaners*(econ.targetWeanerKg||180))/cows):0;
  const gap=Math.max(0,(bench.weanerKgCow||0)-currentKgCow);
  const opportunity=Math.round(gap*cows*(econ.kgPrice||3.2));
  return {bench,cows,weaners,currentKgCow,gap,opportunity};
}
function bullPowerInputs(){
  if(!bpStation.value&&S.active)bpStation.value=S.active.station;
  const econ=stationEconomics(bpStation.value);
  if(!bpWeanerValue.value)bpWeanerValue.value=econ.weanerValue||650;
  return {id:uid(),station:bpStation.value||"Unnamed Station",year:+bpYear.value||new Date().getFullYear(),females:+bpFemales.value||0,targetCalves:+bpTargetCalves.value||0,wastage:+bpWastage.value||0,cycles:+bpCycles.value||1.5,matings:+bpMatings.value||2,peakPct:+bpPeakPct.value||75,peakDays:+bpPeakDays.value||62,capacity:+bpCapacity.value||5,backup:+bpBackup.value||0,available:+bpAvailable.value||0,weanerValue:+bpWeanerValue.value||650,failureRisk:+bpFailureRisk.value||0};
}
function bullPowerCalc(x){
  const pregnanciesNeeded=x.targetCalves/Math.max(0.01,1-(x.wastage/100));
  const peakMatings=pregnanciesNeeded*x.cycles*x.matings*(x.peakPct/100);
  const capacityPerBull=x.capacity*x.peakDays;
  const minBulls=Math.ceil(peakMatings/Math.max(1,capacityPerBull));
  const recommended=minBulls+x.backup;
  const effectiveAvailable=Math.floor(x.available*(1-(x.failureRisk/100)));
  const bullShortfall=Math.max(0,recommended-effectiveAvailable);
  const matingShortfall=bullShortfall*capacityPerBull;
  const pregnanciesLost=matingShortfall/Math.max(1,x.cycles*x.matings);
  const calvesLost=pregnanciesLost*Math.max(0,1-(x.wastage/100));
  const economicRisk=Math.round(calvesLost*x.weanerValue);
  return {pregnanciesNeeded:Math.round(pregnanciesNeeded),peakMatings:Math.round(peakMatings),capacityPerBull,minBulls,recommended,effectiveAvailable,bullShortfall,calvesLost:Math.round(calvesLost),economicRisk};
}
function calculateBullPower(){
  const x=bullPowerInputs(),r=bullPowerCalc(x);
  bullPowerOut.innerHTML=`<h3>Bull Power Result</h3><div class="ecoResult">
  <div class="ecoBox">Pregnancies needed<br><b>${r.pregnanciesNeeded}</b></div>
  <div class="ecoBox">Peak matings required<br><b>${r.peakMatings}</b></div>
  <div class="ecoBox">Capacity/bull<br><b>${r.capacityPerBull}</b></div>
  <div class="ecoBox">Recommended bulls<br><b>${r.recommended}</b></div>
  <div class="ecoBox">Effective bulls available<br><b>${r.effectiveAvailable}</b></div>
  <div class="ecoBox">Shortfall<br><b class="${r.bullShortfall?'loss':'profit'}">${r.bullShortfall}</b></div>
  <div class="ecoBox">Potential calves lost<br><b>${r.calvesLost}</b></div>
  <div class="ecoBox">Economic risk<br><b class="${r.economicRisk?'loss':'profit'}">$${r.economicRisk.toLocaleString()}</b></div>
  </div><p class="evidenceNote">Model uses the bull-power principle of calculating bull numbers from mating demand, peak mating period, calf wastage and sound-bull mating capacity rather than a simple bull percentage.</p>`;
  return {inputs:x,result:r};
}
function saveBullPower(){
  const x=calculateBullPower();S.bullPowerScenarios.unshift({...x.inputs,result:x.result});save();completeSound();
}
function renderBullPowerSummary(stationName){
  const list=(S.bullPowerScenarios||[]).filter(x=>!stationName||x.station===stationName);
  if(!list.length)return "<h3>Bull Power</h3><p>No saved bull power scenario yet.</p>";
  const x=list[0];
  return `<h3>Bull Power</h3><p>Recommended bulls: ${x.result.recommended}. Effective available: ${x.result.effectiveAvailable}. Shortfall: ${x.result.bullShortfall}.</p><p>Potential calves lost from bull shortfall: ${x.result.calvesLost}. Economic risk: <b class="${x.result.economicRisk?'loss':'profit'}">$${x.result.economicRisk.toLocaleString()}</b>.</p>`;
}


function latestSessionForStation(stationName){
  return (S.sessions||[]).find(x=>!stationName||x.station===stationName)||latest();
}
function evidenceInputs(){
  const stName=evStation.value||S.active?.station||S.sessions[0]?.station||"Unnamed Station";
  const st=station(stName)||{};
  const sess=(evUseLatest?.value==="yes")?latestSessionForStation(stName):null;
  let m=sess?merge(sess):null;
  const breeders=+evBreeders.value||m?.rec?.length||st.breeders||0;
  const totalPreg=m?Object.values(m.preg).reduce((a,b)=>a+b,0):0;
  const pregnant=m?totalPreg-(m.preg.E||0):0;
  const pregPct=+evPregPct.value||pct(pregnant,totalPreg)||0;
  const bcsVals=m?m.rec.map(r=>r.bcs).filter(Boolean):[];
  const avgBCS=+evAvgBCS.value||avg(bcsVals)||0;
  const lowBCS=m?pct(m.rec.filter(r=>r.bcs&&r.bcs<3).length,m.rec.length):(+evLowBCSPct.value||0);
  const heifers=m?m.rec.filter(r=>r.classCode==="H"):[];
  const heiferWeights=heifers.map(r=>r.weight).filter(Boolean);
  const heiferWeight=+evHeiferWeight.value||avg(heiferWeights)||0;
  const heiferHead=+evHeiferHead.value||heifers.length||0;
  const pStatus=(evPStatus?.value&&evPStatus.value!=="Use station profile")?evPStatus.value:(st.wetPStatus||"Unknown");
  const utilisation=(evUtilisation?.value&&evUtilisation.value!=="Use station profile")?evUtilisation.value:(st.utilisation||"Unknown");
  return {station:stName,year:+evYear.value||S.active?.year||new Date().getFullYear(),stationProfile:st,session:sess,merged:m,breeders,pregPct,avgBCS,lowBCS,heiferWeight,heiferHead,pStatus,utilisation};
}
function scoreEvidence(inp){
  const st=inp.stationProfile||{}, econ=stationEconomics(inp.station), bench=cashCowBench(st.country);
  let modules=[];
  const pregGap=Math.max(0,(bench.preg||0)-inp.pregPct);
  if(pregGap>0){
    const value=Math.round(inp.breeders*(pregGap/100)*(econ.weanerValue||650)*(1-(econ.calfWastage||12)/100));
    modules.push({name:"Pregnancy rate opportunity",priority:pregGap>10?"High":"Medium",value,summary:`Pregnancy is ${pregGap}% below the ${st.country||"regional"} benchmark.`,action:"Investigate nutrition, BCS, bull power, joining timing, disease risk and first-lactation management."});
  }
  if(inp.lowBCS>15||inp.avgBCS<3){
    const affected=Math.round(inp.breeders*(Math.max(inp.lowBCS,15)/100));
    const value=Math.round(affected*(econ.weanerValue||650)*0.08);
    modules.push({name:"BCS / early-weaning opportunity",priority:inp.lowBCS>25?"High":"Medium",value,summary:`${inp.lowBCS}% are below BCS 3 or average BCS is ${inp.avgBCS.toFixed?inp.avgBCS.toFixed(1):inp.avgBCS}.`,action:"Draft low-BCS lactating cows for priority nutrition or early weaning; protect BCS before next joining."});
  }
  if(inp.pStatus==="Deficient"||inp.pStatus==="Marginal"){
    const firstLact=0;
    const riskHead=Math.max(firstLact,Math.round(inp.breeders*0.15));
    const value=Math.round(riskHead*(econ.weanerValue||650)*0.15);
    modules.push({name:"Wet-season phosphorus opportunity",priority:inp.pStatus==="Deficient"?"High":"Medium",value,summary:`Station profile flags ${inp.pStatus.toLowerCase()} phosphorus status.`,action:"Model wet-season P supplementation, especially for growing and first-lactation females."});
  }
  if(inp.utilisation==="High"||inp.utilisation==="Very high"){
    const penalty=inp.utilisation==="Very high"?0.20:0.10;
    const value=Math.round(inp.breeders*(econ.weanerValue||650)*penalty);
    modules.push({name:"Pasture utilisation / Sweet Spot risk",priority:inp.utilisation==="Very high"?"High":"Medium",value,summary:`Relative pasture utilisation is ${inp.utilisation}.`,action:"Review stocking rate against safe utilisation and land condition; high utilisation can reduce pregnancy and increase calf loss."});
  }
  if(inp.heiferHead>0&&inp.heiferWeight>0){
    const target=st.puberty||320;
    const below=Math.max(0,target-inp.heiferWeight);
    const priority=below>40?"High":below>15?"Medium":"Low";
    const value=below>0?Math.round(inp.heiferHead*(econ.weanerValue||650)*0.12):0;
    modules.push({name:"Heifer development",priority,value,summary:`Heifers average ${Math.round(inp.heiferWeight)} kg vs puberty/joining target ${target} kg.`,action:below>0?"Consider delaying joining, segregating, or targeted nutrition before joining.":"Heifer weights are on track for joining target."});
  }
  modules.sort((a,b)=>b.value-a.value);
  return {modules,bench};
}
function runEvidenceEngine(){
  if(S.active&&!evStation.value)evStation.value=S.active.station;
  if(!evYear.value)evYear.value=S.active?.year||new Date().getFullYear();
  const inp=evidenceInputs(), out=scoreEvidence(inp);
  const totalValue=out.modules.reduce((a,m)=>a+m.value,0);
  evidenceOut.innerHTML=`<h3>${inp.station} Evidence Engine</h3><p>Estimated ranked opportunity: <b class="${totalValue>0?'profit':''}">$${totalValue.toLocaleString()}</b></p>
  <div class="evidenceGrid">${out.modules.map(m=>`<div class="evidenceTile ${m.priority==="High"?'priorityHigh':m.priority==="Medium"?'priorityMed':'priorityLow'}"><h4>${m.name}</h4><p><b>${m.priority}</b> priority</p><p>${m.summary}</p><p><b>Potential value:</b> $${m.value.toLocaleString()}</p><p>${m.action}</p></div>`).join("")||"<p>No major evidence-based opportunities detected from current inputs.</p>"}</div>
  <div class="evidenceNote"><b>Evidence base used:</b> CashCow reproductive risk factors; Tim Schatz/NT phosphorus response work; MLA heifer management guidance; Sweet Spot pasture utilisation/bioeconomic findings; low-cost breeder resilience strategy principles.</div>`;
  return {inputs:inp,result:out,totalValue};
}
function saveEvidenceRun(){
  const x=runEvidenceEngine();
  S.evidenceRuns.unshift({id:uid(),station:x.inputs.station,year:x.inputs.year,date:new Date().toISOString(),totalValue:x.totalValue,modules:x.result.modules});
  save();completeSound();
}
function renderEvidenceSummary(stationName){
  const run=(S.evidenceRuns||[]).find(r=>!stationName||r.station===stationName);
  if(!run)return "<h3>Evidence Engine</h3><p>No saved evidence run yet.</p>";
  return `<h3>Evidence Engine</h3><p>Ranked opportunity estimate: <b class="profit">$${run.totalValue.toLocaleString()}</b></p><ul class="ruleList">${run.modules.slice(0,5).map(m=>`<li><b>${m.name}</b>: ${m.priority} priority, $${m.value.toLocaleString()} — ${m.action}</li>`).join("")}</ul>`;
}

function groupedRate(rec,key){let out={};rec.forEach(r=>{let v=r[key];if(v===null||v===undefined||v==="")return;let k=key==="classCode"?(classNames[v]||v):key==="wetDry"?(wetDryNames[v]||v):String(v);out[k]??={n:0,p:0};out[k].n++;if(r.preg&&r.preg!=="E")out[k].p++});return out}
function groupedAverage(rec,groupKey,valueKey){let out={};rec.forEach(r=>{let g=r[groupKey],v=+r[valueKey];if(g===null||g===undefined||g===""||!Number.isFinite(v))return;let k=groupKey==="classCode"?(classNames[g]||g):groupKey==="wetDry"?(wetDryNames[g]||g):String(g);out[k]??=[];out[k].push(v)});return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,avg(v)]))}
function correlationRows(rec){let pairs=[["Weight","weight","BCS","bcs"],["Weight","weight","Age","age"],["BCS","bcs","Age","age"]];return pairs.map(([a,ak,b,bk])=>{let rows=rec.filter(r=>Number.isFinite(+r[ak])&&Number.isFinite(+r[bk]));if(rows.length<3)return null;let xs=rows.map(r=>+r[ak]),ys=rows.map(r=>+r[bk]),xm=avg(xs),ym=avg(ys),num=0,dx=0,dy=0;for(let i=0;i<rows.length;i++){num+=(xs[i]-xm)*(ys[i]-ym);dx+=(xs[i]-xm)**2;dy+=(ys[i]-ym)**2}let r=num/Math.sqrt(dx*dy);return{a,b,n:rows.length,r:Number.isFinite(r)?r:0}}).filter(Boolean)}
function renderReport(){let s=latest();if(!s){reportHeader.innerHTML="No saved or active session.";return}let m=merge(s),total=Object.values(m.preg).reduce((a,b)=>a+b,0),preg=total-(m.preg.E||0),st=station(s.station),b=benchmark(st?.country);reportHeader.innerHTML=`<h3>${s.station} — ${s.year} — ${s.paddock} — ${s.mob}</h3><p>${s.date}. ${m.rec.length} individual records. Every recorded field is included below.</p>`;kpiCard.innerHTML=`<h3>Key performance</h3><p>Pregnancy: <b>${pct(preg,total)}%</b> (${preg}/${total})</p><p>Empty: ${m.preg.E||0} (${pct(m.preg.E||0,total)}%)</p><p>Mean BCS: ${avg(m.rec.map(r=>r.bcs))?.toFixed(2)||"–"}</p><p>Mean weight: ${avg(m.rec.map(r=>r.weight))?.toFixed(1)||"–"} kg</p>`;forecastCard.innerHTML=`<h3>Calving forecast</h3><table class="table"><tr><th>Preg</th><th>Head</th><th>Expected calving</th></tr>${pregStages.filter(p=>p!="E").map(p=>`<tr><td>${p}</td><td>${m.preg[p]}</td><td>${calvingWindow(p,s.date)}</td></tr>`).join("")}</table>`;advisoryCard.innerHTML=`<h3>Complete data summary</h3><p>Classes: ${Object.entries(m.classes).map(([k,v])=>`${k} ${v}`).join("; ")||"–"}</p><p>Ages: ${Object.entries(m.ages).map(([k,v])=>`${k}: ${v}`).join("; ")||"–"}</p><p>Wet/dry: Wet ${m.wetDry.Wet}, Dry ${m.wetDry.Dry}</p>`;mergedCard.innerHTML=`<h3>Raw records</h3><div class="table-scroll"><table class="table"><tr><th>#</th><th>Class</th><th>Age</th><th>BCS</th><th>Preg</th><th>Weight</th><th>Wet/Dry</th><th>Draft</th></tr>${m.rec.map((r,i)=>`<tr><td>${i+1}</td><td>${classNames[r.classCode]||""}</td><td>${r.age??""}</td><td>${r.bcs??""}</td><td>${r.preg||""}</td><td>${r.weight??""}</td><td>${wetDryNames[r.wetDry]||""}</td><td>${r.draft||""}</td></tr>`).join("")}</table></div>`;if(window.economicsCard)economicsCard.innerHTML=renderEconomicSummary(s.station);if(window.calendarCard)calendarCard.innerHTML=renderCalendarSummary(s.station,s.year);if(window.bullPowerCard)bullPowerCard.innerHTML=renderBullPowerSummary(s.station);if(window.evidenceCard)evidenceCard.innerHTML=renderEvidenceSummary(s.station);if(window.cashCowOpportunityCard){const op=cashCowOpportunity(s.station,s.year,m.classes);cashCowOpportunityCard.innerHTML=`<h3>CashCow opportunity</h3><p>Current estimated weaner production: ${op.currentKgCow} kg/cow vs benchmark ${op.bench.weanerKgCow} kg/cow.</p><p>Potential liveweight opportunity: <b>$${op.opportunity.toLocaleString()}</b>.</p>`}let corr=correlationRows(m.rec);correlationCard.innerHTML=`<h3>Relationships within the mob</h3>${corr.length?`<table class="table"><tr><th>Comparison</th><th>Records</th><th>Correlation</th></tr>${corr.map(x=>`<tr><td>${x.a} vs ${x.b}</td><td>${x.n}</td><td>${x.r.toFixed(2)}</td></tr>`).join("")}</table>`:"Not enough paired numeric data for correlations."}`;drawCharts(m,b,total,preg)}
function clearCharts(){charts.forEach(c=>c.destroy());charts=[]}
function chart(id,type,labels,datasets,options={}){let el=$(id);if(!el)return;charts.push(new Chart(el,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:options.title||""}},scales:type==="bar"?{y:{beginAtZero:true}}:{},...options}}))}
function drawCharts(m,b,total,preg){clearCharts();chart("pregChart","bar",pregStages,[{label:"Head",data:pregStages.map(p=>m.preg[p]||0)}],{title:"Pregnancy stage distribution"});chart("bcsChart","bar",Object.keys(m.bcs),[{label:"Head",data:Object.values(m.bcs)}],{title:"BCS distribution"});chart("ageChart","bar",Object.keys(m.ages),[{label:"Head",data:Object.values(m.ages)}],{title:"Age distribution"});chart("classChart","bar",Object.keys(m.classes),[{label:"Head",data:Object.values(m.classes)}],{title:"Class totals"});chart("wetDryChart","bar",Object.keys(m.wetDry),[{label:"Head",data:Object.values(m.wetDry)}],{title:"Wet and dry status"});let dc={};m.rec.forEach(r=>dc[r.draft]=(dc[r.draft]||0)+1);chart("draftChart","bar",Object.keys(dc),[{label:"Head",data:Object.values(dc)}],{title:"Draft totals"});let calv={};pregStages.filter(p=>p!=="E").forEach(p=>calv[calvingWindow(p)]=(calv[calvingWindow(p)]||0)+(m.preg[p]||0));chart("calvingChart","bar",Object.keys(calv),[{label:"Head",data:Object.values(calv)}],{title:"Expected calving distribution"});let bcsPreg=groupedRate(m.rec,"bcs");chart("bcsPregChart","bar",Object.keys(bcsPreg),[{label:"Pregnancy %",data:Object.values(bcsPreg).map(x=>pct(x.p,x.n))}],{title:"Pregnancy rate by BCS"});let agePreg=groupedRate(m.rec,"age");chart("agePregChart","bar",Object.keys(agePreg),[{label:"Pregnancy %",data:Object.values(agePreg).map(x=>pct(x.p,x.n))}],{title:"Pregnancy rate by age"});let classPreg=groupedRate(m.rec,"classCode");chart("classPregChart","bar",Object.keys(classPreg),[{label:"Pregnancy %",data:Object.values(classPreg).map(x=>pct(x.p,x.n))}],{title:"Pregnancy rate by class"});let wdPreg=groupedRate(m.rec,"wetDry");chart("wetDryPregChart","bar",Object.keys(wdPreg),[{label:"Pregnancy %",data:Object.values(wdPreg).map(x=>pct(x.p,x.n))}],{title:"Pregnancy rate by wet/dry status"});let ageBcs=groupedAverage(m.rec,"age","bcs");chart("ageBcsChart","bar",Object.keys(ageBcs),[{label:"Mean BCS",data:Object.values(ageBcs)}],{title:"Mean BCS by age"});let classBcs=groupedAverage(m.rec,"classCode","bcs");chart("classBcsChart","bar",Object.keys(classBcs),[{label:"Mean BCS",data:Object.values(classBcs)}],{title:"Mean BCS by class"});let wdBcs=groupedAverage(m.rec,"wetDry","bcs");chart("wetDryBcsChart","bar",Object.keys(wdBcs),[{label:"Mean BCS",data:Object.values(wdBcs)}],{title:"Mean BCS by wet/dry status"});let pregWeight=groupedAverage(m.rec,"preg","weight");chart("pregWeightChart","bar",Object.keys(pregWeight),[{label:"Mean weight kg",data:Object.values(pregWeight)}],{title:"Mean weight by pregnancy stage"});let bcsWeight=groupedAverage(m.rec,"bcs","weight");chart("bcsWeightChart","bar",Object.keys(bcsWeight),[{label:"Mean weight kg",data:Object.values(bcsWeight)}],{title:"Mean weight by BCS"});chart("benchmarkChart","bar",["Pregnancy %","Empty %"],[{label:"This mob",data:[pct(preg,total),pct(m.preg.E||0,total)]},{label:"Benchmark/target",data:[b.preg,10]}],{title:"Mob versus benchmark"})}
function renderHistory(){historyList.innerHTML=S.sessions.map(s=>`<div class="panel"><h3>${s.station} ${s.year}</h3><p>${s.date} — ${s.paddock} / ${s.mob} — ${s.records.length} females recorded</p><button onclick="HerdIQ.openSession('${s.id}')">Open report</button></div>`).join("")||"No saved sessions."}
function openSession(id){let i=S.sessions.findIndex(s=>s.id===id);if(i>0){let [s]=S.sessions.splice(i,1);S.sessions.unshift(s);save()}show("report")}
function exportCSV(){let s=latest(),m=merge(s),headers=["Animal","Class","Age","BCS","Pregnancy","Weight kg","Wet/Dry","Draft","Station","Paddock","Mob","Date"],rows=[headers,...m.rec.map((r,i)=>[i+1,classNames[r.classCode]||"",r.age??"",r.bcs??"",r.preg||"",r.weight??"",wetDryNames[r.wetDry]||"",r.draft||"",s.station,s.paddock,s.mob,s.date])];let csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");downloadBlob(new Blob([csv],{type:"text/csv"}),`${safeName(s.station)}_${safeName(s.mob)}_data.csv`)}
function safeName(x){return String(x||"HerdIQ").replace(/[^a-z0-9_-]+/gi,"_")}
function downloadBlob(blob,name){let a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function buildPdfBlob(){let s=latest(),m=merge(s);if(!s)throw new Error("No report available");let {jsPDF}=window.jspdf||{};if(!jsPDF)throw new Error("PDF library did not load");let doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"}),y=18;doc.setFontSize(18);doc.text("Central Vets HerdIQ",14,y);y+=8;doc.setFontSize(13);doc.text(`${s.station} — ${s.mob}`,14,y);y+=7;doc.setFontSize(10);doc.text(`${s.date} | ${s.paddock} | ${m.rec.length} individual records`,14,y);y+=8;let total=m.rec.filter(r=>r.preg).length,preg=m.rec.filter(r=>r.preg&&r.preg!=="E").length;doc.setFontSize(12);doc.text(`Pregnancy: ${pct(preg,total)}%   Mean BCS: ${avg(m.rec.map(r=>r.bcs))?.toFixed(2)||"-"}   Mean weight: ${avg(m.rec.map(r=>r.weight))?.toFixed(1)||"-"} kg`,14,y);y+=8;let canvases=Array.from(document.querySelectorAll("#report canvas"));for(let i=0;i<canvases.length;i++){if(y>245){doc.addPage();y=15}try{doc.addImage(canvases[i].toDataURL("image/png"),"PNG",14,y,182,58);y+=63}catch(e){}}doc.addPage();doc.setFontSize(14);doc.text("Complete animal data",14,15);doc.autoTable({startY:20,head:[["#","Class","Age","BCS","Preg","Weight","Wet/Dry","Draft"]],body:m.rec.map((r,i)=>[i+1,classNames[r.classCode]||"",r.age??"",r.bcs??"",r.preg||"",r.weight??"",wetDryNames[r.wetDry]||"",r.draft||""]),styles:{fontSize:7},headStyles:{fillColor:[9,36,61]}});return doc.output("blob")}
async function downloadPDF(){try{let s=latest(),blob=await buildPdfBlob();downloadBlob(blob,`${safeName(s.station)}_${safeName(s.mob)}_HerdIQ_Report.pdf`)}catch(e){alert(e.message)}}
async function sharePDF(){try{let s=latest(),blob=await buildPdfBlob(),name=`${safeName(s.station)}_${safeName(s.mob)}_HerdIQ_Report.pdf`,file=new File([blob],name,{type:"application/pdf"});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({title:`HerdIQ report — ${s.station}`,text:`Central Vets HerdIQ report for ${s.mob}`,files:[file]})}else{downloadBlob(blob,name);alert("PDF downloaded. Open it and use the iPad Share button to email it.")}}catch(e){if(e.name!=="AbortError")alert(e.message)}}
function emailDetails(){let s=latest(),st=station(s?.station),to=st?.email||reportClientEmail.value||"",subject=encodeURIComponent(`Central Vets HerdIQ Report - ${s?.station||""} - ${s?.mob||""}`),body=encodeURIComponent(`Hi,\n\nPlease find the Central Vets HerdIQ report for ${s?.station||""} - ${s?.mob||""}.\n\nUse the Share PDF button to attach the generated PDF.\n\nKind regards,\nDr Ryan Smith BVSc\nCentral Veterinary Surgery`);location.href=`mailto:${to}?subject=${subject}&body=${body}`}
function beep(f,d=.08){try{let c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=f;o.start();o.stop(c.currentTime+d)}catch(e){}}function completeSound(){beep(900,.12);setTimeout(()=>beep(1250,.14),140)}function errorSound(){beep(220,.15)}
function renderStorageStatus(){if(!window.storageStatus)return;let bytes=new Blob([JSON.stringify(S)]).size, sessions=S.sessions?.length||0, records=(S.sessions||[]).reduce((n,x)=>n+(x.records?.length||0),0)+(S.records?.length||0),last=S.meta?.lastSaved?new Date(S.meta.lastSaved).toLocaleString():"Not yet saved";storageStatus.textContent=`Saved locally • ${sessions} completed sessions • ${records} animal records • ${(bytes/1024).toFixed(1)} KB • Last save ${last}`;if(window.dataSummary)dataSummary.innerHTML=`<h3>Stored information</h3><p>Stations: <b>${S.stations?.length||0}</b></p><p>Completed sessions: <b>${sessions}</b></p><p>Current unsaved session records: <b>${S.records?.length||0}</b></p><p>Total individual animal records: <b>${records}</b></p>`}
async function requestPersistentStorage(){try{if(!navigator.storage?.persist)throw new Error("Persistent storage is not supported by this browser.");let ok=await navigator.storage.persist();renderStorageStatus();alert(ok?"Offline storage protection has been granted on this device.":"The browser did not grant protected storage. Continue making regular backup files.")}catch(e){alert(e.message)}}
function exportBackup(){save();let payload={format:"Central Vets HerdIQ Backup",version:100,exportedAt:new Date().toISOString(),state:S};downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),`HerdIQ_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`)}
async function importBackup(file){if(!file)return;try{let payload=JSON.parse(await file.text()),state=payload.state||payload;if(!state||!Array.isArray(state.sessions)||!Array.isArray(state.stations))throw new Error("This is not a valid HerdIQ backup file.");if(!confirm(`Restore this backup? It contains ${state.sessions.length} completed sessions and will replace the data currently on this device.`))return;S=state;save();alert("Backup restored successfully.");location.reload()}catch(e){alert("Backup could not be restored: "+e.message)}finally{if(window.backupFile)backupFile.value=""}}
function clearAll(){if(confirm("Clear all HerdIQ local data?")){localStorage.removeItem(KEY);location.reload()}}
load();sessionDate.value=today();sessionYear.value=new Date().getFullYear();if(window.calDate)calDate.value=today();if(window.calYear)calYear.value=new Date().getFullYear();if(window.bpYear)bpYear.value=new Date().getFullYear();if(window.evYear)evYear.value=new Date().getFullYear();renderHome();renderStorageStatus();window.addEventListener("beforeunload",save);
return{show,quickStart,repeatLast,applyPreset,saveStation,loadStationDefaults,addDraftRule,removeDraft,clearDraftRules,draftPreset,renderCalvingGuide,startSession,setYard,finishSession,addCalendarEvent,renderCalendar,loadStrategyDefaults,calculateEconomics,saveScenario,calculateBullPower,saveBullPower,runEvidenceEngine,saveEvidenceRun,renderHistory,openSession,renderReport,exportCSV,downloadPDF,sharePDF,emailDetails,editRecord,backField,selectTouchValue,confirmTypedEntry,clearCurrentAnimal,undoLast,exportBackup,importBackup,requestPersistentStorage,renderStorageStatus,clearAll}
})();