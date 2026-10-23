const API_URL = 'http://localhost:3000/api/reviews';
let rating = 0;

// Проверяем, вошел ли админ (сохраняется в памяти браузера, пока вкладка открыта)
let adminPass = sessionStorage.getItem('adminPass') || null;

function setRating(n) {
    rating = n;
    document.querySelectorAll('#stars span').forEach((s, i) => s.classList.toggle('active', i < n));
}

// Функция входа/выхода для админа
function adminLogin() {
    if (adminPass) {
        // Если уже вошел, то кнопка работает как выход
        if (confirm('Вы вошли как администратор. Выйти?')) {
            sessionStorage.removeItem('adminPass');
            adminPass = null;
            loadReviews();
            document.getElementById('adminLoginBtn').textContent = 'Вход для админа';
            document.getElementById('adminLoginBtn').style.color = '#777';
        }
        return;
    }

    const pass = prompt('Введите пароль администратора:');
    if (pass) {
        sessionStorage.setItem('adminPass', pass);
        adminPass = pass;
        loadReviews();
        document.getElementById('adminLoginBtn').textContent = 'Выйти (Админ)';
        document.getElementById('adminLoginBtn').style.color = 'var(--rose-dark)';
    }
}

// Загрузка отзывов
async function loadReviews() {
    const container = document.getElementById('reviewsList');
    const loginBtn = document.getElementById('adminLoginBtn');

    if (adminPass) {
        loginBtn.textContent = 'Выйти (Админ)';
        loginBtn.style.color = 'var(--rose-dark)';
    } else {
        loginBtn.textContent = 'Вход для админа';
        loginBtn.style.color = '#777';
    }

    try {
        const response = await fetch(API_URL);
        const reviews = await response.json();

        if (reviews.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #777;">Пока нет отзывов. Будьте первым!</p>';
            return;
        }

        container.innerHTML = reviews.map(r => `
      <div style="background: #fff; padding: 20px; border-radius: 10px; margin-bottom: 15px; box-shadow: var(--shadow); border: 1px solid #efe8dd; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="color: var(--sage); font-size: 18px;">${r.name}</strong>
          <span style="color: var(--gold); font-size: 20px;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
        </div>
        <p style="color: #555; margin-bottom: 15px; line-height: 1.6;">${r.message}</p>
        
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #eee; padding-top: 10px;">
            <small style="color: #999;">${r.date}</small>
            <!-- Кнопка удаления появляется только если есть пароль -->
            ${adminPass ? `<button onclick="deleteReview(${r.id})" style="background: none; border: none; color: #b85c5c; cursor: pointer; font-size: 13px; text-decoration: underline;">Удалить</button>` : ''}
        </div>
      </div>
    `).join('');
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        container.innerHTML = '<p style="text-align: center; color: red;">Не удалось загрузить отзывы. Убедитесь, что сервер запущен.</p>';
    }
}

// Отправка формы
async function submitFeedback(e) {
    e.preventDefault();
    if (!rating) { alert('Поставьте, пожалуйста, оценку'); return; }

    const name = document.querySelector('#feedbackForm input[type="text"]').value;
    const contact = document.querySelectorAll('#feedbackForm input[type="text"]')[1].value;
    const message = document.querySelector('#feedbackForm textarea').value;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, contact, rating, message })
        });

        if (response.ok) {
            alert('Спасибо за отзыв!');
            e.target.reset();
            rating = 0;
            document.querySelectorAll('#stars span').forEach(s => s.classList.remove('active'));
            loadReviews();
        } else {
            alert('Ошибка при отправке отзыва');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Сервер недоступен.');
    }
}

// Удаление отзыва
async function deleteReview(id) {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'x-admin-password': adminPass
            }
        });

        if (response.ok) {
            loadReviews();
        } else if (response.status === 401) {
            alert('Неверный пароль администратора!');
            sessionStorage.removeItem('adminPass');
            adminPass = null;
            loadReviews();
        } else {
            alert('Ошибка при удалении');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Сервер недоступен.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#stars span').forEach((s, i) => s.addEventListener('click', () => setRating(i + 1)));
    const form = document.getElementById('feedbackForm');
    if (form) form.addEventListener('submit', submitFeedback);

    loadReviews();
});