const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// konfiguracja sesji
app.use(session({
  secret: 'tajnyklucz',
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./data.sqlite');

// ===== ROUTES =====

// API: pobierz wszystkie posty
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    res.json(rows);
  });
});

// API: dodaj nowy post
app.post('/api/posts', (req, res) => {
  if (!req.session.username) return res.status(401).json({ error: 'Musisz być zalogowany.' });
  const { content } = req.body;
  db.run('INSERT INTO posts (username, content) VALUES (?, ?)', [req.session.username, content], err => {
    if (err) return res.status(500).json({ error: 'Błąd zapisu posta' });
    res.json({ success: true });
  });
});

// API: rejestracja
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], err => {
    if (err) return res.status(400).json({ error: 'Użytkownik już istnieje' });
    res.json({ success: true });
  });
});

// API: logowanie
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    if (!row) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });
    req.session.username = username;
    res.json({ success: true });
  });
});

// API: sprawdzenie sesji
app.get('/api/me', (req, res) => {
  res.json({ username: req.session.username || null });
});

// API: wylogowanie
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.listen(PORT, () => console.log(`Serwer działa na http://localhost:${PORT}`));
