
const API = 'http://localhost:5000/api';

let token = '';
let currentUser = null;
let historyPage = 1;
let historyTotal = 0;
let quizQuestions = [];
let riskChart = null;
let dailyChart = null;

const $ = (id) => document.getElementById(id);

/* -------------------- API REQUEST HELPER -------------------- */

async function request(path, options = {}) {
  let response;

  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(
      'Cannot connect to the backend. Check that npm start is running on port 5000 and that CORS is configured.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && token) {
      logout(false);
    }

    throw new Error(data.error || data.message || `Request failed (${response.status}).`);
  }

  return data;
}

/* -------------------- GENERAL HELPERS -------------------- */

function message(id, text, error = false) {
  const element = $(id);

  if (!element) return;

  element.textContent = text;
  element.style.color = error ? '#b91c1c' : '#147d59';
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value ?? '';
  row.appendChild(cell);
  return cell;
}

function normalizeRisk(risk) {
  const value = String(risk || 'Unknown').trim();

  if (/^low(?: risk)?$/i.test(value)) return 'Low Risk';
  if (/^medium(?: risk)?$/i.test(value)) return 'Medium Risk';
  if (/^high(?: risk)?$/i.test(value)) return 'High Risk';

  return value;
}

function addBadge(cell, risk) {
  const badge = document.createElement('span');
  const normalized = normalizeRisk(risk);

  badge.className = 'badge ' + normalized.split(' ')[0];
  badge.textContent = normalized;
  cell.appendChild(badge);
}

function formatDate(value) {
  if (!value) return 'Unknown';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : date.toLocaleString();
}

function getField(object, camelName, snakeName) {
  return object?.[camelName] ?? object?.[snakeName];
}

function normalizeScan(scan) {
  let reasons = getField(scan, 'reasons', 'reasons');

  if (typeof reasons === 'string') {
    try {
      reasons = JSON.parse(reasons);
    } catch {
      reasons = [reasons];
    }
  }

  if (!Array.isArray(reasons)) {
    reasons = [];
  }

  return {
    id: scan.id,
    url: scan.url || '',
    score: Number(scan.score ?? 0),
    riskLevel: normalizeRisk(
      getField(scan, 'riskLevel', 'risk_level')
    ),
    reasons,
    createdAt: getField(scan, 'createdAt', 'created_at'),
    username: scan.username || ''
  };
}

function clearTable(id, columns, text) {
  const body = $(id);

  if (!body) return;

  body.replaceChildren();

  const row = document.createElement('tr');
  const cell = document.createElement('td');

  cell.colSpan = columns;
  cell.textContent = text;

  row.appendChild(cell);
  body.appendChild(row);
}

function showApp() {
  $('authSection').classList.add('hidden');
  $('appSection').classList.remove('hidden');
  $('userActions').classList.remove('hidden');
}

function showLogin() {
  $('authSection').classList.remove('hidden');
  $('appSection').classList.add('hidden');
  $('userActions').classList.add('hidden');
}

/* -------------------- NAVIGATION -------------------- */

function navigate(view) {
  document.querySelectorAll('.view').forEach((section) => {
    section.classList.toggle(
      'hidden',
      section.id !== `${view}View`
    );
  });

  document.querySelectorAll('.nav-btn').forEach((button) => {
    button.classList.toggle(
      'active',
      button.dataset.view === view
    );
  });

  if (view === 'dashboard') loadDashboard();
  if (view === 'history') loadHistory();
  if (view === 'quiz') loadQuiz();
  if (view === 'admin') loadAdmin();
}

/* -------------------- SIGN UP -------------------- */

async function signup() {
  const username = $('username').value.trim();
  const password = $('password').value;

  if (!username || !password) {
    message('authMessage', 'Enter username and password.', true);
    return;
  }

  try {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    message(
      'authMessage',
      data.message || 'Account created successfully. Please log in.'
    );
  } catch (error) {
    message('authMessage', error.message, true);
  }
}

/* -------------------- LOGIN -------------------- */

async function login() {
  const username = $('username').value.trim();
  const password = $('password').value;

  if (!username || !password) {
    message('authMessage', 'Enter username and password.', true);
    return;
  }

  const loginButton = $('loginBtn');
  loginButton.disabled = true;

  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    if (!data.token) {
      throw new Error('The server did not return a login token.');
    }

    token = data.token;
    currentUser = {
      id: data.id,
      username: data.username || username,
      role: data.role || 'user'
    };

    showApp();

    $('welcomeUser').textContent = currentUser.username;
    $('dashboardName').textContent = currentUser.username;

    $('adminNav').classList.toggle(
      'hidden',
      currentUser.role !== 'admin'
    );

    message('appMessage', 'Login successful.');

    navigate('dashboard');
  } catch (error) {
    message('authMessage', error.message, true);
  } finally {
    loginButton.disabled = false;
  }
}

/* -------------------- LOGOUT -------------------- */

function logout(showMessage = true) {
  token = '';
  currentUser = null;
  historyPage = 1;
  historyTotal = 0;

  showLogin();

  $('password').value = '';

  if (riskChart) riskChart.destroy();
  if (dailyChart) dailyChart.destroy();

  riskChart = null;
  dailyChart = null;

  if (showMessage) {
    message('authMessage', 'You have logged out.');
  }
}

/* -------------------- RECENT SCANS -------------------- */

function renderRecent(scans) {
  const body = $('recentBody');

  body.replaceChildren();

  if (!Array.isArray(scans) || scans.length === 0) {
    clearTable('recentBody', 4, 'No scans yet. Try scanning a URL.');
    return;
  }

  scans.forEach((item) => {
    const scan = normalizeScan(item);
    const row = document.createElement('tr');

    addCell(row, scan.url);
    addCell(row, `${scan.score}/100`);
    addBadge(addCell(row, ''), scan.riskLevel);
    addCell(row, formatDate(scan.createdAt));

    body.appendChild(row);
  });
}

/* -------------------- DASHBOARD CHARTS -------------------- */

function renderCharts(data) {
  if (typeof Chart === 'undefined') {
    message(
      'appMessage',
      'Charts are unavailable. Check your internet connection.',
      true
    );
    return;
  }

  if (riskChart) riskChart.destroy();
  if (dailyChart) dailyChart.destroy();

  const stats = data.stats || {};

  riskChart = new Chart($('riskChart'), {
    type: 'doughnut',
    data: {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [{
        data: [
          Number(stats.lowRisk ?? stats.low_risk ?? 0),
          Number(stats.mediumRisk ?? stats.medium_risk ?? 0),
          Number(stats.highRisk ?? stats.high_risk ?? 0)
        ],
        backgroundColor: ['#16a34a', '#f59e0b', '#dc2626']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });

  const dailyData = Array.isArray(data.daily) ? data.daily : [];

  const dailyMap = new Map(
    dailyData.map((item) => [
      String(item.day || item.date || '').slice(0, 10),
      Number(item.total ?? item.count ?? 0)
    ])
  );

  const labels = [];
  const values = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');

    labels.push(
      date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    );

    values.push(dailyMap.get(key) || 0);
  }

  dailyChart = new Chart($('dailyChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Scans',
        data: values,
        backgroundColor: '#16815c'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }
  });
}

/* -------------------- LOAD DASHBOARD -------------------- */

async function loadDashboard() {
  try {
    const data = await request('/dashboard');
    const stats = data.stats || {};
    const quiz = data.quiz || {};

    $('dashboardName').textContent =
      data.username || currentUser?.username || '';

    $('totalScans').textContent =
      stats.totalScans ?? stats.total_scans ?? 0;

    $('highRisk').textContent =
      stats.highRisk ?? stats.high_risk ?? 0;

    $('mediumRisk').textContent =
      stats.mediumRisk ?? stats.medium_risk ?? 0;

    $('lowRisk').textContent =
      stats.lowRisk ?? stats.low_risk ?? 0;

    $('quizAttempts').textContent =
      quiz.attempts ?? 0;

    $('quizBest').textContent =
      `${quiz.bestScore ?? quiz.best_score ?? 0} / ${
        quiz.questionCount ?? quiz.question_count ?? 5
      }`;

    renderRecent(data.recentScans || data.recent_scans || []);
    renderCharts(data);
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- URL SCANNER -------------------- */

async function scanUrl(event) {
  event.preventDefault();

  const url = $('urlInput').value.trim();

  if (!url) {
    message('appMessage', 'Enter a URL to scan.', true);
    return;
  }

  try {
    const parsed = new URL(url);

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      throw new Error(
        'Enter an HTTP or HTTPS URL without embedded credentials.'
      );
    }
  } catch (error) {
    message(
      'appMessage',
      error.message === 'Invalid URL'
        ? 'Enter a complete URL, such as https://example.com.'
        : error.message,
      true
    );
    return;
  }

  const scanButton = $('scanBtn');
  scanButton.disabled = true;

  try {
    const response = await request('/scans', {
      method: 'POST',
      body: JSON.stringify({ url })
    });

    // Support either a flattened result or { analysis: {...} }.
    const analysis = response.analysis || response;
    const riskLevel = normalizeRisk(
      analysis.riskLevel ??
      analysis.risk_level ??
      response.riskLevel ??
      response.risk_level
    );

    const score = Number(
      analysis.score ?? response.score ?? 0
    );

    const reasons = Array.isArray(analysis.reasons)
      ? analysis.reasons
      : Array.isArray(response.reasons)
        ? response.reasons
        : [];

    const threatIntel = response.threatIntel ||
      response.threat_intel || {
        message: 'External threat intelligence was not checked.'
      };

    $('scanResult').classList.remove('hidden');

    $('scanRisk').textContent = riskLevel;
    $('scanRisk').className =
      'badge ' + riskLevel.split(' ')[0];

    $('scanScore').textContent = score;
    $('intelStatus').textContent =
      threatIntel.message || 'Threat intelligence status unavailable.';

    const list = $('scanReasons');
    list.replaceChildren();

    if (reasons.length === 0) {
      const item = document.createElement('li');
      item.textContent = 'No additional reasons were returned.';
      list.appendChild(item);
    } else {
      reasons.forEach((reason) => {
        const item = document.createElement('li');

        item.textContent = typeof reason === 'string'
          ? reason
          : JSON.stringify(reason);

        list.appendChild(item);
      });
    }

    message('appMessage', 'Scan completed and saved to your history.');

    await loadDashboard();
  } catch (error) {
    message('appMessage', error.message, true);
  } finally {
    scanButton.disabled = false;
  }
}

/* -------------------- SCAN HISTORY -------------------- */

async function loadHistory() {
  const search = $('historySearch').value.trim();
  const risk = $('historyRisk').value;

  const params = new URLSearchParams({
    page: String(historyPage),
    limit: '20',
    search,
    risk
  });

  try {
    const data = await request('/scans/history?' + params);

    const history = Array.isArray(data.history)
      ? data.history
      : [];

    historyTotal = Number(data.total ?? 0);

    $('historyCount').textContent =
      `${historyTotal} scan records`;

    $('pageInfo').textContent = `Page ${historyPage}`;

    $('prevPage').disabled = historyPage <= 1;
    $('nextPage').disabled = historyPage * 20 >= historyTotal;

    const body = $('historyBody');
    body.replaceChildren();

    if (history.length === 0) {
      clearTable('historyBody', 6, 'No matching scan records.');
      return;
    }

    history.forEach((item) => {
      const scan = normalizeScan(item);
      const row = document.createElement('tr');

      addCell(row, scan.url);
      addCell(row, `${scan.score}/100`);
      addBadge(addCell(row, ''), scan.riskLevel);

      addCell(
        row,
        scan.reasons.map((reason) =>
          typeof reason === 'string'
            ? reason
            : JSON.stringify(reason)
        ).join(' ')
      );

      addCell(row, formatDate(scan.createdAt));

      const actionCell = addCell(row, '');
      const deleteButton = document.createElement('button');

      deleteButton.textContent = 'Delete';
      deleteButton.className = 'outline';
      deleteButton.addEventListener('click', () => deleteScan(scan.id));

      actionCell.appendChild(deleteButton);
      body.appendChild(row);
    });
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- DELETE SCAN -------------------- */

async function deleteScan(id) {
  if (!confirm('Delete this scan from your history?')) return;

  try {
    await request('/scans/' + encodeURIComponent(id), {
      method: 'DELETE'
    });

    historyPage = 1;

    await loadHistory();
    await loadDashboard();

    message('appMessage', 'Scan deleted successfully.');
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- EXPORT CSV -------------------- */

function exportCsv() {
  const rows = [
    ...$('historyBody').querySelectorAll('tr')
  ];

  if (
    rows.length === 0 ||
    rows[0].querySelectorAll('td').length !== 6
  ) {
    message(
      'appMessage',
      'There are no history records on this page to export.',
      true
    );
    return;
  }

  const csvCell = (value) =>
    '"' + String(value).replace(/"/g, '""') + '"';

  const output = [
    ['URL', 'Score', 'Risk', 'Reasons', 'Date'],
    ...rows.map((row) => {
      const cells = [...row.querySelectorAll('td')];

      return cells
        .slice(0, 5)
        .map((cell) => cell.innerText.trim());
    })
  ]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + output], {
    type: 'text/csv;charset=utf-8;'
  });

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = `safelinker-history-page-${historyPage}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(objectUrl);
}

/* -------------------- AWARENESS QUIZ -------------------- */

async function loadQuiz() {
  try {
    const data = await request('/quiz');

    quizQuestions = Array.isArray(data)
      ? data
      : data.questions || [];

    const container = $('quizQuestions');
    container.replaceChildren();

    quizQuestions.forEach((question) => {
      const section = document.createElement('section');
      section.className = 'question';

      const heading = document.createElement('h3');
      heading.textContent = question.question;

      section.appendChild(heading);

      question.options.forEach((option, index) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');

        radio.type = 'radio';
        radio.name = 'q' + question.id;
        radio.value = index;
        radio.required = true;

        label.append(radio, document.createTextNode(' ' + option));
        section.appendChild(label);
      });

      container.appendChild(section);
    });

    $('quizResult').classList.add('hidden');
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

async function submitQuiz(event) {
  event.preventDefault();

  const answers = quizQuestions.map((question) => {
    const selected = document.querySelector(
      `input[name="q${question.id}"]:checked`
    );

    return selected ? Number(selected.value) : -1;
  });

  if (answers.some((answer) => answer < 0)) {
    message('appMessage', 'Answer every question first.', true);
    return;
  }

  try {
    const result = await request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ answers })
    });

    const box = $('quizResult');
    box.classList.remove('hidden');
    box.replaceChildren();

    const heading = document.createElement('h2');

    heading.textContent =
      `Your score: ${result.score}/${result.totalQuestions}`;

    box.appendChild(heading);

    (result.results || []).forEach((item, index) => {
      const paragraph = document.createElement('p');

      paragraph.textContent =
        `Question ${index + 1}: ` +
        `${item.correct ? 'Correct. ' : 'Incorrect. '}` +
        (item.explanation || '');

      box.appendChild(paragraph);
    });

    message('appMessage', 'Quiz submitted successfully.');

    await loadDashboard();
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- ADMIN DASHBOARD -------------------- */

async function loadAdmin() {
  if (currentUser?.role !== 'admin') {
    message('appMessage', 'Administrator access required.', true);
    return;
  }

  try {
    const data = await request('/admin/stats');

    $('adminUsers').textContent =
      data.totalUsers ?? data.total_users ?? 0;

    $('adminScans').textContent =
      data.totalScans ?? data.total_scans ?? 0;

    $('adminHigh').textContent =
      data.highRisk ?? data.high_risk ?? 0;

    const body = $('adminScansBody');
    body.replaceChildren();

    const recent = data.recent || [];

    if (recent.length === 0) {
      clearTable('adminScansBody', 4, 'No scan records available.');
      return;
    }

    recent.forEach((item) => {
      const scan = normalizeScan(item);
      const row = document.createElement('tr');

      addCell(row, item.username || '');
      addCell(row, scan.url);
      addBadge(addCell(row, ''), scan.riskLevel);
      addCell(row, `${scan.score}/100`);

      body.appendChild(row);
    });
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- ADMIN USERS -------------------- */

async function loadAdminUsers() {
  if (currentUser?.role !== 'admin') {
    message('appMessage', 'Administrator access required.', true);
    return;
  }

  try {
    const data = await request('/admin/users');
    const body = $('adminUsersBody');

    body.replaceChildren();

    const users = data.users || [];

    if (users.length === 0) {
      clearTable('adminUsersBody', 4, 'No users found.');
      return;
    }

    users.forEach((user) => {
      const row = document.createElement('tr');

      addCell(row, user.username);
      addCell(row, user.role);
      addCell(row, user.totalScans ?? user.total_scans ?? 0);
      addCell(
        row,
        formatDate(user.createdAt ?? user.created_at)
      );

      body.appendChild(row);
    });
  } catch (error) {
    message('appMessage', error.message, true);
  }
}

/* -------------------- EVENT LISTENERS -------------------- */

$('signupBtn').addEventListener('click', signup);
$('loginBtn').addEventListener('click', login);
$('logoutBtn').addEventListener('click', () => logout());

$('scanForm').addEventListener('submit', scanUrl);

$('historyForm').addEventListener('submit', (event) => {
  event.preventDefault();
  historyPage = 1;
  loadHistory();
});

$('prevPage').addEventListener('click', () => {
  if (historyPage > 1) {
    historyPage--;
    loadHistory();
  }
});

$('nextPage').addEventListener('click', () => {
  if (historyPage * 20 < historyTotal) {
    historyPage++;
    loadHistory();
  }
});

$('exportBtn').addEventListener('click', exportCsv);
$('quizForm').addEventListener('submit', submitQuiz);
$('loadUsersBtn').addEventListener('click', loadAdminUsers);

document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    navigate(button.dataset.view);
  });
});

document.querySelectorAll('[data-go]').forEach((button) => {
  button.addEventListener('click', () => {
    navigate(button.dataset.go);
  });
});
