let state = {
  session: null,
  records: []
};

const classNames = {
  H: "Maiden Heifer",
  F: "First Lactation Heifer",
  W: "Wet Cow",
  D: "Dry Cow",
  C: "Cull for Age Cow"
};

function loadState() {
  const saved = localStorage.getItem("cvsCattleRecorder");
  if (saved) state = JSON.parse(saved);
  updateUI();
}

function saveState() {
  localStorage.setItem("cvsCattleRecorder", JSON.stringify(state));
  updateUI();
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  if (id === "crush") setTimeout(() => document.getElementById("crushInput").focus(), 100);
}

function startSession() {
  state.session = {
    id: crypto.randomUUID(),
    stationName: document.getElementById("stationName").value || "Unnamed Station",
    paddockName: document.getElementById("paddockName").value || "",
    operatorName: document.getElementById("operatorName").value || "",
    sessionDate: document.getElementById("sessionDate").value || new Date().toISOString().slice(0,10),
    recordClass: document.getElementById("recordClass").checked,
    recordAge: document.getElementById("recordAge").checked,
    recordBCS: document.getElementById("recordBCS").checked,
    recordPreg: document.getElementById("recordPreg").checked,
    recordWeight: document.getElementById("recordWeight").checked,
    recordWetDry: document.getElementById("recordWetDry").checked,
    fixedClass: document.getElementById("fixedClass").value,
    fixedWetDry: document.getElementById("fixedWetDry").value
  };
  state.records = [];
  saveState();
  showScreen("crush");
  setStatus("Session started. Ready.", false);
}

const crushInput = document.getElementById("crushInput");
crushInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    processCrushLine(crushInput.value);
    crushInput.value = "";
  }
});

function processCrushLine(line) {
  if (!state.session) {
    setStatus("No session started.", true);
    return;
  }

  const tokens = line.trim().toUpperCase().split(/\s+/).filter(Boolean);
  let i = 0;
  const s = state.session;

  let record = {
    id: crypto.randomUUID(),
    sessionId: s.id,
    stationName: s.stationName,
    paddockName: s.paddockName,
    timestamp: new Date().toISOString(),
    classCode: s.fixedClass || null,
    age: null,
    bcs: null,
    preg: null,
    weight: null,
    wetDry: s.fixedWetDry || null,
    draft: null
  };

  function nextToken() {
    if (i >= tokens.length) return null;
    return tokens[i++];
  }

  if (s.recordClass) {
    const t = nextToken();
    if (!["H","F","W","D","C"].includes(t)) return setStatus("Class required: H/F/W/D/C", true);
    record.classCode = t;
  }

  if (s.recordAge) {
    const t = nextToken();
    if (t === null || isNaN(Number(t)) || Number(t) < 0 || Number(t) > 9) return setStatus("Age/brand must be 0-9", true);
    record.age = Number(t);
  }

  if (s.recordBCS) {
    const t = nextToken();
    if (t === null || isNaN(Number(t)) || Number(t) < 1 || Number(t) > 5) return setStatus("BCS must be 1-5", true);
    record.bcs = Number(t);
  }

  if (s.recordPreg) {
    const t = nextToken();
    if (!isPregToken(t)) return setStatus("Pregnancy must be E or P1-P9", true);
    record.preg = normalisePreg(t);
  }

  if (s.recordWeight) {
    const t = nextToken();
    if (t === null || isNaN(Number(t))) return setStatus("Weight required", true);
    record.weight = Number(t);
  }

  if (s.recordWetDry) {
    const t = nextToken();
    if (!["W","D","WET","DRY"].includes(t)) return setStatus("Wet/Dry must be W/D or WET/DRY", true);
    record.wetDry = (t === "W" || t === "WET") ? "Wet" : "Dry";
  }

  record.draft = assignDraft(record);
  state.records.push(record);
  saveState();

  beep(820);
  setStatus(`Saved ✔ ${classNames[record.classCode] || record.classCode} | ${record.preg || ""} | BCS ${record.bcs ?? "-"} | Draft: ${record.draft}`, false);
}

function isPregToken(t) {
  return t === "E" || /^P[1-9]$/.test(t) || /^[1-9]$/.test(t);
}

function normalisePreg(t) {
  if (t === "E") return "E";
  if (/^[1-9]$/.test(t)) return "P" + t;
  return t;
}

function pregNumber(p) {
  if (!p || p === "E") return 0;
  return Number(p.replace("P",""));
}

function assignDraft(r) {
  const p = pregNumber(r.preg);

  if (r.classCode === "C") return "Draft 5 - Cull for age";
  if (["H","F"].includes(r.classCode) && r.preg === "E") return "Draft 1 - Empty heifers";
  if (["H","F"].includes(r.classCode) && p >= 1 && p <= 3) return "Draft 2 - P1-P3 heifers";
  if (["H","F"].includes(r.classCode) && p >= 4 && p <= 6) return "Draft 3 - P4-P6 heifers";
  if (["H","F"].includes(r.classCode) && p >= 7 && p <= 9) return "Draft 4 - P7-P9 heifers";

  return "Draft 6 - Other cows";
}

function beep(freq) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    osc.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.start();
    osc.stop(ctx.currentTime + 0.10);
  } catch (e) {}
}

function setStatus(msg, error) {
  const el = document.getElementById("status");
  el.textContent = msg;
  el.className = "status " + (error ? "error" : "saved");
  if (error) beep(200);
}

function updateUI() {
  const s = state.session;
  document.getElementById("totalCount").textContent = state.records.length;
  document.getElementById("lastDraft").textContent = state.records.length ? state.records[state.records.length - 1].draft : "-";

  document.getElementById("sessionBanner").textContent = s
    ? `${s.stationName} | ${s.paddockName} | ${s.sessionDate} | ${state.records.length} head`
    : "No active session";
}

function clearAllData() {
  if (confirm("Clear all cattle records and current session?")) {
    state = { session: null, records: [] };
    saveState();
    location.reload();
  }
}

function exportCSV() {
  const rows = [
    ["Station","Paddock","DateTime","Class","Age","BCS","Pregnancy","Weight","WetDry","Draft"]
  ];

  state.records.forEach(r => {
    rows.push([
      r.stationName, r.paddockName, r.timestamp, classNames[r.classCode] || r.classCode,
      r.age ?? "", r.bcs ?? "", r.preg ?? "", r.weight ?? "", r.wetDry ?? "", r.draft ?? ""
    ]);
  });

  const csv = rows.map(row => row.map(x => `"${String(x).replaceAll('"','""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${state.session?.stationName || "session"}_cattle_records.csv`;
  a.click();
}

function groupCount(records, keyFn) {
  const out = {};
  records.forEach(r => {
    const k = keyFn(r) || "Unknown";
    out[k] = (out[k] || 0) + 1;
  });
  return out;
}

function average(arr) {
  const vals = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (!vals.length) return null;
  return vals.reduce((a,b)=>a+b,0) / vals.length;
}

let chartObjects = [];
function clearCharts() {
  chartObjects.forEach(c => c.destroy());
  chartObjects = [];
}

function chart(id, type, labels, data, label) {
  const ctx = document.getElementById(id);
  chartObjects.push(new Chart(ctx, {
    type,
    data: { labels, datasets: [{ label, data }] },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: type === "bar" ? { y: { beginAtZero: true } } : {}
    }
  }));
}

function pregOrderLabels() {
  return ["E","P1","P2","P3","P4","P5","P6","P7","P8","P9"];
}

function generateCharts() {
  clearCharts();
  const records = state.records;
  const pregLabels = pregOrderLabels();
  const pregCounts = groupCount(records, r => r.preg);
  chart("pregChart", "bar", pregLabels, pregLabels.map(l => pregCounts[l] || 0), "Pregnancy stage histogram");

  const bcsLabels = ["1","2","3","4","5"];
  const bcsCounts = groupCount(records, r => r.bcs);
  chart("bcsChart", "bar", bcsLabels, bcsLabels.map(l => bcsCounts[l] || 0), "BCS histogram");

  const draftCounts = groupCount(records, r => r.draft);
  chart("draftChart", "bar", Object.keys(draftCounts), Object.values(draftCounts), "Draft tally");

  const classCounts = groupCount(records, r => classNames[r.classCode] || r.classCode);
  chart("classChart", "bar", Object.keys(classCounts), Object.values(classCounts), "Animal class breakdown");

  const heifers = records.filter(r => ["H","F"].includes(r.classCode));
  const weightByPreg = pregLabels.map(p => average(heifers.filter(r => r.preg === p).map(r => r.weight)) || 0);
  chart("heiferWeightPregChart", "bar", pregLabels, weightByPreg, "Heifers: average weight by pregnancy stage");

  const bcsByPreg = pregLabels.map(p => average(records.filter(r => r.preg === p).map(r => r.bcs)) || 0);
  chart("bcsPregChart", "bar", pregLabels, bcsByPreg, "Average BCS by pregnancy stage");

  buildSummary();
}

function buildSummary() {
  const total = state.records.length;
  const empty = state.records.filter(r => r.preg === "E").length;
  const pregnant = total - empty;
  const avgBCS = average(state.records.map(r => r.bcs));
  const heifers = state.records.filter(r => ["H","F"].includes(r.classCode));
  const avgHeiferWeight = average(heifers.map(r => r.weight));

  document.getElementById("reportSummary").innerHTML = `
    <h3>${state.session?.stationName || ""} — ${state.session?.paddockName || ""}</h3>
    <p><b>Total:</b> ${total} head</p>
    <p><b>Pregnant:</b> ${pregnant} (${total ? Math.round(pregnant/total*100) : 0}%)</p>
    <p><b>Empty:</b> ${empty} (${total ? Math.round(empty/total*100) : 0}%)</p>
    <p><b>Average BCS:</b> ${avgBCS ? avgBCS.toFixed(2) : "N/A"}</p>
    <p><b>Average heifer weight:</b> ${avgHeiferWeight ? avgHeiferWeight.toFixed(1) + " kg" : "N/A"}</p>
  `;
}

async function exportPDF() {
  generateCharts();
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const logo = await imageToDataURL("image.png");
  if (logo) pdf.addImage(logo, "PNG", 15, 10, 35, 35);

  pdf.setFontSize(18);
  pdf.text("Central Veterinary Surgery", 55, 20);
  pdf.setFontSize(14);
  pdf.text("Cattle Pregnancy Testing Report", 55, 30);

  pdf.setFontSize(11);
  pdf.text(`Station: ${state.session?.stationName || ""}`, 15, 55);
  pdf.text(`Paddock: ${state.session?.paddockName || ""}`, 15, 62);
  pdf.text(`Date: ${state.session?.sessionDate || ""}`, 15, 69);
  pdf.text(`Operator: ${state.session?.operatorName || ""}`, 15, 76);

  const total = state.records.length;
  const empty = state.records.filter(r => r.preg === "E").length;
  const pregnant = total - empty;
  const avgBCS = average(state.records.map(r => r.bcs));

  pdf.text(`Total: ${total} head`, 15, 90);
  pdf.text(`Pregnant: ${pregnant} (${total ? Math.round(pregnant/total*100) : 0}%)`, 15, 97);
  pdf.text(`Empty: ${empty} (${total ? Math.round(empty/total*100) : 0}%)`, 15, 104);
  pdf.text(`Average BCS: ${avgBCS ? avgBCS.toFixed(2) : "N/A"}`, 15, 111);

  const chartIds = ["pregChart","bcsChart","draftChart","classChart","heiferWeightPregChart","bcsPregChart"];
  let y = 122;

  for (const id of chartIds) {
    const canvas = document.getElementById(id);
    const img = canvas.toDataURL("image/png", 1.0);
    if (y > 225) {
      pdf.addPage();
      y = 15;
    }
    pdf.addImage(img, "PNG", 15, y, 180, 75);
    y += 85;
  }

  pdf.save(`${state.session?.stationName || "session"}_cattle_report.pdf`);
}

function imageToDataURL(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function() {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

document.getElementById("sessionDate").value = new Date().toISOString().slice(0,10);
loadState();
