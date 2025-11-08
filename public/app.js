// helper
function escape(s){ return s?String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') : ''; }
function timeAgo(ts){
  const d = new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime())/60000); // minutes
  if(diff < 1) return 'teraz';
  if(diff < 60) return diff + ' min';
  if(diff < 1440) return Math.floor(diff/60) + ' h';
  return Math.floor(diff/1440) + ' d';
}

// UI references
const feed = document.getElementById('feed');
const postContent = document.getElementById('postContent');
const btnPost = document.getElementById('btnPost');
const btnRefresh = document.getElementById('btnRefresh');
const userDisplay = document.getElementById('userDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const authNav = document.getElementById('authNav');
const adminLink = document.getElementById('adminLink');

// load session
async function refreshUser(){
  const res = await fetch('/api/me');
  const me = await res.json();
  if(me && me.username){
    userDisplay.style.display = 'inline';
    userDisplay.textContent = me.username;
    logoutBtn.style.display = 'inline-block';
    authNav.style.display = 'none';
    if(me.role === 'admin') adminLink.style.display = 'inline';
    else adminLink.style.display = 'none';
  } else {
    userDisplay.style.display = 'none';
    logoutBtn.style.display = 'none';
    authNav.style.display = 'flex';
    adminLink.style.display = 'none';
  }
}

// render posts (flat list with replies nested)
async function loadPosts(){
  const res = await fetch('/api/posts');
  const posts = await res.json();
  // build map
  const map = {};
  posts.forEach(p => { p.replies=[]; map[p.id] = p; });
  const roots = [];
  posts.forEach(p => {
    if(p.parent_id && map[p.parent_id]) map[p.parent_id].replies.push(p);
    else roots.push(p);
  });
  // roots are newest-first from server; we want oldest-first top->down, so reverse
  roots.reverse();
  feed.innerHTML = roots.map(renderPost).join('');
}
function renderPost(p){
  const time = new Date(p.created_at).toLocaleString();
  let html = `<div class="post"><div class="meta"><span>${escape(p.username)}</span><span class="small">${time} · ${timeAgo(p.created_at)}</span></div><div>${escape(p.content)}</div>`;
  // reply button and area
  html += `<div style="margin-top:8px"><button class="button" onclick="showReply(${p.id})">Odpowiedz</button></div>`;
  if(p.replies && p.replies.length){
    html += `<div class="reply">` + p.replies.map(r => `<div class="post"><div class="meta"><span>${escape(r.username)}</span><span class="small">${new Date(r.created_at).toLocaleString()} · ${timeAgo(r.created_at)}</span></div><div>${escape(r.content)}</div></div>`).join('') + `</div>`;
  }
  html += `</div>`;
  return html;
}
window.showReply = (id) => {
  const txt = prompt('Twoja odpowiedź:');
  if(!txt) return;
  fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:txt,parent_id:id})}).then(()=>{});
};

// post new
btnPost.onclick = async () => {
  const content = postContent.value.trim();
  if(!content) return alert('Pusta wiadomość');
  const res = await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content})});
  if(res.status === 401) { alert('Zaloguj się'); location.href='/login.html'; return; }
  postContent.value = '';
  await loadPosts();
};

// refresh
btnRefresh.onclick = loadPosts;

// logout
logoutBtn.onclick = async () => { await fetch('/api/logout',{method:'POST'}); await refreshUser(); loadPosts(); };

// SSE listen
function initSSE(){
  const es = new EventSource('/api/stream');
  es.addEventListener('post', (ev) => {
    // data is single post object; refresh entire feed (simpler)
    loadPosts();
  });
  es.onopen = ()=> console.log('SSE open');
  es.onerror = ()=> console.log('SSE error');
}

refreshUser();
loadPosts();
initSSE();
setInterval(()=>document.getElementById('timeNow') && (document.getElementById('timeNow').textContent = new Date().toLocaleTimeString()), 60000);
