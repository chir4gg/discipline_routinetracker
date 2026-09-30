function activeHabits() {
  return APP_STATE.habits.filter(h => h.active !== false);
}

function habitCompletionForDate(dateKey) {
  const data = getDayData(dateKey);
  const habits = activeHabits();
  const completed = habits.filter(h => data.habits[h.id] === true).length;
  return { completed, total: habits.length, percent: habits.length ? Math.round(completed / habits.length * 100) : 0 };
}

function habitStats(habitId) {
  const dates = getChallengeDates();
  let completed = 0, current = 0, best = 0, run = 0;
  for (const key of dates) {
    const done = getDayData(key).habits[habitId] === true;
    if (done) { completed++; run++; best = Math.max(best, run); }
    else run = 0;
  }
  for (let i = dates.length - 1; i >= 0; i--) {
    if (getDayData(dates[i]).habits[habitId] === true) current++;
    else break;
  }
  return { completed, current, best };
}

function overallStreak() {
  const dates = getChallengeDates();
  let current = 0, best = 0, run = 0;
  for (const key of dates) {
    const c = habitCompletionForDate(key);
    const done = c.total > 0 && c.completed === c.total;
    if (done) { run++; best = Math.max(best, run); } else run = 0;
  }
  for (let i = dates.length - 1; i >= 0; i--) {
    const c = habitCompletionForDate(dates[i]);
    if (c.total > 0 && c.completed === c.total) current++;
    else break;
  }
  return { current, best };
}

function totalBookPages() {
  return getChallengeDates().reduce((sum,k) => sum + (Number(getDayData(k).bookPages) || 0), 0);
}

function totalSteps() {
  return getChallengeDates().reduce((sum,k) => sum + (Number(getDayData(k).steps) || 0), 0);
}

function stepsStats() {
  const dates = getChallengeDates();
  const entered = dates.filter(k => getDayData(k).steps !== null && getDayData(k).steps !== undefined && getDayData(k).steps !== "");
  const goal = Number(APP_STATE.settings.stepGoal) || 10000;
  const achieved = entered.filter(k => Number(getDayData(k).steps) >= goal);
  return { entered: entered.length, achieved: achieved.length, total: totalSteps(), average: entered.length ? Math.round(totalSteps()/entered.length) : 0 };
}

function habitIcon(habit) { return habit.icon || "✓"; }

function renderHabitList(container, dateKey) {
  const data = getDayData(dateKey);
  container.innerHTML = activeHabits().map(h => {
    const done = data.habits[h.id] === true;
    return `<div class="habit-row ${done ? "done" : ""}">
      <div class="habit-icon" aria-hidden="true">${habitIcon(h)}</div>
      <div><div class="habit-name">${escapeHtml(h.name)}</div><div class="habit-target">${escapeHtml(h.target || "Daily")}</div></div>
      <button class="check-button ${done ? "checked" : ""}" type="button" aria-label="${done ? "Mark incomplete" : "Mark complete"}: ${escapeHtml(h.name)}" data-habit-id="${h.id}">${done ? "✓" : ""}</button>
    </div>`;
  }).join("");
  container.querySelectorAll("[data-habit-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.habitId;
      const current = getDayData(dateKey).habits[id] === true;
      setHabitState(dateKey, id, !current);
      refreshCurrentPage();
    });
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}