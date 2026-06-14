// login.js
// Hardcoded for now — will be replaced with real API call later

const ADMIN_USER = 'sarthi'
const ADMIN_PASS = 'admin123'

document.getElementById('login-btn').addEventListener('click', doLogin)
document.getElementById('password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') doLogin()
})

function doLogin() {
  const username = document.getElementById('username').value.trim()
  const password = document.getElementById('password').value.trim()
  const errorEl = document.getElementById('login-error')

  if (!username || !password) {
    errorEl.textContent = 'Please enter username and password'
    return
  }

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    // Save login state
    localStorage.setItem('sarthi_logged_in', 'true')
    // Go to dashboard
    window.location.href = 'dashboard.html'
  } else {
    errorEl.textContent = 'Incorrect username or password'
    document.getElementById('password').value = ''
  }
}
