// numpad.js

const ADMIN_USER = 'sarthi'
const ADMIN_PASS = 'admin123'

// ─── DUMMY MEMBER DATA (replace with API later) ───────────────
let members = [
  { id: 'M0001', name: 'Priya Nair',     phone: '9821001234', batch: 'fullday', plan: 90,  joined: daysAgo(20) },
  { id: 'M0002', name: 'Arjun Mehta',    phone: '9833445566', batch: 'night',   plan: 30,  joined: daysAgo(35) },
  { id: 'M0003', name: 'Sneha Kulkarni', phone: '9876543210', batch: 'halfday', plan: 180, joined: daysAgo(5)  },
  { id: 'M0004', name: 'Rohan Das',      phone: '9845001122', batch: 'fullday', plan: 30,  joined: daysAgo(29) },
  { id: 'M0005', name: 'Kavya Iyer',     phone: '9900112233', batch: '24hrs',   plan: 365, joined: daysAgo(100)},
]

let checkedIn = {}
let todayLog  = []
let typedCode = ''

// ─── HELPERS ─────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}
function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}
function isExpired(m) {
  return new Date() > addDays(m.joined, m.plan)
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function elapsed(since) {
  const ms = Date.now() - since
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? h + 'h ' + m + 'm' : m + 'm'
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── NUMPAD LOGIC ─────────────────────────────────────────────
function numPress(n) {
  if (typedCode.length >= 5) return
  typedCode += n
  updateCodeDisplay()
}

function numDel() {
  typedCode = typedCode.slice(0, -1)
  updateCodeDisplay()
  clearResult()
}

function updateCodeDisplay() {
  for (let i = 0; i < 5; i++) {
    const el = document.getElementById('d' + i)
    el.textContent  = typedCode[i] || '_'
    el.className    = 'code-digit' + (typedCode[i] ? ' filled' : '')
  }
}

function clearResult() {
  const el = document.getElementById('checkin-result')
  el.textContent = ''
  el.className   = ''
}

function showResult(msg, type) {
  const el = document.getElementById('checkin-result')
  el.textContent = msg
  el.className   = 'result-' + type
  if (type !== 'error') {
    setTimeout(clearResult, 4000)
  }
}

// ─── KEYBOARD SUPPORT ─────────────────────────────────────────
document.addEventListener('keydown', function(e) {
  // block keyboard if admin login is open
  if (!document.getElementById('admin-login-overlay').classList.contains('hidden')) return

  if (e.key >= '0' && e.key <= '9') { numPress(e.key); return }
  if (e.key === 'Backspace')         { numDel();        return }
  if (e.key === 'Enter')             { doCheckin();     return }
})

// ─── CHECKIN ──────────────────────────────────────────────────
function doCheckin() {
  const code = typedCode.trim()
  typedCode  = ''
  updateCodeDisplay()

  if (!code) {
    showResult('Please enter your member code', 'error')
    return
  }

  const m = members.find(mb =>
    mb.id === 'M' + code.padStart(4, '0') ||
    mb.id.slice(-code.length) === code
  )

  if (!m) {
    showResult('Code not found. Please check and try again.', 'error')
    return
  }

  if (isExpired(m)) {
    showResult(m.name.split(' ')[0] + ' — membership expired ' + fmtDate(addDays(m.joined, m.plan)) + '. Please renew at the desk.', 'warn')
    return
  }

  if (checkedIn[m.id]) {
    const dur = elapsed(checkedIn[m.id])
    todayLog.push({ member: m, timeIn: checkedIn[m.id], timeOut: Date.now(), duration: dur })
    delete checkedIn[m.id]
    showResult('Goodbye ' + m.name.split(' ')[0] + '! Stayed for ' + dur, 'ok')
  } else {
    checkedIn[m.id] = Date.now()
    showResult('Welcome ' + m.name.split(' ')[0] + '!', 'ok')
  }

  renderRecent()
}

// ─── RECENT ENTRIES ───────────────────────────────────────────
function renderRecent() {
  const all = [
    ...Object.keys(checkedIn).map(id => ({
      name: members.find(m => m.id === id).name,
      time: checkedIn[id],
      type: 'in'
    })),
    ...todayLog.map(l => ({
      name: l.member.name,
      time: l.timeOut,
      type: 'out'
    }))
  ].sort((a, b) => b.time - a.time).slice(0, 5)

  const el = document.getElementById('recent-list')
  if (!all.length) {
    el.innerHTML = '<div class="recent-empty">No entries yet today</div>'
    return
  }
  el.innerHTML = all.map(e =>
    '<div class="recent-row">' +
    '<span class="recent-name">' + e.name + '</span>' +
    '<span class="recent-badge ' + (e.type === 'in' ? 'badge-in' : 'badge-out') + '">' +
    (e.type === 'in' ? '↓ In' : '↑ Out') + ' ' + fmtTime(e.time) +
    '</span></div>'
  ).join('')
}

// ─── ADMIN LOGIN ──────────────────────────────────────────────
function openAdminLogin() {
  document.getElementById('admin-username').value    = ''
  document.getElementById('admin-password').value    = ''
  document.getElementById('admin-login-error').textContent = ''
  document.getElementById('admin-login-overlay').classList.remove('hidden')
  setTimeout(() => document.getElementById('admin-username').focus(), 100)
}

function closeAdminLogin() {
  document.getElementById('admin-login-overlay').classList.add('hidden')
}

function doAdminLogin() {
  const user = document.getElementById('admin-username').value.trim()
  const pass = document.getElementById('admin-password').value.trim()
  const err  = document.getElementById('admin-login-error')

  if (!user || !pass) {
    err.textContent = 'Please enter username and password'
    return
  }

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    localStorage.setItem('sarthi_logged_in', 'true')
    window.location.href = 'dashboard.html'
    closeAdminLogin()
  } else {
    err.textContent = 'Incorrect username or password'
    document.getElementById('admin-password').value = ''
  }
}

// enter key inside login form
document.getElementById('admin-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doAdminLogin()
})
document.getElementById('admin-username').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('admin-password').focus()
})

// ─── INIT ─────────────────────────────────────────────────────
renderRecent()
