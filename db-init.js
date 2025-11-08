const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

db.serialize(() => {
  console.log('🔧 Tworzenie bazy danych...');

  // Tabela użytkowników
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Tabela postów
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Konto admina
  db.run(
    `INSERT OR IGNORE INTO users (username, password, email, phone, role)
     VALUES ('admin', 'admin123', 'admin@example.com', '000000000', 'admin')`
  );

  console.log('✅ Baza danych gotowa, konto admina utworzone (login: admin / hasło: admin123)');
});

db.close();
