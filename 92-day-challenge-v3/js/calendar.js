function parseDateKey(key) {
  const [y,m,d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth()+1).padStart(2,"0");
  const d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function getChallengeDates() {
  const dates = [];
  const start = parseDateKey(START_DATE);
  const end = parseDateKey(END_DATE);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) dates.push(formatDateKey(d));
  return dates;
}

function challengeDayNumber(key) {
  const dates = getChallengeDates();
  return dates.indexOf(key) + 1;
}

function dateParts(key) {
  const date = parseDateKey(key);
  return {
    key,
    date,
    day: date.getDate(),
    weekday: new Intl.DateTimeFormat("en-US", {weekday:"long"}).format(date),
    weekdayShort: new Intl.DateTimeFormat("en-US", {weekday:"short"}).format(date),
    month: new Intl.DateTimeFormat("en-US", {month:"long"}).format(date),
    monthShort: new Intl.DateTimeFormat("en-US", {month:"short"}).format(date),
    year: date.getFullYear(),
    full: new Intl.DateTimeFormat("en-US", {weekday:"long", month:"long", day:"numeric", year:"numeric"}).format(date)
  };
}

function getDateFromQuery() {
  const value = new URLSearchParams(location.search).get("date");
  if (value && getChallengeDates().includes(value)) return value;
  return START_DATE;
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}`;
}

function getMonths() {
  return [...new Set(getChallengeDates().map(k => monthKey(parseDateKey(k))))];
}