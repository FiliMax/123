const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data.sqlite');

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS users');
  db.run('DROP TABLE IF EXISTS posts');

  db.run('CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)');
  db.run('CREATE TABLE posts (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, content TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)');

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['test', 'test123']);

  console.log('Baza danych utworzona! Konto test/test123');
});

db.close();
