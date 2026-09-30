const STORAGE_KEY = "discipline92_v1";
const START_DATE = "2026-10-01";
const END_DATE = "2026-12-31";

const DEFAULT_HABITS = [
  { id:"wakeUp", name:"Wake up at 5:00 AM", icon:"⏰", target:"5:00 AM", active:true },
  { id:"meditation", name:"Meditation", icon:"🧘", target:"Daily", active:true },
  { id:"running", name:"Running", icon:"🏃", target:"Daily", active:true },
  { id:"coldShower", name:"Cold shower", icon:"🚿", target:"Daily", active:true },
  { id:"reading", name:"Read a book", icon:"📖", target:"Pages", active:true },
  { id:"healthy", name:"Eat healthy", icon:"🥗", target:"No junk / balanced", active:true },
  { id:"planning", name:"Morning planning", icon:"📝", target:"Plan the day", active:true },
  { id:"dsa", name:"DSA — 7:00 AM to 7:30 AM", icon:"💻", target:"30 minutes", active:true },
  { id:"college", name:"College work", icon:"🎓", target:"Daily", active:true },
  { id:"noSocial", name:"No social media — 8:00 AM to 3:00 PM", icon:"📵", target:"8 AM — 3 PM", active:true },
  { id:"eveningStudy", name:"Evening study", icon:"🌆", target:"Daily", active:true },
  { id:"java", name:"Java / Programming", icon:"☕", target:"Daily", active:true },
  { id:"dinner", name:"Dinner", icon:"🍽️", target:"Daily", active:true },
  { id:"steps", name:"10,000+ steps", icon:"🚶", target:"10,000+", active:true },
  { id:"skincare", name:"Skincare", icon:"🧴", target:"Before bed", active:true },
  { id:"sleep", name:"Sleep on time", icon:"😴", target:"Before midnight", active:true }
];

function makeDefaultState() {
  return {
    version: 1,
    settings: { stepGoal: 10000, theme: "dark", startingWeight: 92 },
    habits: structuredClone(DEFAULT_HABITS),
    days: {}
  };
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = makeDefaultState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw);
    const fresh = makeDefaultState();
    return {
      ...fresh,
      ...parsed,
      settings: { ...fresh.settings, ...(parsed.settings || {}) },
      habits: Array.isArray(parsed.habits) && parsed.habits.length ? parsed.habits : fresh.habits,
      days: parsed.days || {}
    };
  } catch {
    return makeDefaultState();
  }
}

let APP_STATE = loadState();

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(APP_STATE));
  window.dispatchEvent(new CustomEvent("discipline:datachanged"));
}

function getDayData(dateKey) {
  if (!APP_STATE.days[dateKey]) {
    APP_STATE.days[dateKey] = { habits: {}, steps: null, bookPages: 0 };
  }
  if (!APP_STATE.days[dateKey].habits) APP_STATE.days[dateKey].habits = {};
  if (typeof APP_STATE.days[dateKey].bookPages !== "number") APP_STATE.days[dateKey].bookPages = 0;
  if (!(typeof APP_STATE.days[dateKey].weight === "number" && Number.isFinite(APP_STATE.days[dateKey].weight))) APP_STATE.days[dateKey].weight = null;
  return APP_STATE.days[dateKey];
}

function setHabitState(dateKey, habitId, value) {
  getDayData(dateKey).habits[habitId] = Boolean(value);
  saveState();
}

function setDaySteps(dateKey, value) {
  getDayData(dateKey).steps = value === "" || value === null ? null : Math.max(0, Number(value));
  saveState();
}

function setBookPages(dateKey, value) {
  getDayData(dateKey).bookPages = Math.max(0, Number(value) || 0);
  saveState();
}

function setDayWeight(dateKey, value) {
  const raw = String(value ?? "").trim();
  getDayData(dateKey).weight = raw === "" ? null : Math.max(0, Number(raw));
  saveState();
}

function resetDay(dateKey) {
  delete APP_STATE.days[dateKey];
  saveState();
}

function resetAll() {
  APP_STATE = makeDefaultState();
  saveState();
}

function exportData() {
  const blob = new Blob([JSON.stringify(APP_STATE, null, 2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "92-day-discipline-backup.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  return file.text().then(text => {
    const imported = JSON.parse(text);
    if (!imported || !imported.settings || !imported.habits || !imported.days) throw new Error("Invalid backup");
    APP_STATE = {
      ...makeDefaultState(),
      ...imported,
      settings: { ...makeDefaultState().settings, ...imported.settings }
    };
    saveState();
  });
}