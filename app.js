const HerdIQ=(()=>{const KEY="HERDIQ_V50";
const classNames={H:"Maiden heifer",F:"First-lactation heifer",W:"Wet cow",D:"Dry cow",C:"Cull cow",S:"Speyed cow",B:"Bull"};
const pregStages=["E","P1","P2","P3","P4","P5","P6","P7","P8","P9"];
const yardClasses=["Calves","Weaners","Bulls","Steers","Mickies","Speyed cows","Cull cows","Other"];
let S={stations:[],sessions:[],calendarEvents:[],economicScenarios:[],bullPowerScenarios:[],evidenceRuns:[],active:null,records:[],draftRules:[],yard:{},animal:{}};let charts=[];
const $=id=>document.getElementById(id), uid=()=>crypto.randomUUID(), today=()=>new Date().toISOString().slice(0,10);
const pct=(n,d)=>d?Math.round(n/d*100):0;const avg=a=>{let v=a.filter(x=>x!==null&&x!==undefined&&!isNaN(x));return v.length?v.reduce((x,y)=>x+y,0)/v.length:null};const pregNo=p=>!p||p==="E"?0:Number(String(p).replace("P",""));
function save(){localStorage.setItem(KEY,JSON.stringify(S))}function load(){let r=localStorage.getItem(KEY);if(r)S=JSON.parse(r);S.stations??=[];S.sessions??=[];S.calendarEvents??=[];S.economicScenarios??=[];S.bullPowerScenarios??=[];S.evidenceRuns??=[];S.records??=[];S.draftRules??=[];S.yard??={};S.animal??={}}
function show(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));$(id).classList.add("active");if(id==="home")renderHome();if(id==="setup"){renderDraftRules();renderCalvingGuide()}if(id==="crush"){renderCrush();setTimeout(()=>quickInput.focus(),50)}if(id==="endmob")renderYardInputs();if(id==="calendar")renderCalendar();if(id==="economics"){if(S.active&&!ecoStation.value)ecoStation.value=S.active.station;loadStrategyDefaults();}if(id==="bullpower"){if(S.active&&!bpStation.value){bpStation.value=S.active.station;bpYear.value=S.active.year;bpFemales.value=S.records.length||1000;}if(!bpYear.value)bpYear.value=new Date().getFullYear();}if(id==="evidence"){if(S.active&&!evStation.value){evStation.value=S.active.station;evYear.value=S.active.year;}if(!evYear.value)evYear.value=new Date().getFullYear();}if(id==="report")renderReport();if(id==="history")renderHistory()}
function station(name){return S.stations.find(s=>(s.name||"").toLowerCase()===(name||"").toLowerCase())}
function benchmark(country){return {"Southern Forest":{preg:87,weaner:191,loss:5,missing:8},"Central Forest":{preg:88,weaner:195,loss:6,missing:6},"Northern Downs":{preg:82,weaner:163,loss:7,missing:7},"Northern Forest":{preg:66,weaner:93,loss:14,missing:12},"Mixed / Other":{preg:82,weaner:163,loss:7,missing:7}}[country||"Mixed / Other"]}
function renderHome(){let a=S.active,l=S.sessions[0];homeSummary.innerHTML=`<p>${a?`<b>Active:</b> ${a.station} / ${a.mob} — ${S.records.length} females recorded`:"No active session."}</p><p>${l?`<b>Last:</b> ${l.station} ${l.year} / ${l.paddock} / ${l.mob}`:"No saved sessions yet."}</p><p><b>Workflow:</b> Setup → Crush females → End-of-mob tally → Report.</p>`}
function quickStart(type){show("setup");applyPreset(type)}
function repeatLast(){let l=S.sessions[0];if(!l){alert("No previous session.");return}show("setup");sessionType.value=l.type;sessionStation.value=l.station;sessionYear.value=l.year;sessionDate.value=today();sessionPaddock.value=l.paddock;sessionMob.value=l.mob;sessionVet.value=l.vet;sessionRecorder.value=l.recorder;fieldClass.checked=l.fields.class;fieldAge.checked=l.fields.age;fieldPreg.checked=l.fields.preg;fieldBCS.checked=l.fields.bcs;fieldWeight.checked=l.fields.weight;defaultClass.value=l.defaultClass||"";weightMode.value=l.weightMode||"off";S.draftRules=JSON.parse(JSON.stringify(l.draftRules||[]));renderDraftRules()}
function applyPreset(type){sessionYear.value=new Date().getFullYear();sessionDate.value=today();if(type==="heifer"){sessionType.value="crush";fieldClass.checked=true;fieldAge.checked=true;fieldPreg.checked=true;fieldBCS.checked=true;fieldWeight.checked=true;weightMode.value="heifers";defaultClass.value="";draftPreset("heifers")}else if(type==="mob"){sessionType.value="mob";fieldClass.checked=false;fieldAge.checked=false;fieldPreg.checked=false;fieldBCS.checked=false;fieldWeight.checked=false;weightMode.value="off"}else{sessionType.value="crush";fieldClass.checked=true;fieldAge.checked=true;fieldPreg.checked=true;fieldBCS.checked=true;fieldWeight.checked=false;weightMode.value="off";defaultClass.value="";draftPreset("cows")}}
function saveStation(){let s={id:uid(),name:stName.value||"Unnamed Station",manager:stManager.value,region:stRegion.value,country:stCountry.value,total:+stTotal.value||0,breeders:+stBreeders.value||0,heiferGrowth:+stHeiferGrowth.value||0,cowGrowth:+stCowGrowth.value||0,puberty:+stPuberty.value||320,targetBCS:+stTargetBCS.value||3,dryBcsChange:+stDryBcsChange.value||0,wetBcsChange:+stWetBcsChange.value||0,phos:stPhos.value,dryFeed:stDryFeed.value,wetPStatus:stWetPStatus.value,proteinRisk:stProteinRisk.value,utilisation:stUtilisation.value,landCondition:stLandCondition.value,bosIndicusPct:+stBosIndicusPct.value||0,firstJoinMonths:+stFirstJoinMonths.value||0,calvingStartMonth:stCalvingStartMonth.value,earlyWeanCost:+stEarlyWeanCost.value||0,economics:{cowValue:+stCowValue.value||0,pticValue:+stPticValue.value||0,weanerValue:+stWeanerValue.value||0,calfValue:+stCalfValue.value||0,heiferValue:+stHeiferValue.value||0,bullValue:+stBullValue.value||0,steerValue:+stSteerValue.value||0,cullCowValue:+stCullCowValue.value||0,lickCostDay:+stLickCostDay.value||0,musteringCost:+stMusteringCost.value||0,transportCost:+stTransportCost.value||0,vetCostHead:+stVetCostHead.value||0,pgCost:+stPgCost.value||0,hgpCost:+stHgpCost.value||0,hgpGainKg:+stHgpGainKg.value||0,kgPrice:+stKgPrice.value||0,oosDiscount:+stOosDiscount.value||0,calfWastage:+stCalfWastage.value||0,rejoinPregPct:+stRejoinPregPct.value||0,discountRate:+stDiscountRate.value||0,targetWeanerKg:+stTargetWeanerKg.value||0,peakJoinPct:+stPeakJoinPct.value||0,bullCapacityDay:+stBullCapacityDay.value||0,peakMatingDays:+stPeakMatingDays.value||0,backupBulls:+stBackupBulls.value||0}};S.stations=S.stations.filter(x=>x.name.toLowerCase()!=s.name.toLowerCase());S.stations.unshift(s);save();stationPreview.innerHTML=stationHtml(s);completeSound()}
function stationHtml(s){return `<h3>${s.name}</h3><p>${s.country} | ${s.total||"?"} cattle | ${s.breeders||"?"} breeders</p><p>Heifer growth ${s.heiferGrowth}kg/yr; cow growth ${s.cowGrowth}kg/yr; puberty target ${s.puberty}kg; target BCS ${s.targetBCS}.</p><p>Economics: weaner $${s.economics?.weanerValue||0}, cow $${s.economics?.cowValue||0}, lick $${s.economics?.lickCostDay||0}/hd/day, HGP $${s.economics?.hgpCost||0}, PG $${s.economics?.pgCost||0}.</p><p>CashCow assumptions: calf wastage ${s.economics?.calfWastage||0}%, rejoin conception ${s.economics?.rejoinPregPct||0}%, discount rate ${s.economics?.discountRate||0}%.</p><p>Evidence settings: P ${s.wetPStatus||"Unknown"}, protein risk ${s.proteinRisk||"Unknown"}, utilisation ${s.utilisation||"Unknown"}, land condition ${s.landCondition||"Unknown"}.</p>`}
function loadStationDefaults(){let s=station(sessionStation.value);if(s)stationPreview.innerHTML=stationHtml(s)}
function vals(id){return Array.from($(id).selectedOptions).map(o=>o.value)}
function addDraftRule(){S.draftRules.push({id:uid(),name:draftName.value||`Pen ${S.draftRules.length+1}`,classes:vals("draftClasses"),pregs:vals("draftPregs")});draftName.value="";save();renderDraftRules()}
function clearDraftRules(){S.draftRules=[];save();renderDraftRules()}
function draftPreset(type){S.draftRules=type==="heifers"?[{id:uid(),name:"Empty heifers",classes:["H","F"],pregs:["E"]},{id:uid(),name:"P1-P3 heifers",classes:["H","F"],pregs:["P1","P2","P3"]},{id:uid(),name:"P4-P6 heifers",classes:["H","F"],pregs:["P4","P5","P6"]},{id:uid(),name:"P7-P9 heifers",classes:["H","F"],pregs:["P7","P8","P9"]}]:[{id:uid(),name:"Wet empty + dry P8-P9",classes:["W","D"],pregs:["E","P8","P9"]},{id:uid(),name:"Dry P1-P6",classes:["D"],pregs:["P1","P2","P3","P4","P5","P6"]},{id:uid(),name:"Wet P1-P7",classes:["W"],pregs:["P1","P2","P3","P4","P5","P6","P7"]},{id:uid(),name:"Speyed/cull",classes:["S","C"],pregs:[]}];save();renderDraftRules()}
function renderDraftRules(){if(!window.draftRuleList)return;draftRuleList.innerHTML=S.draftRules.length?S.draftRules.map((r,i)=>`<div class="draft-rule"><b>${i+1}. ${r.name}</b><br>Classes: ${r.classes.map(c=>classNames[c]).join(", ")||"Any"}<br>Preg: ${r.pregs.join(", ")||"Any"} <button onclick="HerdIQ.removeDraft('${r.id}')">Remove</button></div>`).join(""):"No rules selected."}
function removeDraft(id){S.draftRules=S.draftRules.filter(r=>r.id!==id);save();renderDraftRules()}
function addMonths(d,m){let x=new Date(d);x.setMonth(x.getMonth()+m);return x}function mon(d){return d.toLocaleDateString("en-AU",{month:"short",year:"numeric"})}function calvingWindow(p,date=sessionDate.value||today()){if(p==="E")return"Empty";let m=Math.max(0,10-pregNo(p));return `${mon(addMonths(date,m))}–${mon(addMonths(date,m+1))}`}
function renderCalvingGuide(){if(!window.calvingGuide)return;calvingGuide.innerHTML="<h4>Gestation calving guide</h4>"+pregStages.map(p=>`<div><b>${p}</b>: ${calvingWindow(p)}</div>`).join("")}
function startSession(){S.active={id:uid(),type:sessionType.value,station:sessionStation.value||"Unnamed Station",year:+sessionYear.value||new Date().getFullYear(),date:sessionDate.value||today(),paddock:sessionPaddock.value,mob:sessionMob.value,vet:sessionVet.value,recorder:sessionRecorder.value,fields:{class:fieldClass.checked,age:fieldAge.checked,preg:fieldPreg.checked,bcs:fieldBCS.checked,weight:fieldWeight.checked},defaultClass:defaultClass.value,weightMode:weightMode.value,draftRules:JSON.parse(JSON.stringify(S.draftRules))};S.records=[];S.yard={};resetAnimal();save();if(S.active.type==="mob")show("endmob");else show("crush")}
function activeFields(){let s=S.active;if(!s)return[];let arr=[];if(s.fields.class&&!s.defaultClass)arr.push(F.classCode);if(s.fields.age)arr.push(F.age);if(s.fields.preg)arr.push(F.preg);if(s.fields.bcs)arr.push(F.bcs);let cls=S.animal.classCode||s.defaultClass;if(s.fields.weight&&(s.weightMode==="all"||(["H","F"].includes(cls)&&s.weightMode==="heifers")))arr.push(F.weight);return arr}
const F={classCode:{k:"classCode",label:"CLASS",prompt:"ENTER CLASS",hint:"H/F/W/D/C/S",auto:true,val:v=>["H","F","W","D","C","S"].includes(v)?v:null,disp:v=>classNames[v]},age:{k:"age",label:"AGE",prompt:"ENTER AGE",hint:"0-9",auto:true,val:v=>/^[0-9]$/.test(v)?+v:null,disp:v=>v},preg:{k:"preg",label:"PREG",prompt:"ENTER PREG",hint:"E or 1-9",auto:true,val:v=>v==="E"?"E":/^[1-9]$/.test(v)?"P"+v:null,disp:v=>v},bcs:{k:"bcs",label:"BCS",prompt:"ENTER BCS",hint:"1-5",auto:true,val:v=>/^[1-5]$/.test(v)?+v:null,disp:v=>v},weight:{k:"weight",label:"WEIGHT",prompt:"ENTER WEIGHT",hint:"kg + Enter",auto:false,val:v=>+v>0?+v:null,disp:v=>v+"kg"}};
function resetAnimal(){S.animal={id:uid(),classCode:S.active?.defaultClass||null}}function nextIdx(){let a=activeFields();for(let i=0;i<a.length;i++)if(S.animal[a[i].k]===null||S.animal[a[i].k]===undefined||S.animal[a[i].k]==="")return i;return a.length}
function assignDraft(r){for(let d of S.active.draftRules||[]){let okC=!d.classes.length||d.classes.includes(r.classCode),okP=!d.pregs.length||d.pregs.includes(r.preg);if(okC&&okP)return d.name}return"Unallocated"}
function saveAnimal(){let r={...S.animal,station:S.active.station,year:S.active.year,paddock:S.active.paddock,mob:S.active.mob,date:S.active.date};r.draft=assignDraft(r);S.records.push(r);resetAnimal();completeSound();document.body.classList.remove("saved-flash");void document.body.offsetWidth;document.body.classList.add("saved-flash");save();renderCrush("SAVED ✓ "+r.draft)}
function handleEntry(v){let a=activeFields(),i=nextIdx();if(i>=a.length){saveAnimal();return}let f=a[i],val=f.val(String(v).toUpperCase());if(val===null){saveStatus.textContent="Invalid "+f.label;saveStatus.className="save-status error";errorSound();return}S.animal[f.k]=val;if(nextIdx()>=activeFields().length)saveAnimal();else renderCrush("Recorded "+f.label)}
function renderCrush(msg="Ready"){if(!S.active){crushBanner.textContent="No active session.";return}crushBanner.textContent=`${S.active.station} | ${S.active.paddock} | ${S.active.mob} | ${S.active.date}`;let a=activeFields(),i=nextIdx();animalNumber.textContent=S.records.length+1;mainPrompt.textContent=i>=a.length?"SAVED AUTOMATICALLY":a[i].prompt;fieldStack.innerHTML=a.map((f,idx)=>{let v=S.animal[f.k],done=v!==null&&v!==undefined&&v!=="";return `<div class="field-box ${done?'done':idx===i?'current':''}"><div class="field-label">${f.label}</div><div class="field-value">${done?f.disp(v):f.hint}</div><div class="field-icon">${done?'✅':idx===i?'➡️':'⬜'}</div></div>`}).join("");saveStatus.textContent=msg;saveStatus.className="save-status saved";liveRecorded.textContent=S.records.length;let preg=S.records.filter(r=>r.preg&&r.preg!=="E").length;livePregnant.textContent=preg;livePregRate.textContent=pct(preg,S.records.length)+"%";let last=S.records[S.records.length-1];currentDraft.textContent=last?last.draft:"-";let dc={};S.records.forEach(r=>dc[r.draft]=(dc[r.draft]||0)+1);draftBoard.innerHTML=[...new Set([...(S.active.draftRules||[]).map(d=>d.name),"Unallocated"])].map(n=>`<div class="draft-item ${dc[n]?'draftHit':''}"><b>${dc[n]||0}</b> ${n}</div>`).join("");lastFive.innerHTML=S.records.slice(-5).reverse().map((r,i)=>`<div class="last-item">#${S.records.length-i} ${classNames[r.classCode]||""} ${r.preg||""} BCS ${r.bcs??"-"} → ${r.draft}</div>`).join("")}
quickInput.addEventListener("keydown",e=>{if(e.key==="F1"){e.preventDefault();S.records.pop();save();renderCrush("Undid last");return}if(!S.active)return;let f=activeFields()[nextIdx()];if(!f)return;if(f.auto&&e.key.length===1){e.preventDefault();handleEntry(e.key);quickInput.value=""}else if(!f.auto&&e.key==="Enter"){e.preventDefault();handleEntry(quickInput.value);quickInput.value=""}});
function renderYardInputs(){yardInputs.innerHTML=yardClasses.map(c=>`<label>${c}<input type="number" min="0" value="${S.yard[c]||0}" oninput="HerdIQ.setYard('${c}',this.value)"></label>`).join("");renderYardSummary()}function setYard(c,v){S.yard[c]=+v||0;save();renderYardSummary()}function renderYardSummary(){let cows=(S.records.filter(r=>["W","D","C","S"].includes(r.classCode)).length)+(S.yard["Speyed cows"]||0)+(S.yard["Cull cows"]||0),calves=S.yard.Calves||0,weaners=S.yard.Weaners||0;yardSummary.innerHTML=`<h3>End-of-mob summary</h3><p>Calves: ${calves}; Weaners: ${weaners}; Bulls: ${S.yard.Bulls||0}; Steers: ${S.yard.Steers||0}; Speyed: ${S.yard["Speyed cows"]||0}</p><p>Calving/branding estimate: ${pct(calves,cows)}%. Weaning estimate: ${pct(weaners,cows)}%.</p>`}
function finishSession(){if(!S.active)return;S.sessions.unshift({...S.active,records:[...S.records],yard:{...S.yard},finishedAt:new Date().toISOString()});S.active=null;S.records=[];completeSound();save();show("report")}
function latest(){return S.active?{...S.active,records:S.records,yard:S.yard}:S.sessions[0]}function merge(session=latest()){let rec=session?.records||[],yard=session?.yard||{};let preg={};pregStages.forEach(p=>preg[p]=0);rec.forEach(r=>{if(r.preg)preg[r.preg]=(preg[r.preg]||0)+1});let bcs={1:0,2:0,3:0,4:0,5:0};rec.forEach(r=>{if(r.bcs)bcs[r.bcs]=(bcs[r.bcs]||0)+1});let classes={...yard};rec.forEach(r=>{let k=r.classCode==="H"?"Maiden heifers":r.classCode==="F"?"First-lactation heifers":r.classCode==="W"?"Wet cows":r.classCode==="D"?"Dry cows":r.classCode==="C"?"Cull cows":r.classCode==="S"?"Speyed cows":null;if(k)classes[k]=(classes[k]||0)+1});return{rec,yard,preg,bcs,classes}}

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
  const st=station(stationName)||{}, econ=stationEconomics(stationName), bench=cashCowBench(st.country), cows=(classes["Wet cows"]||0)+(classes["Dry cows"]||0)+(classes["Cull cows"]||0)+(classes["Speyed cows"]||0);
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
  const heifers=m?m.rec.filter(r=>["H","F"].includes(r.classCode)):[];
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
    const firstLact=inp.merged?inp.merged.rec.filter(r=>r.classCode==="F").length:0;
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

function renderReport(){let s=latest();if(!s){reportHeader.innerHTML="No saved or active session.";return}let m=merge(s),total=Object.values(m.preg).reduce((a,b)=>a+b,0),preg=total-(m.preg.E||0),st=station(s.station),b=benchmark(st?.country);reportHeader.innerHTML=`<h3>${s.station} — ${s.year} — ${s.paddock} — ${s.mob}</h3><p>${s.date}. Female crush records: ${m.rec.length}. Yard totals merged into final report.</p>`;kpiCard.innerHTML=`<h3>Key performance</h3><p>Pregnancy: ${pct(preg,total)}% vs benchmark ${b.preg}%</p><p>Empty: ${m.preg.E||0} (${pct(m.preg.E||0,total)}%)</p><p>In-season estimate P1-P6: ${pct(["P1","P2","P3","P4","P5","P6"].reduce((a,k)=>a+m.preg[k],0),preg)}%</p><p>Early/out-of-season estimate P7-P9: ${pct(["P7","P8","P9"].reduce((a,k)=>a+m.preg[k],0),preg)}%</p>`;forecastCard.innerHTML=`<h3>Calving forecast</h3><table class="table"><tr><th>Preg</th><th>Head</th><th>Expected calving</th></tr>${pregStages.filter(p=>p!="E").map(p=>`<tr><td>${p}</td><td>${m.preg[p]}</td><td>${calvingWindow(p,s.date)}</td></tr>`).join("")}</table>`;let lowBcs=(m.bcs[1]||0)+(m.bcs[2]||0);advisoryCard.innerHTML=`<h3>Veterinary advisory</h3><p>${pct(m.preg.E||0,total)>15?'<span class="bad">Empty rate is high. Review nutrition, bulls, vibriosis/pestivirus and joining management.</span>':'<span class="good">Empty rate is acceptable against current targets.</span>'}</p><p>${lowBcs>0?'<span class="warn">BCS 1–2 cattle present. Consider nutritional segregation and early weaning options.</span>':'No major BCS 1–2 flag from current records.'}</p><p>${st&&(st.phos==="Likely marginal"||st.phos==="Likely deficient")?'<span class="warn">Station profile flags phosphorus risk.</span>':''}</p>`;mergedCard.innerHTML=`<h3>Merged class totals</h3><table class="table"><tr><th>Class</th><th>Head</th></tr>${Object.keys(m.classes).map(k=>`<tr><td>${k}</td><td>${m.classes[k]}</td></tr>`).join("")}</table>`;if(window.economicsCard)economicsCard.innerHTML=renderEconomicSummary(s.station);if(window.calendarCard)calendarCard.innerHTML=renderCalendarSummary(s.station,s.year);if(window.bullPowerCard)bullPowerCard.innerHTML=renderBullPowerSummary(s.station);if(window.evidenceCard)evidenceCard.innerHTML=renderEvidenceSummary(s.station);if(window.cashCowOpportunityCard){const op=cashCowOpportunity(s.station,s.year,m.classes);cashCowOpportunityCard.innerHTML=`<h3>CashCow opportunity</h3><p>Current est. weaner production: ${op.currentKgCow} kg/cow vs benchmark ${op.bench.weanerKgCow} kg/cow.</p><p>Gap: ${op.gap} kg/cow across ${op.cows} cows = <b class="${op.opportunity?'profit':''}">$${op.opportunity.toLocaleString()}</b> potential liveweight opportunity.</p><p class="evidenceNote">Uses CashCow-style weaner production kg/cow and country-type benchmarks as the headline reproduction-production KPI.</p>`;}drawCharts(m,b,total,preg)}
function clearCharts(){charts.forEach(c=>c.destroy());charts=[]}function chart(id,type,labels,datasets){charts.push(new Chart($(id),{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,scales:type==="bar"?{y:{beginAtZero:true}}:{}}}))}
function drawCharts(m,b,total,preg){clearCharts();chart("pregChart","bar",pregStages,[{label:"Pregnancy stage",data:pregStages.map(p=>m.preg[p]||0)}]);chart("bcsChart","bar",["1","2","3","4","5"],[{label:"BCS",data:[1,2,3,4,5].map(x=>m.bcs[x]||0)}]);let calv={};pregStages.filter(p=>p!="E").forEach(p=>calv[calvingWindow(p)]=(calv[calvingWindow(p)]||0)+(m.preg[p]||0));chart("calvingChart","bar",Object.keys(calv),[{label:"Expected calvings",data:Object.values(calv)}]);chart("classChart","bar",Object.keys(m.classes),[{label:"Final class count",data:Object.values(m.classes)}]);let dc={};m.rec.forEach(r=>dc[r.draft]=(dc[r.draft]||0)+1);chart("draftChart","bar",Object.keys(dc),[{label:"Drafts",data:Object.values(dc)}]);chart("benchmarkChart","bar",["Pregnancy %","Empty %"],[{label:"This mob",data:[pct(preg,total),pct(m.preg.E||0,total)]},{label:"Benchmark/target",data:[b.preg,10]}])}
function renderHistory(){historyList.innerHTML=S.sessions.map(s=>`<div class="panel"><h3>${s.station} ${s.year}</h3><p>${s.date} — ${s.paddock} / ${s.mob} — ${s.records.length} females recorded</p><button onclick="HerdIQ.openSession('${s.id}')">Open report</button></div>`).join("")||"No saved sessions."}function openSession(id){let i=S.sessions.findIndex(s=>s.id===id);if(i>0){let [s]=S.sessions.splice(i,1);S.sessions.unshift(s);save()}show("report")}
function exportCSV(){let s=latest(),m=merge(s),rows=[["Section","Category","Value"]];Object.keys(m.preg).forEach(k=>rows.push(["Preg",k,m.preg[k]]));Object.keys(m.bcs).forEach(k=>rows.push(["BCS",k,m.bcs[k]]));Object.keys(m.classes).forEach(k=>rows.push(["Class",k,m.classes[k]]));let csv=rows.map(r=>r.map(x=>`"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=`${s?.station||"herdiq"}_report.csv`;a.click()}
function beep(f,d=.08){try{let c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator();o.connect(c.destination);o.frequency.value=f;o.start();o.stop(c.currentTime+d)}catch(e){}}function completeSound(){beep(900,.12);setTimeout(()=>beep(1250,.14),140)}function errorSound(){beep(220,.15)}
function clearAll(){if(confirm("Clear all HerdIQ local data?")){localStorage.removeItem(KEY);location.reload()}}
load();sessionDate.value=today();sessionYear.value=new Date().getFullYear();if(window.calDate)calDate.value=today();if(window.calYear)calYear.value=new Date().getFullYear();if(window.bpYear)bpYear.value=new Date().getFullYear();if(window.evYear)evYear.value=new Date().getFullYear();renderHome();
return{show,quickStart,repeatLast,applyPreset,saveStation,loadStationDefaults,addDraftRule,removeDraft,clearDraftRules,draftPreset,renderCalvingGuide,startSession,setYard,finishSession,addCalendarEvent,renderCalendar,loadStrategyDefaults,calculateEconomics,saveScenario,calculateBullPower,saveBullPower,runEvidenceEngine,saveEvidenceRun,renderHistory,openSession,renderReport,exportCSV,clearAll}
})();