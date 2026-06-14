// dashboard.js

// ─── AUTH CHECK ───────────────────────────────
if (localStorage.getItem('sarthi_logged_in') !== 'true') {
  window.location.href = 'login.html'
}

document.getElementById('logout-btn').addEventListener('click', function() {
  localStorage.removeItem('sarthi_logged_in')
  window.location.href = 'login.html'
})

// ─── CLOCK ───────────────────────────────────
function updateClock() {
  const el = document.getElementById('topbar-date')
  if (el) el.textContent = new Date().toLocaleString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit'
  })
}
updateClock()
setInterval(updateClock, 60000)

// ─── DUMMY DATA (replace with API calls later) 
let members = [
  { id: 'M0001', name: 'Priya Nair',       phone: '9821001234', batch: 'fullday',  plan: 90,  joined: daysAgo(20), locker: true,  seat: false },
  { id: 'M0002', name: 'Arjun Mehta',      phone: '9833445566', batch: 'night',    plan: 30,  joined: daysAgo(35), locker: false, seat: false },
  { id: 'M0003', name: 'Sneha Kulkarni',   phone: '9876543210', batch: 'halfday',  plan: 180, joined: daysAgo(5),  locker: false, seat: true  },
  { id: 'M0004', name: 'Rohan Das',        phone: '9845001122', batch: 'fullday',  plan: 30,  joined: daysAgo(29), locker: false, seat: false },
  { id: 'M0005', name: 'Kavya Iyer',       phone: '9900112233', batch: '24hrs',    plan: 365, joined: daysAgo(100),locker: true,  seat: true  },
]

let checkedIn = {}   // { memberId: timestamp }
let todayLog  = []   // { member, timeIn, timeOut, duration }
let currentDetailId = null

// ─── HELPERS ─────────────────────────────────
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
function daysLeft(m) {
  return Math.ceil((addDays(m.joined, m.plan) - new Date()) / 86400000)
}
function fmtTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
function elapsed(since) {
  const ms = Date.now() - since
  const h  = Math.floor(ms / 3600000)
  const m  = Math.floor((ms % 3600000) / 60000)
  return { h, m, str: h > 0 ? h + 'h ' + m + 'm' : m + 'm' }
}
function initials(name) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}
function avatarClass(id) {
  const colors = ['av-0','av-1','av-2','av-3','av-4']
  const index  = parseInt(id.replace('M','')) % colors.length
  return colors[index]
}
function batchLabel(batch) {
  const labels = { night: 'Night (10pm–8am)', halfday: 'Half Day (6am–3pm / 3pm–11pm)', fullday: 'Full Day (6am–11pm)', '24hrs': '24 Hours' }
  return labels[batch] || batch
}
function nextMemberId() {
  const nums = members.map(m => parseInt(m.id.replace('M','')))
  return 'M' + String(Math.max(...nums) + 1).padStart(4,'0')
}

// ─── VIEW SWITCHING ───────────────────────────
function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'))
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'))
  document.getElementById('view-' + view).classList.add('active')
  document.getElementById('btn-' + view).classList.add('active')
}

// ─── STATS ────────────────────────────────────
function updateStats() {
  const inside   = Object.keys(checkedIn).length
  const visited  = todayLog.length + inside
  const total    = members.length
  const expiring = members.filter(m => !isExpired(m) && daysLeft(m) <= 7).length

  document.getElementById('stat-inside').textContent   = inside
  document.getElementById('stat-visited').textContent  = visited
  document.getElementById('stat-total').textContent    = total
  document.getElementById('stat-expiring').textContent = expiring
}

// ─── ALERTS ───────────────────────────────────
function updateAlerts() {
  let html = ''
  members.forEach(m => {
    if (checkedIn[m.id] && isExpired(m)) {
      html += '<div class="alert-expired">⚠ ' + m.name + ' is inside but their membership expired on ' + fmtDate(addDays(m.joined, m.plan)) + '</div>'
    }
  })
  members.filter(m => !isExpired(m) && daysLeft(m) <= 7).forEach(m => {
    html += '<div class="alert-overtime">🔔 ' + m.name + '\'s membership expires in ' + daysLeft(m) + ' day(s) — ' + fmtDate(addDays(m.joined, m.plan)) + '</div>'
  })
  document.getElementById('alerts-section').innerHTML = html
}

// ─── DAILY LOG ────────────────────────────────
function renderLog() {
  const insideEl = document.getElementById('currently-inside-list')
  const leftEl   = document.getElementById('left-today-list')

  const insideMembers = members.filter(m => checkedIn[m.id])
    .sort((a,b) => checkedIn[a.id] - checkedIn[b.id])

  if (!insideMembers.length) {
    insideEl.innerHTML = '<div class="empty-state">No one is inside right now</div>'
  } else {
    insideEl.innerHTML = insideMembers.map(m => {
      const e     = elapsed(checkedIn[m.id])
      const cls   = e.h >= 8 ? 'elapsed-over' : e.h >= 6 ? 'elapsed-warn' : 'elapsed-ok'
      return '<div class="log-row">' +
        '<div class="log-avatar ' + avatarClass(m.id) + '">' + initials(m.name) + '</div>' +
        '<div><div class="log-name">' + m.name + '</div><div class="log-batch">' + batchLabel(m.batch) + ' · ' + m.id + '</div></div>' +
        '<div class="log-time">' + fmtTime(checkedIn[m.id]) + '</div>' +
        '<div class="log-elapsed ' + cls + '">' + e.str + '</div>' +
        '</div>'
    }).join('')
  }

  const leftEntries = todayLog.sort((a,b) => a.timeIn - b.timeIn)
  if (!leftEntries.length) {
    leftEl.innerHTML = '<div class="empty-state">No one has left yet</div>'
  } else {
    leftEl.innerHTML = leftEntries.map(entry => {
      return '<div class="log-row">' +
        '<div class="log-avatar ' + avatarClass(entry.member.id) + '">' + initials(entry.member.name) + '</div>' +
        '<div><div class="log-name">' + entry.member.name + '</div><div class="log-batch">' + batchLabel(entry.member.batch) + '</div></div>' +
        '<div class="log-time">' + fmtTime(entry.timeIn) + ' → ' + fmtTime(entry.timeOut) + '</div>' +
        '<div class="log-duration">' + entry.duration + '</div>' +
        '</div>'
    }).join('')
  }
}

// ─── MEMBERS LIST ─────────────────────────────
function renderMembers(filter) {
  const list = filter
    ? members.filter(m => m.name.toLowerCase().includes(filter.toLowerCase()) || m.id.includes(filter))
    : members

  const el = document.getElementById('members-list')
  if (!list.length) {
    el.innerHTML = '<div class="empty-state">No members found</div>'
    return
  }
  el.innerHTML = list.map(m => {
    const exp  = isExpired(m)
    const dl   = daysLeft(m)
    const badge = exp
      ? '<span class="badge badge-expired">Expired</span>'
      : dl <= 7
        ? '<span class="badge badge-expiring">' + dl + 'd left</span>'
        : '<span class="badge badge-active">Active</span>'
    return '<div class="member-row" onclick="openMemberDetail(\'' + m.id + '\')">' +
      '<div class="log-avatar ' + avatarClass(m.id) + '" style="width:40px;height:40px;font-size:13px;">' + initials(m.name) + '</div>' +
      '<div><div class="member-name">' + m.name + '</div><div class="member-meta">' + m.id + ' · ' + batchLabel(m.batch) + ' · ' + m.phone + '</div></div>' +
      badge +
      '</div>'
  }).join('')
}

function searchMembers() {
  const val = document.getElementById('member-search').value
  renderMembers(val)
}

// ─── MEMBER DETAIL ────────────────────────────
function openMemberDetail(id) {
  currentDetailId = id
  const m = members.find(x => x.id === id)
  if (!m) return

  document.getElementById('members-list').classList.add('hidden')
  document.getElementById('members-toolbar').classList.add('hidden')
  document.getElementById('member-detail').classList.remove('hidden')

  document.getElementById('detail-avatar').textContent = initials(m.name)
  document.getElementById('detail-avatar').className   = 'log-avatar ' + avatarClass(m.id)
  document.getElementById('detail-name').textContent   = m.name
  document.getElementById('detail-id').textContent     = m.id
  document.getElementById('detail-phone').textContent  = m.phone

  const exp = isExpired(m)
  const dl  = daysLeft(m)
  document.getElementById('detail-plan-info').innerHTML =
    '<b>Batch:</b> ' + batchLabel(m.batch) + '<br>' +
    '<b>Plan:</b> ' + (m.planLabel || m.plan + ' days') + '<br>' +
    '<b>Started:</b> ' + fmtDate(m.joined) + '<br>' +
    '<b>Expires:</b> ' + fmtDate(addDays(m.joined, m.plan)) + ' · ' + (exp ? '<span style="color:#c0392b">Expired</span>' : dl + ' days left') + '<br>' +
    '<b>Locker:</b> ' + (m.locker ? 'Yes' : 'No') + ' · <b>Reserved seat:</b> ' + (m.seat ? 'Yes' : 'No')

  document.getElementById('detail-history-list').innerHTML =
    '<div class="history-item"><span>Today</span><span>' + (checkedIn[m.id] ? 'Checked in at ' + fmtTime(checkedIn[m.id]) : 'Not visited today') + '</span></div>'
}

function closeMemberDetail() {
  currentDetailId = null
  document.getElementById('member-detail').classList.add('hidden')
  document.getElementById('members-list').classList.remove('hidden')
  document.getElementById('members-toolbar').classList.remove('hidden')
}

// ─── MEMBER FORM ──────────────────────────────
function openMemberForm(id) {
  document.getElementById('member-detail').classList.add('hidden')
  document.getElementById('members-list').classList.add('hidden')
  document.getElementById('members-toolbar').classList.add('hidden')
  document.getElementById('member-form').classList.remove('hidden')
  document.getElementById('form-result').textContent = ''

  if (id) {
    const m = members.find(x => x.id === id)
    const standardPlans  = ['1','10','15','30','45','60','90','180','365']
    const standardBatches = ['night','halfday','fullday','24hrs']
    const isCustomPlan  = m.planLabel || !standardPlans.includes(String(m.plan))
    const isCustomBatch = !standardBatches.includes(m.batch)
    document.getElementById('form-title').textContent     = 'Edit member'
    document.getElementById('form-name').value            = m.name
    document.getElementById('form-phone').value           = m.phone
    document.getElementById('form-batch').value           = isCustomBatch ? 'custom' : m.batch
    document.getElementById('form-plan').value            = isCustomPlan ? 'custom' : m.plan
    document.getElementById('form-amount').value          = ''
    document.getElementById('form-start').value           = m.joined.toISOString().split('T')[0]
    document.getElementById('form-locker').checked        = m.locker
    document.getElementById('form-seat').checked          = m.seat
    document.getElementById('form-save-btn').dataset.editId = id
    if (isCustomPlan) {
      document.getElementById('custom-days-group').style.display = 'flex'
      document.getElementById('form-custom-days').value = m.plan
    } else {
      document.getElementById('custom-days-group').style.display = 'none'
      document.getElementById('form-custom-days').value = ''
    }
    if (isCustomBatch) {
      document.getElementById('custom-batch-group').style.display = 'flex'
      document.getElementById('form-custom-batch').value = m.batch
    } else {
      document.getElementById('custom-batch-group').style.display = 'none'
      document.getElementById('form-custom-batch').value = ''
    }
  } else {
    document.getElementById('form-title').textContent     = 'Add new member'
    document.getElementById('form-name').value            = ''
    document.getElementById('form-phone').value           = ''
    document.getElementById('form-batch').value           = 'fullday'
    document.getElementById('form-plan').value            = '90'
    document.getElementById('form-amount').value          = ''
    document.getElementById('form-start').value           = new Date().toISOString().split('T')[0]
    document.getElementById('form-locker').checked        = false
    document.getElementById('form-seat').checked          = false
    document.getElementById('form-custom-days').value     = ''
    document.getElementById('custom-days-group').style.display  = 'none'
    document.getElementById('form-custom-batch').value    = ''
    document.getElementById('custom-batch-group').style.display = 'none'
    delete document.getElementById('form-save-btn').dataset.editId
  }
}

function closeMemberForm() {
  document.getElementById('member-form').classList.add('hidden')
  if (currentDetailId) {
    openMemberDetail(currentDetailId)
  } else {
    document.getElementById('members-list').classList.remove('hidden')
    document.getElementById('members-toolbar').classList.remove('hidden')
  }
}

// ─── CUSTOM BATCH TOGGLE ─────────────────────
function toggleCustomBatch() {
  const val   = document.getElementById('form-batch').value
  const group = document.getElementById('custom-batch-group')
  group.style.display = val === 'custom' ? 'flex' : 'none'
  if (val !== 'custom') document.getElementById('form-custom-batch').value = ''
}

// ─── CUSTOM PLAN TOGGLE ───────────────────────
function toggleCustomDays() {
  const val   = document.getElementById('form-plan').value
  const group = document.getElementById('custom-days-group')
  group.style.display = val === 'custom' ? 'flex' : 'none'
  if (val !== 'custom') document.getElementById('form-custom-days').value = ''
}


function validatePhone(p) { return /^\d{10}$/.test(p) }

function saveMember() {
  const name       = document.getElementById('form-name').value.trim()
  const phone      = document.getElementById('form-phone').value.trim()
  const batchVal   = document.getElementById('form-batch').value
  const customBatch= document.getElementById('form-custom-batch').value.trim()
  const batch      = batchVal === 'custom' ? customBatch : batchVal
  const planVal    = document.getElementById('form-plan').value
  const customDays = document.getElementById('form-custom-days').value.trim()
  const plan       = planVal === 'custom' ? parseInt(customDays) : parseInt(planVal)
  const start      = document.getElementById('form-start').value
  const locker     = document.getElementById('form-locker').checked
  const seat       = document.getElementById('form-seat').checked
  const result     = document.getElementById('form-result')
  const editId     = document.getElementById('form-save-btn').dataset.editId

  if (!name || !phone || !start) {
    result.textContent = 'Please fill in all required fields'
    result.className   = 'form-error'
    return
  }
  if (batchVal === 'custom' && !customBatch) {
    result.textContent = 'Please enter the custom batch timing'
    result.className   = 'form-error'
    return
  }
  if (!validatePhone(phone)) {
    result.textContent = 'Phone number must be 10 digits'
    result.className   = 'form-error'
    return
  }
  if (planVal === 'custom' && (!customDays || isNaN(plan) || plan < 1)) {
    result.textContent = 'Please enter a valid number of days for the custom plan'
    result.className   = 'form-error'
    return
  }

  const planLabel = planVal === 'custom' ? plan + ' days (custom)' : null

  if (editId) {
    const m   = members.find(x => x.id === editId)
    m.name    = name
    m.phone   = phone
    m.batch   = batch
    m.plan    = plan
    m.planLabel = planLabel
    m.joined  = new Date(start)
    m.locker  = locker
    m.seat    = seat
    result.textContent = 'Member updated successfully'
    result.className   = 'form-success'
  } else {
    const newId = nextMemberId()
    members.push({ id: newId, name, phone, batch, plan, planLabel, joined: new Date(start), locker, seat })
    result.textContent = 'Member added. Code: ' + newId + (planLabel ? ' · ' + planLabel : '')
    result.className   = 'form-success'
  }

  renderMembers()
  updateStats()
  setTimeout(closeMemberForm, 1500)
}

// ─── CHANGE PLAN ─────────────────────────────
function openChangePlan(id) {
  const m = members.find(x => x.id === id)
  if (!m) return
  // pre-fill form with same member details but clear the plan fields for new subscription
  openMemberForm(id)
  document.getElementById('form-title').textContent = 'Change plan — ' + m.name
  document.getElementById('form-start').value       = new Date().toISOString().split('T')[0]
  document.getElementById('form-amount').value      = ''
  // hint to owner
  document.getElementById('form-result').textContent = 'New plan starts today. Old plan will be replaced.'
  document.getElementById('form-result').className   = 'form-success'
}

// ─── INIT ─────────────────────────────────────
renderLog()
renderMembers()
updateStats()
updateAlerts()
setInterval(() => {
  renderLog()
  updateAlerts()
}, 30000)
