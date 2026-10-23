const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Подключаем базу данных SQLite (файл создастся сам при первом запуске)
const db = new sqlite3.Database('./database.db');

// Создаем таблицу для отзывов, если её еще нет
db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    contact TEXT,
    rating INTEGER,
    message TEXT,
    date TEXT
)`);

// API: Получить все отзывы (когда открываешь страницу)
app.get('/api/reviews', (req, res) => {
    db.all("SELECT * FROM reviews ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// API: Добавить новый отзыв (когда нажимаешь "Отправить")
app.post('/api/reviews', (req, res) => {
    const { name, contact, rating, message } = req.body;
    const date = new Date().toLocaleDateString('ru-RU');

    db.run(`INSERT INTO reviews (name, contact, rating, message, date) VALUES (?, ?, ?, ?, ?)`,
        [name, contact, rating, message, date],
        function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID });
        }
    );
});

// === НОВАЯ ЧАСТЬ: ПАРОЛЬ И УДАЛЕНИЕ ===
const ADMIN_PASSWORD = 'admin123'; // Твой пароль для удаления

// API: Удалить отзыв по его ID (только для админа)
app.delete('/api/reviews/:id', (req, res) => {
    const id = req.params.id;

    // Получаем пароль из заголовков запроса
    const clientPassword = req.headers['x-admin-password'];

    // Если пароль не совпадает - выдаем ошибку
    if (clientPassword !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Доступ запрещен. Неверный пароль." });
    }

    // Если пароль верный - удаляем отзыв из базы
    db.run(`DELETE FROM reviews WHERE id = ?`, id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: "Отзыв удален", changes: this.changes });
    });
});

app.listen(3000, () => {
    console.log('Сервер запущен! Открой http://localhost:3000');
});