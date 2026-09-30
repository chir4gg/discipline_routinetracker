function weeklyRanges() {
  const dates = getChallengeDates();
  const weeks = [];
  for (let i=0; i<dates.length; i+=7) weeks.push(dates.slice(i,i+7));
  return weeks;
}

function weeklyStats(week) {
  const habits = activeHabits();
  let completed = 0, possible = 0;
  const perHabit = habits.map(h => ({ habit:h, count:0 }));
  week.forEach(key => {
    const data = getDayData(key);
    habits.forEach((h, i) => {
      possible++;
      if (data.habits[h.id] === true) { completed++; perHabit[i].count++; }
    });
  });
  const stepGoal = Number(APP_STATE.settings.stepGoal) || 10000;
  const entered = week.filter(k => getDayData(k).steps !== null && getDayData(k).steps !== undefined && getDayData(k).steps !== "");
  const total = entered.reduce((s,k)=>s+Number(getDayData(k).steps||0),0);
  return { completed, possible, percent: possible ? Math.round(completed/possible*100) : 0, perHabit, entered, total, average:entered.length ? Math.round(total/entered.length) : 0, achieved:entered.filter(k=>Number(getDayData(k).steps)>=stepGoal).length };
}

function monthStats(month) {
  const dates = getChallengeDates().filter(k => monthKey(parseDateKey(k)) === month);
  const habits = activeHabits();
  let completed=0, possible=0;
  dates.forEach(k => habits.forEach(h => { possible++; if(getDayData(k).habits[h.id]===true) completed++; }));
  const entered = dates.filter(k => getDayData(k).steps !== null && getDayData(k).steps !== undefined && getDayData(k).steps !== "");
  const steps = entered.reduce((s,k)=>s+Number(getDayData(k).steps||0),0);
  const pages = dates.reduce((s,k)=>s+Number(getDayData(k).bookPages||0),0);
  const goal=Number(APP_STATE.settings.stepGoal)||10000;
  return { dates, completed, possible, percent:possible?Math.round(completed/possible*100):0, steps, average:entered.length?Math.round(steps/entered.length):0, achieved:entered.filter(k=>Number(getDayData(k).steps)>=goal).length, pages };
}

function weightEntries() {
  return getChallengeDates().map(key => ({ key, value: getDayData(key).weight }))
    .filter(item => item.value != null && Number.isFinite(Number(item.value)));
}

function renderWeightOverview() {
  const entries = weightEntries();
  const start = Number(APP_STATE.settings.startingWeight || 92);
  const current = entries.length ? Number(entries[entries.length - 1].value) : start;
  const change = current - start;
  return { start, current, change, entries };
}

function renderStatisticsPage() {
  const overallDates = getChallengeDates();
  const habits = activeHabits();
  let completed=0, possible=0;
  overallDates.forEach(k=>habits.forEach(h=>{possible++;if(getDayData(k).habits[h.id]===true)completed++;}));
  const hs = habits.map(h=>({habit:h,...habitStats(h.id)}));
  const best = hs.length ? hs.reduce((a,b)=>b.completed>a.completed?b:a) : null;
  const missed = hs.length ? hs.reduce((a,b)=>((overallDates.length-b.completed)>(overallDates.length-a.completed)?b:a)) : null;
  const os = overallStreak(), ss = stepsStats();
  const enteredDays = overallDates.filter(k=>getDayData(k).steps !== null && getDayData(k).steps !== undefined && getDayData(k).steps !== "");
  const pages = totalBookPages();
  const avgPages = enteredDays.length ? Math.round(pages/enteredDays.length) : 0;

  document.getElementById("stats-overview").innerHTML = [
    ["Overall completion", `${possible?Math.round(completed/possible*100):0}%`, `${completed}/${possible} habits`],
    ["Total completed", completed, "habit check-ins"],
    ["Current streak", `${os.current} days`, "all active habits"],
    ["Best streak", `${os.best} days`, "all active habits"],
    ["Total steps", ss.total.toLocaleString(), `${ss.achieved} days at goal`],
    ["Average steps", ss.average.toLocaleString(), "entered days"],
    ["10k+ days", ss.achieved, `of ${ss.entered} entered`],
    ["Book pages", pages, `${avgPages} avg / entered day`],
    ["Most completed", best ? best.habit.name : "—", best ? `${best.completed}/${overallDates.length}` : ""],
    ["Most missed", missed ? missed.habit.name : "—", missed ? `${overallDates.length-missed.completed} missed` : ""]
  ].map(([label,value,detail])=>`<article class="stat-card"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div><div class="detail">${escapeHtml(detail)}</div></article>`).join("");

  renderWeeklyAnalysis();
  renderMonthlyAnalysis();
  renderCharts();
}

function renderWeeklyAnalysis() {
  const container = document.getElementById("weekly-analysis");
  container.innerHTML = weeklyRanges().map((week,i)=>{
    const s=weeklyStats(week), a=dateParts(week[0]), b=dateParts(week[week.length-1]);
    return `<article class="week-card"><div class="week-header"><div><h3>WEEK ${i+1}</h3><p>${a.monthShort} ${a.day} — ${b.monthShort} ${b.day}</p></div><div class="week-score">${s.percent}%</div></div>
      <p class="muted" style="font-size:11px;margin:10px 0 0">${s.completed} / ${s.possible} habit completions · ${s.achieved}/${s.entered} step-goal days</p>
      <div class="week-habits">${s.perHabit.map(x=>`<div class="habit-analysis"><span>${escapeHtml(x.habit.name)}</span><strong>${x.count}/${week.length}</strong><div class="analysis-track"><div class="analysis-fill" style="width:${Math.round(x.count/week.length*100)}%"></div></div></div>`).join("")}</div>
      <table class="steps-table"><thead><tr><th>Day</th><th>Steps</th></tr></thead><tbody>${week.map(k=>`<tr><td>${dateParts(k).weekdayShort} ${dateParts(k).day}</td><td>${getDayData(k).steps==null?"—":Number(getDayData(k).steps).toLocaleString()}</td></tr>`).join("")}</tbody></table>
      <p class="muted" style="font-size:11px;margin-bottom:0">Total: ${s.total.toLocaleString()} · Average: ${s.average.toLocaleString()}/entered day</p>
    </article>`;
  }).join("");
}

function renderMonthlyAnalysis() {
  document.getElementById("monthly-analysis").innerHTML = getMonths().map(m=>{
    const s=monthStats(m), d=parseDateKey(`${m}-01`);
    const name=new Intl.DateTimeFormat("en-US",{month:"long"}).format(d);
    return `<article class="month-card"><h3>${name}</h3>
      <div class="month-stat"><span>Completion</span><strong>${s.percent}%</strong></div>
      <div class="month-stat"><span>Steps</span><strong>${s.steps.toLocaleString()}</strong></div>
      <div class="month-stat"><span>Average steps</span><strong>${s.average.toLocaleString()}</strong></div>
      <div class="month-stat"><span>10k+ days</span><strong>${s.achieved}</strong></div>
      <div class="month-stat"><span>Book pages</span><strong>${s.pages}</strong></div>
    </article>`;
  }).join("");
}

let CHARTS = {};
function destroyCharts(){ Object.values(CHARTS).forEach(c=>c?.destroy()); CHARTS={}; }

function chartDefaults() {
  return { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{
    x:{grid:{color:"rgba(127,140,150,.08)"},ticks:{color:getComputedStyle(document.documentElement).getPropertyValue("--muted")}},
    y:{grid:{color:"rgba(127,140,150,.08)"},ticks:{color:getComputedStyle(document.documentElement).getPropertyValue("--muted")}}
  }};
}
function renderCharts(){
  if(typeof Chart==="undefined") return;
  destroyCharts();
  const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#69e6a3";
  const dates=getChallengeDates();
  const weeks=weeklyRanges();
  CHARTS.weekly=new Chart(document.getElementById("weeklyChart"),{type:"bar",data:{labels:weeks.map((_,i)=>`W${i+1}`),datasets:[{data:weeks.map(w=>weeklyStats(w).percent),backgroundColor:accent,borderRadius:7}]},options:{...chartDefaults(),scales:{...chartDefaults().scales,y:{...chartDefaults().scales.y,min:0,max:100}}}});
  CHARTS.steps=new Chart(document.getElementById("stepsChart"),{type:"line",data:{labels:dates.map(k=>`${dateParts(k).monthShort} ${dateParts(k).day}`),datasets:[{data:dates.map(k=>getDayData(k).steps),borderColor:accent,backgroundColor:"rgba(105,230,163,.08)",spanGaps:false,tension:.3,pointRadius:2,fill:true},{data:dates.map(()=>Number(APP_STATE.settings.stepGoal)||10000),borderColor:"#8f9aa3",borderDash:[5,5],pointRadius:0}]},options:chartDefaults()});
  const habits=activeHabits();
  CHARTS.habits=new Chart(document.getElementById("habitChart"),{type:"bar",data:{labels:habits.map(h=>h.name.length>18?h.name.slice(0,18)+"…":h.name),datasets:[{data:habits.map(h=>Math.round(habitStats(h.id).completed/dates.length*100)),backgroundColor:accent,borderRadius:7}]},options:{...chartDefaults(),indexAxis:"y",scales:{...chartDefaults().scales,x:{...chartDefaults().scales.x,min:0,max:100}}}});
  CHARTS.weight=new Chart(document.getElementById("weightChart"),{type:"line",data:{labels:dates.filter(k=>getDayData(k).weight!=null).map(k=>`${dateParts(k).monthShort} ${dateParts(k).day}`),datasets:[{label:"Weight",data:dates.filter(k=>getDayData(k).weight!=null).map(k=>Number(getDayData(k).weight)),borderColor:accent,backgroundColor:"rgba(105,230,163,.08)",spanGaps:false,tension:.3,pointRadius:3,fill:true},{label:"Starting weight",data:dates.filter(k=>getDayData(k).weight!=null).map(()=>Number(APP_STATE.settings.startingWeight||92)),borderColor:"#8f9aa3",borderDash:[5,5],pointRadius:0}]},options:{...chartDefaults(),scales:{...chartDefaults().scales,y:{...chartDefaults().scales.y,title:{display:true,text:"kg"}}}}});
  CHARTS.months=new Chart(document.getElementById("monthlyChart"),{type:"bar",data:{labels:getMonths().map(m=>new Intl.DateTimeFormat("en-US",{month:"short"}).format(parseDateKey(`${m}-01`))),datasets:[{data:getMonths().map(m=>monthStats(m).percent),backgroundColor:accent,borderRadius:7}]},options:{...chartDefaults(),scales:{...chartDefaults().scales,y:{...chartDefaults().scales.y,min:0,max:100}}}});
}