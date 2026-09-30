function applyTheme() {
  const theme = APP_STATE.settings.theme || "dark";
  const root = document.documentElement;
  if (theme === "system") root.classList.toggle("light", window.matchMedia("(prefers-color-scheme: light)").matches);
  else root.classList.toggle("light", theme === "light");
  const button=document.getElementById("theme-toggle");
  if(button) button.textContent = root.classList.contains("light") ? "☀" : "☾";
}

function setupThemeButton() {
  const button=document.getElementById("theme-toggle");
  if(!button) return;
  button.addEventListener("click",()=>{
    APP_STATE.settings.theme = document.documentElement.classList.contains("light") ? "dark" : "light";
    saveState(); applyTheme(); refreshCurrentPage();
  });
}

function currentDateKey() {
  const dates=getChallengeDates();
  const now=new Date();
  const today=formatDateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()));
  return dates.includes(today) ? today : START_DATE;
}

function renderDashboard() {
  const dateKey = getDateFromQuery();
  const p = dateParts(dateKey);
  const dayNo = challengeDayNumber(dateKey);
  const completion=habitCompletionForDate(dateKey);
  document.getElementById("date-heading").textContent = p.full;
  document.getElementById("day-counter").textContent = `Day ${dayNo} / 92`;
  document.getElementById("progress-percent").textContent = `${completion.percent}%`;
  document.getElementById("ring-value").textContent = `${completion.percent}%`;
  document.getElementById("progress-bar").style.width = `${completion.percent}%`;
  document.getElementById("progress-ring").style.background = `conic-gradient(var(--accent) ${completion.percent*3.6}deg, var(--surface-3) 0deg)`;
  document.getElementById("progress-detail").textContent = `${completion.completed} of ${completion.total} active habits complete`;
  document.getElementById("completion-badge").textContent = `${completion.completed} / ${completion.total}`;

  const data=getDayData(dateKey), goal=Number(APP_STATE.settings.stepGoal)||10000;
  const steps=data.steps;
  document.getElementById("step-goal").textContent=goal.toLocaleString();
  document.getElementById("steps-input").value=steps ?? "";
  document.getElementById("steps-display").textContent=(steps ?? 0).toLocaleString();
  const sb=document.getElementById("steps-status"), sm=document.getElementById("steps-message");
  if(steps==null){sb.textContent="Enter steps";sb.className="badge neutral";sm.textContent=`Minimum target: ${goal.toLocaleString()}`;}
  else if(steps>=goal){sb.textContent="Goal achieved";sb.className="badge";sm.textContent=`+${(steps-goal).toLocaleString()} above goal`;}
  else {sb.textContent="Below goal";sb.className="badge danger";sm.textContent=`${(goal-steps).toLocaleString()} more to reach goal`;}

  document.getElementById("pages-input").value=data.bookPages||0;
  document.getElementById("pages-today").textContent=`${data.bookPages||0} pages`;

  const weight = data.weight;
  const weightEl = document.getElementById("weight-today");
  if (weightEl) weightEl.textContent = weight == null ? "—" : Number(weight).toFixed(1);
  const weightEntries = getChallengeDates().map(k => ({key:k, value:getDayData(k).weight})).filter(x => x.value != null);
  const lastWeight = weightEntries.length ? weightEntries[weightEntries.length - 1].value : null;
  const changeEl = document.getElementById("weight-change");
  if (changeEl) {
    const change = weight == null ? null : Number(weight) - Number(APP_STATE.settings.startingWeight || 92);
    changeEl.textContent = change == null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`;
  }
  const lastEl = document.getElementById("weight-last");
  if (lastEl) lastEl.textContent = lastWeight == null ? "—" : `${Number(lastWeight).toFixed(1)} kg`;
  const panelWeight = document.getElementById("weight-today-panel");
  if (panelWeight) panelWeight.textContent = weight == null ? "—" : Number(weight).toFixed(1);
  const panelInput = document.getElementById("weight-input-panel");
  if (panelInput) panelInput.value = weight == null ? "" : Number(weight);
  const panelChange = document.getElementById("weight-change-panel");
  if (panelChange) panelChange.textContent = changeEl ? changeEl.textContent : "—";
  const panelLast = document.getElementById("weight-last-panel");
  if (panelLast) panelLast.textContent = lastWeight == null ? "—" : `${Number(lastWeight).toFixed(1)} kg`;
  const pages=totalBookPages(), entered=getChallengeDates().filter(k=>getDayData(k).steps!=null).length;
  document.getElementById("pages-total").textContent=pages;
  document.getElementById("pages-average").textContent=entered?Math.round(pages/entered):0;
  renderHabitList(document.getElementById("habit-list"),dateKey);
  renderStreakPreview();
}

function renderStreakPreview(){
  const container=document.getElementById("streak-preview");
  if(!container)return;
  container.innerHTML=activeHabits().slice(0,8).map(h=>{
    const s=habitStats(h.id);
    return `<article class="streak-card"><div class="icon">${habitIcon(h)}</div><h3>${escapeHtml(h.name)}</h3><div class="streak-value">🔥 ${s.current}</div><div class="streak-sub">Current · Best ${s.best} · ${s.completed}/92 done</div></article>`;
  }).join("");
}

function renderCalendarPage(){
  const container=document.getElementById("calendar-container");
  if(!container)return;
  container.innerHTML=getMonths().map(m=>{
    const first=parseDateKey(`${m}-01`), monthName=new Intl.DateTimeFormat("en-US",{month:"long",year:"numeric"}).format(first);
    const dates=getChallengeDates().filter(k=>monthKey(parseDateKey(k))===m);
    const offset=first.getDay();
    let cells="";
    for(let i=0;i<offset;i++)cells+=`<div class="day-card empty"></div>`;
    dates.forEach(k=>{
      const p=dateParts(k), c=habitCompletionForDate(k), s=getDayData(k).steps;
      cells+=`<a class="day-card" href="index.html?date=${k}" aria-label="Open ${p.full}">
        <div class="day-week">${p.weekdayShort} · Day ${challengeDayNumber(k)}</div><div class="day-number">${p.day}</div>
        <div class="day-progress">${c.percent}%</div><div class="tiny-track"><div class="tiny-fill" style="width:${c.percent}%"></div></div>
        <div class="day-steps">${s==null?"No steps entered":Number(s).toLocaleString()+" steps"}</div>
      </a>`;
    });
    return `<section class="calendar-month"><div class="month-heading"><div><p class="eyebrow">${monthName.toUpperCase()}</p><h2>${monthName}</h2></div><span class="badge">${dates.length} days</span></div><div class="days-grid"><div class="weekday-label">SUN</div><div class="weekday-label">MON</div><div class="weekday-label">TUE</div><div class="weekday-label">WED</div><div class="weekday-label">THU</div><div class="weekday-label">FRI</div><div class="weekday-label">SAT</div>${cells}</div></section>`;
  }).join("");
}

function renderSettingsPage(){
  const goal=document.getElementById("settings-step-goal");
  if(!goal)return;
  goal.value=APP_STATE.settings.stepGoal;
  document.getElementById("habit-settings-list").innerHTML=APP_STATE.habits.map(h=>`<div class="habit-setting">
    <input type="text" value="${escapeHtml(h.name)}" data-name-id="${h.id}" aria-label="Habit name">
    <button class="small-btn ${h.active===false?"":"danger"}" data-toggle-id="${h.id}">${h.active===false?"Enable":"Disable"}</button>
    <button class="small-btn danger" data-delete-id="${h.id}">Delete</button>
  </div>`).join("");
  document.querySelectorAll("[data-name-id]").forEach(i=>i.addEventListener("change",()=>{const h=APP_STATE.habits.find(x=>x.id===i.dataset.nameId);if(h){h.name=i.value.trim()||h.name;saveState();}}));
  document.querySelectorAll("[data-toggle-id]").forEach(b=>b.addEventListener("click",()=>{const h=APP_STATE.habits.find(x=>x.id===b.dataset.toggleId);if(h){h.active=h.active===false;saveState();renderSettingsPage();}}));
  document.querySelectorAll("[data-delete-id]").forEach(b=>b.addEventListener("click",()=>{if(confirm("Delete this habit from the active habit list? Existing historical data will remain.")){APP_STATE.habits=APP_STATE.habits.filter(x=>x.id!==b.dataset.deleteId);saveState();renderSettingsPage();}}));
  document.querySelectorAll(".theme-choice").forEach(b=>{b.classList.toggle("active",b.dataset.themeChoice===APP_STATE.settings.theme);b.onclick=()=>{APP_STATE.settings.theme=b.dataset.themeChoice;saveState();applyTheme();renderSettingsPage();}});
}

function wireDashboardInputs(){
  const dateKey=getDateFromQuery();
  const steps=document.getElementById("steps-input"), pages=document.getElementById("pages-input");
  const weightInputs=[document.getElementById("weight-input"), document.getElementById("weight-input-panel")].filter(Boolean);
  if(steps) steps.addEventListener("change",()=>{setDaySteps(dateKey,steps.value);refreshCurrentPage();});
  if(pages) pages.addEventListener("change",()=>{setBookPages(dateKey,pages.value);refreshCurrentPage();});
  weightInputs.forEach(weight=>weight.addEventListener("change",()=>{setDayWeight(dateKey,weight.value);refreshCurrentPage();}));
}

function refreshCurrentPage(){
  applyTheme();
  if(document.getElementById("habit-list")){renderDashboard();wireDashboardInputs();}
  if(document.getElementById("calendar-container"))renderCalendarPage();
  if(document.getElementById("stats-overview"))renderStatisticsPage();
  if(document.getElementById("settings-step-goal"))renderSettingsPage();
}

document.addEventListener("DOMContentLoaded",()=>{
  applyTheme(); setupThemeButton(); refreshCurrentPage();
  const saveGoal=document.getElementById("save-step-goal");
  if(saveGoal)saveGoal.onclick=()=>{const input=document.getElementById("settings-step-goal");APP_STATE.settings.stepGoal=Math.max(1,Number(input.value)||10000);saveState();refreshCurrentPage();};
  const add=document.getElementById("add-habit");
  if(add)add.onclick=()=>{const input=document.getElementById("new-habit-name"),name=input.value.trim();if(!name)return;let id=name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||`habit-${Date.now()}`;if(APP_STATE.habits.some(h=>h.id===id))id+=`-${Date.now()}`;APP_STATE.habits.push({id,name,icon:"✓",target:"Daily",active:true});input.value="";saveState();renderSettingsPage();};
  const exp=document.getElementById("export-data");if(exp)exp.onclick=exportData;
  const imp=document.getElementById("import-data");if(imp)imp.onchange=()=>{if(imp.files[0])importData(imp.files[0]).then(()=>{alert("Backup imported successfully.");refreshCurrentPage();}).catch(()=>alert("Could not import this backup file."));};
  const resetDayBtn=document.getElementById("reset-day");if(resetDayBtn)resetDayBtn.onclick=()=>{if(confirm("Reset all data for the current day?")){resetDay(getDateFromQuery());refreshCurrentPage();}};
  const resetAllBtn=document.getElementById("reset-all");if(resetAllBtn)resetAllBtn.onclick=()=>{if(confirm("This will permanently clear this browser's 92-day data. Export a backup first. Continue?")){resetAll();refreshCurrentPage();}};
});
window.addEventListener("discipline:datachanged",()=>{ if(document.visibilityState!=="hidden") refreshCurrentPage(); });
// Service worker is intentionally disabled during local development to avoid stale UI/cache issues.
if ("serviceWorker" in navigator && location.hostname !== "127.0.0.1" && location.hostname !== "localhost") {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(()=>{}));
}
