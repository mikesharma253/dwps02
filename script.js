
'use strict';

const STORE = 'nyro-competition-v1';

const FACTORS = {
  carKgKm: 0.17,
  gridKgKwh: 0.7,
  flightTonnes: 0.25
};

const $ = id => document.getElementById(id);

const fresh = () => ({
  xp: 0,
  missions: [],
  scenarioSaved: false,
  water: [],
  quizDone: [],
  day: new Date().toLocaleDateString('en-CA')
});

let state = fresh();

try {
  const saved = JSON.parse(localStorage.getItem(STORE));
  if (saved && typeof saved === 'object') {
    state = { ...fresh(), ...saved };
  }
} catch (_) {
  // App remains usable if storage is blocked.
}

function persist() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch (_) {
    toast('Browser storage unavailable. Progress may not persist.');
  }
}

let toastTimer;

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    t.classList.remove('show');
  }, 2600);
}

// XP & LEVELS

function xp(n) {
  state.xp += n;
  persist();
  updateLevel();
}

function updateLevel() {
  const level = Math.floor(state.xp / 150) + 1;

  $('levelTag').textContent =
    'LV ' + String(level).padStart(2, '0');

  $('xpTag').textContent = state.xp + ' XP';
}

// CARBON SIMULATOR

function values() {
  return {
    travel: Number($('travel').value),
    power: Number($('power').value),
    flights: Number($('flights').value)
  };
}

function calc() {
  const v = values();

  // Illustrative annual estimate.
  const base = (
    v.travel * 52 * FACTORS.carKgKm +
    v.power * 12 * FACTORS.gridKgKwh
  ) / 1000 + v.flights * FACTORS.flightTonnes;

  let after = base;

  if ($('pledgeTransit').checked) {
    after -= (
      v.travel * 52 * FACTORS.carKgKm * 0.5
    ) / 1000;
  }

  if ($('pledgePower').checked) {
    after -= (
      v.power * 12 * FACTORS.gridKgKwh * 0.2
    ) / 1000;
  }

  if ($('pledgeFlight').checked && v.flights > 0) {
    after -= FACTORS.flightTonnes;
  }

  after = Math.max(0, after);

  $('travelVal').textContent = v.travel;
  $('powerVal').textContent = v.power;
  $('flightVal').textContent = v.flights;

  $('estimate').textContent = base.toFixed(2);
  $('baseline').textContent = base.toFixed(2) + ' t';
  $('after').textContent = after.toFixed(2) + ' t';

  $('saved').textContent = (base - after).toFixed(2) + ' t';

  $('saveMeter').style.width =
    (base ? Math.min(100, (base - after) / base * 100) : 0) + '%';

  $('carbonTotal').textContent = after.toFixed(1);

  $('carbonMeter').style.width =
    Math.min(100, after / 10 * 100) + '%';

  updatePulse();
}

[
  'travel',
  'power',
  'flights',
  'pledgeTransit',
  'pledgePower',
  'pledgeFlight'
].forEach(id => {
  $(id).addEventListener('input', calc);
});

$('resetSim').addEventListener('click', () => {
  $('travel').value = 50;
  $('power').value = 150;
  $('flights').value = 2;

  [
    'pledgeTransit',
    'pledgePower',
    'pledgeFlight'
  ].forEach(id => {
    $(id).checked = false;
  });

  calc();
  toast('Simulator reset.');
});

// PLANET PULSE

function updatePulse() {
  const carbon = Number($('carbonTotal').textContent) || 0;

  const water = state.water.reduce(
    (s, e) => s + e.litres, 0
  );

  const missions = state.missions.length;

  const factors = [
    Math.max(0, 100 - carbon / 10 * 100),
    Math.max(0, 100 - water / 135 * 50),
    Math.min(100, missions * 20)
  ];

  const score = Math.round(
    factors.reduce((a, b) => a + b, 0) / factors.length
  );

  $('pulseScore').textContent = score;
  $('pulseMeter').style.width = score + '%';

  $('pulseCaption').textContent =
    'Illustrative profile indicator · not an official sustainability rating.';

  $('waterTotal').textContent = water.toLocaleString();
  $('waterBig').textContent = water.toLocaleString();

  const pct = Math.round(water / 135 * 100);

  $('waterPct').textContent = pct + '%';
  $('waterMeter').style.width = Math.min(100, pct) + '%';
  $('waterBar').style.width = Math.min(100, pct) + '%';

  $('waterRing').style.strokeDashoffset =
    320.44 * (1 - Math.min(100, pct) / 100);

  $('waterCaption').textContent =
    water > 135
      ? 'Above your 135 L reference goal.'
      : `${135 - water} L below the reference goal.`;

  $('actionTotal').textContent = missions;

  $('actionMeter').style.width =
    Math.min(100, missions / 5 * 100) + '%';

  $('streakCopy').textContent = missions
    ? 'Every action is a self-reported entry.'
    : 'Build a streak one day at a time.';
}

// WATER TRACKER

function renderWater() {
  const host = $('waterEntries');

  host.replaceChildren();

  if (!state.water.length) {
    const p = document.createElement('p');

    p.className = 'empty';
    p.textContent = 'Nothing logged yet. Start with one entry.';

    host.append(p);
  } else {
    state.water.slice().reverse().forEach(entry => {
      const row = document.createElement('div');
      row.className = 'entry';

      const label = document.createElement('b');
      label.textContent = entry.activity;

      const amount = document.createElement('span');
      amount.textContent = entry.litres + ' L';

      row.append(label, amount);
      host.append(row);
    });
  }

  updatePulse();
}

$('waterForm').addEventListener('submit', e => {
  e.preventDefault();

  const litres = Number($('litres').value);

  if (!Number.isFinite(litres) || litres < 1 || litres > 10000) {
    toast('Enter a value between 1 and 10,000 litres.');
    return;
  }

  state.water.push({
    activity: $('waterActivity').value,
    litres,
    at: new Date().toISOString()
  });

  $('litres').value = '';

  xp(3);
  renderWater();

  toast('Water entry logged · +3 XP');
});

$('clearWater').addEventListener('click', () => {
  if (!state.water.length) return;

  state.water = [];

  persist();
  renderWater();

  toast('Water entries cleared.');
});

// MISSIONS

document.querySelectorAll('[data-mission]').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.mission;

    if (state.missions.includes(id)) {
      toast('This mission is already logged.');
      return;
    }

    state.missions.push(id);

    xp(20);

    btn.textContent = 'Completed ✓';
    btn.disabled = true;

    btn.closest('.mission').classList.add('completed');

    updatePulse();

    toast('Mission logged · +20 XP');
  });
});

// LEARN LOOP

const questions = [
  {
    q: 'Which action usually reduces transport emissions for a short city trip?',
    opts: [
      'Ride alone in a car',
      'Walk or cycle, when safe and practical',
      'Take a longer route'
    ],
    answer: 1,
    why: 'Active travel can reduce trip emissions when it is a safe and practical option.'
  },
  {
    q: 'What does a carbon footprint estimate?',
    opts: [
      'Only smoke from factories',
      'Greenhouse gas emissions linked to an activity or person',
      'The amount of rubbish in a bin'
    ],
    answer: 1,
    why: 'A carbon footprint estimates greenhouse gases linked to a person, product or activity.'
  },
  {
    q: 'Which is a sensible first response to a leaking tap?',
    opts: [
      'Ignore it',
      'Check and report or fix it safely',
      'Run more water'
    ],
    answer: 1,
    why: 'A leak check can help prevent avoidable water loss. Ask an adult or responsible person for repairs.'
  },
  {
    q: 'What makes a sustainability claim stronger?',
    opts: [
      'A flashy chart',
      'Clear methods, assumptions and evidence',
      'A bigger XP score'
    ],
    answer: 1,
    why: 'Transparent methods and credible evidence make claims easier to evaluate.'
  }
];

let qIndex = 0;

function showQuestion() {
  const q = questions[qIndex];

  $('quizCount').textContent =
    `QUESTION ${String(qIndex + 1).padStart(2, '0')} / ${questions.length}`;

  $('quizQuestion').textContent = q.q;

  $('quizOptions').replaceChildren();

  $('quizFeedback').textContent = '';

  $('nextQuestion').disabled = true;

  $('nextQuestion').textContent =
    qIndex === questions.length - 1
      ? 'Review complete ✓'
      : 'Next question →';

  q.opts.forEach((option, i) => {
    const b = document.createElement('button');

    b.className = 'quiz-option';
    b.textContent = String.fromCharCode(65 + i) + '. ' + option;

    b.addEventListener('click', () => answer(i, b));

    $('quizOptions').append(b);
  });
}

function answer(index, button) {
  const q = questions[qIndex];

  document.querySelectorAll('.quiz-option').forEach(b => {
    b.disabled = true;
  });

  const correct = index === q.answer;

  button.classList.add(correct ? 'correct' : 'wrong');

  if (!correct) {
    $('quizOptions').children[q.answer].classList.add('correct');
  }

  $('quizFeedback').textContent =
    (correct ? 'Correct! ' : 'Not quite. ') + q.why;

  if (correct && !state.quizDone.includes(qIndex)) {
    state.quizDone.push(qIndex);

    xp(5);

    toast('Correct answer · +5 XP');
  } else {
    persist();
  }

  $('nextQuestion').disabled = false;
}

$('nextQuestion').addEventListener('click', () => {
  if (qIndex < questions.length - 1) {
    qIndex++;
    showQuestion();
  } else {
    qIndex = 0;
    showQuestion();

    toast('Knowledge check restarted.');
  }
});

// SAVE SCENARIO

$('saveScenario').addEventListener('click', () => {
  if (state.scenarioSaved) {
    toast('Scenario already saved in this profile.');
    return;
  }

  state.scenarioSaved = true;

  xp(10);

  $('saveScenario').disabled = true;
  $('saveScenario').textContent = 'Scenario saved ✓';

  $('scenarioNote').textContent =
    'Scenario saved locally. XP rewards trying the tool, not claiming impact.';

  toast('Scenario saved · +10 XP');
});

// DEMO DATA

$('demoBtn').addEventListener('click', () => {
  if (state.water.length || state.missions.length || state.xp) {
    toast('Demo skipped to protect your current progress.');
    return;
  }

  state.water = [
    { activity: 'Shower / bath', litres: 38 },
    { activity: 'Cooking / drinking', litres: 5 },
    { activity: 'Dishwashing', litres: 12 }
  ];

  state.missions = ['mobility'];

  $('travel').value = 35;
  $('power').value = 120;
  $('flights').value = 1;

  $('pledgeTransit').checked = true;

  xp(0);

  persist();
  renderWater();

  const mobility = document.querySelector(
    '[data-mission="mobility"]'
  );

  if (mobility) {
    mobility.disabled = true;
    mobility.textContent = 'Completed ✓';

    mobility.closest('.mission').classList.add('completed');
  }

  calc();

  toast('Demo profile loaded. Example data, not real impact.');
});

// EXPORT REPORT

$('exportBtn').addEventListener('click', () => {
  const summary = {
    product: 'NYRO',
    exportedAt: new Date().toISOString(),
    xp: state.xp,
    missions: state.missions,
    waterEntries: state.water,
    simulator: {
      ...values(),
      estimatedAnnualTonnes:
        Number($('carbonTotal').textContent)
    },
    note:
      'Self-reported and illustrative estimates. Not verified environmental impact.'
  };

  const blob = new Blob(
    [JSON.stringify(summary, null, 2)],
    { type: 'application/json' }
  );

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = 'nyro-progress-report.json';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  toast('Progress report exported.');
});

// INITIALIZE

updateLevel();
renderWater();
calc();
showQuestion();

state.missions.forEach(id => {
  const b = document.querySelector(`[data-mission="${id}"]`);

  if (b) {
    b.disabled = true;
    b.textContent = 'Completed ✓';
    b.closest('.mission').classList.add('completed');
  }
});

if (state.scenarioSaved) {
  $('saveScenario').disabled = true;
  $('saveScenario').textContent = 'Scenario saved ✓';
}
