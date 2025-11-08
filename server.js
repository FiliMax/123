const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'tajnykluczforum123',
  resave: false,
  saveUninitialized: false
}));

// ===== BAZA DANYCH =====
const db = new sqlite3.Database('./data.sqlite', (err) => {
  if (err) console.error('Błąd bazy:', err);
  else console.log('Połączono z bazą SQLite.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  password TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)`);

// ===== KONFIGURACJA POCZTY =====
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'twojemail@gmail.com', // 🔹 ZMIEŃ
    pass: 'twojehasloaplikacji' // 🔹 hasło aplikacji Gmail, nie zwykłe!
  }
});

// ===== ENDPOINTY API =====

// Rejestracja
app.post('/api/register', (req, res) => {
  const { username, email, phone, password } = req.body;
  db.run('INSERT INTO users (username, email, phone, password) VALUES (?, ?, ?, ?)',
    [username, email, phone, password],
    err => {
      if (err) return res.status(400).json({ error: 'Użytkownik już istnieje' });
      res.json({ success: true });
    });
});

// Logowanie
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?',
    [username, username, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: 'Błąd serwera' });
      if (!row) return res.status(401).json({ error: 'Nieprawidłowe dane logowania' });

      req.session.username = row.username;
      req.session.isAdmin = row.username === 'admin';
      res.json({ success: true });
    });
});

// Posty
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    res.json(rows);
  });
});

app.post('/api/posts', (req, res) => {
  if (!req.session.username)
    return res.status(401).json({ error: 'Musisz być zalogowany.' });

  const { content } = req.body;
  db.run('INSERT INTO posts (username, content) VALUES (?, ?)',
    [req.session.username, content],
    err => {
      if (err) return res.status(500).json({ error: 'Błąd zapisu posta' });
      res.json({ success: true });
    });
});

// Wylogowanie
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// Sprawdzenie sesji
app.get('/api/me', (req, res) => {
  res.json({ username: req.session.username || null, isAdmin: req.session.isAdmin || false });
});

// ===== RESET HASŁA =====
app.post('/api/forgot', (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // 6-cyfrowy kod

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: 'Błąd serwera' });
    if (!user) return res.status(404).json({ error: 'Nie znaleziono użytkownika' });

    // wysyłamy maila
    transporter.sendMail({
      from: 'AnonForum <twojemail@gmail.com>',
      to: email,
      subject: 'Kod resetu hasła - AnonForum',
      text: `Twój kod resetu hasła to: ${code}`
    });

    req.session.resetCode = code;
    req.session.resetEmail = email;
    res.json({ success: true, message: 'Kod wysłany na e-mail.' });
  });
});

app.post('/api/reset', (req, res) => {
  const { code, newPassword } = req.body;
  if (parseInt(code) !== req.session.resetCode)
    return res.status(400).json({ error: 'Nieprawidłowy kod.' });

  db.run('UPDATE users SET password = ? WHERE email = ?',
    [newPassword, req.session.resetEmail],
    err => {
      if (err) return res.status(500).json({ error: 'Błąd zapisu.' });
      res.json({ success: true, message: 'Hasło zmienione.' });
    });
});

// ===== PANEL ADMINA =====
app.get('/api/admin/users', (req, res) => {
  if (!req.session.isAdmin) return res.status(403).json({ error: 'Brak uprawnień' });
  db.all('SELECT id, username, email, phone, created_at FROM users', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Błąd bazy danych' });
    res.json(rows);
  });
});

// ===== START =====
app.listen(PORT, () => console.log(`✅ Serwer działa na http://localhost:${PORT}`));
