async function api(url, method = 'GET', data) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (data) opts.body = JSON.stringify(data);
  const res = await fetch(url, opts);
  return res.json();
}

async function loadUser() {
  const user = await api('/api/me');
  const nav = document.getElementById('navLinks');
  const userBox = document.getElementById('userDisplay');
  if (user.username) {
    nav.classList.add('hidden');
    userBox.classList.remove('hidden');
    document.getElementById('username').textContent = user.username;
  }
}

async function loadPosts() {
  const posts = await api('/api/posts');
  const box = document.getElementById('posts');
  if (!box) return;
  box.innerHTML = posts.map(p => `<div class='post'><b>${p.username}:</b> ${p.content}</div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  loadPosts();

  const sendBtn = document.getElementById('sendPost');
  if (sendBtn) {
    sendBtn.onclick = async () => {
      const content = document.getElementById('postContent').value.trim();
      if (!content) return;
      await api('/api/posts', 'POST', { content });
      document.getElementById('postContent').value = '';
      loadPosts();
    };
  }

  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.onclick = async () => {
      const username = document.getElementById('loginUser').value;
      const password = document.getElementById('loginPass').value;
      const res = await api('/api/login', 'POST', { username, password });
      if (res.success) location.href = '/';
      else alert(res.error);
    };
  }

  const regBtn = document.getElementById('registerBtn');
  if (regBtn) {
    regBtn.onclick = async () => {
      const username = document.getElementById('regUser').value;
      const password = document.getElementById('regPass').value;
      const res = await api('/api/register', 'POST', { username, password });
      if (res.success) location.href = '/login.html';
      else alert(res.error);
    };
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.onclick = async () => {
      await api('/api/logout', 'POST');
      location.href = '/';
    };
  }
});
