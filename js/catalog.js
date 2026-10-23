/* ==================== КАТАЛОГ И ФИЛЬТРЫ ==================== */
let currentFlowers = [...flowers];

function renderCatalog() {
    const fGrid = document.getElementById('flowersGrid');
    const noResults = document.getElementById('noResults');

    if (fGrid) {
        if (currentFlowers.length === 0) {
            fGrid.innerHTML = '';
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
            fGrid.innerHTML = currentFlowers.map(f => {
                const photo = f.image
                    ? `<img src="${f.image}" alt="${f.name}" loading="lazy" style="object-position: ${f.position || 'center center'}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                    : '';
                const emojiFallback = `<span class="card-emoji-large" ${f.image ? 'style="display:none"' : ''}>${f.emoji}</span>`;
                return `
          <div class="card card-clickable" onclick="openFlowerModal('${f.id}')">
            <div class="card-image">${photo}${emojiFallback}</div>
            <h3>${f.name}</h3>
            <div class="card-desc">${f.color} · ${f.type}</div>
            <div class="price">${f.price} BYN</div>
            <div class="card-more">Подробнее →</div>
          </div>
        `;
            }).join('');
        }
    }

    const cGrid = document.getElementById('compositionsGrid');
    if (cGrid) {
        cGrid.innerHTML = compositions.map(c => {
            const photo = c.image
                ? `<img src="${c.image}" alt="${c.name}" loading="lazy" style="object-position: ${c.position || 'center center'}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
                : '';
            const emojiFallback = `<span class="card-emoji-large" ${c.image ? 'style="display:none"' : ''}>💐</span>`;

            return `
        <div class="card card-clickable" onclick="openCompositionModal('${c.id}')">
          <div class="card-image">${photo}${emojiFallback}</div>
          <h3>${c.name}</h3>
          <div class="card-desc">${c.desc}</div>
          <div class="price">${c.price} BYN</div>
          <div class="card-more">Подробнее →</div>
        </div>
      `;
        }).join('');
    }
}

function applyFilters() {
    if (!document.getElementById('flowersGrid')) return;

    const searchText = document.getElementById('searchInput').value.toLowerCase();
    const selectedColors = Array.from(document.querySelectorAll('.filter-color:checked')).map(cb => cb.value);
    const selectedPrices = Array.from(document.querySelectorAll('.filter-price:checked')).map(cb => cb.value);
    const sortType = document.getElementById('sortSelect').value;

    let filtered = flowers.filter(f => {
        if (searchText && !f.name.toLowerCase().includes(searchText)) return false;
        if (selectedColors.length > 0 && !selectedColors.includes(f.color)) return false;

        if (selectedPrices.length > 0) {
            let priceMatch = false;
            if (selectedPrices.includes('cheap') && f.price < 5) priceMatch = true;
            if (selectedPrices.includes('medium') && f.price >= 5 && f.price <= 10) priceMatch = true;
            if (selectedPrices.includes('expensive') && f.price > 10) priceMatch = true;
            if (!priceMatch) return false;
        }
        return true;
    });

    if (sortType === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    else if (sortType === 'price-desc') filtered.sort((a, b) => b.price - a.price);

    currentFlowers = filtered;
    renderCatalog();
}

function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.querySelectorAll('.filter-color, .filter-price').forEach(cb => cb.checked = false);
    document.getElementById('sortSelect').value = 'default';
    currentFlowers = [...flowers];
    renderCatalog();
}

/* ==================== МОДАЛКА ДЛЯ ЦВЕТОВ ==================== */
function openFlowerModal(id) {
    const f = flowers.find(x => x.id === id);
    if (!f) return;

    const modal = document.getElementById('flowerModal');
    const content = document.getElementById('modalContent');

    const modalPhoto = f.image
        ? `<img src="${f.image}" alt="${f.name}" style="object-position: ${f.position || 'center center'}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
       <span style="font-size:110px;display:none">${f.emoji}</span>`
        : `<span style="font-size:110px">${f.emoji}</span>`;

    const careList = Array.isArray(f.care) && f.care.length ? `<ul>${f.care.map(c => `<li>${c}</li>`).join('')}</ul>` : '<p>Информация скоро появится.</p>';

    content.innerHTML = `
    <button class="modal-close" onclick="closeFlowerModal()" aria-label="Закрыть">×</button>
    <div class="modal-hero">${modalPhoto}</div>
    <div class="modal-body">
      <h2>${f.name}</h2>
      <div class="modal-meta">${f.color} · ${f.type}</div>
      <div class="modal-price">${f.price} BYN за штуку</div>
      <div class="modal-section"><h3>🌍 Откуда приехал</h3><p>${f.origin || 'Информация скоро появится.'}</p></div>
      <div class="modal-section"><h3>💧 Как ухаживать</h3>${careList}</div>
      ${f.lifespan ? `<div class="modal-section"><h3>⏱ Стойкость</h3><p>${f.lifespan}</p></div>` : ''}
    </div>
  `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeFlowerModal() {
    const modal = document.getElementById('flowerModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ==================== МОДАЛКА ДЛЯ КОМПОЗИЦИЙ ==================== */
function openCompositionModal(id) {
    const c = compositions.find(x => x.id === id);
    if (!c) return;

    const modal = document.getElementById('compositionModal');
    const content = document.getElementById('compositionModalContent');

    const modalPhoto = c.image
        ? `<img src="${c.image}" alt="${c.name}" style="object-position: ${c.position || 'center center'}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
       <span style="font-size:110px;display:none">💐</span>`
        : `<span style="font-size:110px">💐</span>`;

    content.innerHTML = `
    <button class="modal-close" onclick="closeCompositionModal()" aria-label="Закрыть">×</button>
    <div class="modal-hero">${modalPhoto}</div>
    <div class="modal-body">
      <h2>${c.name}</h2>
      <div class="modal-price">${c.price} BYN</div>

      <div class="modal-section">
        <h3>Для какого повода</h3>
        <p>${c.occasion || 'Универсальный вариант.'}</p>
      </div>

      <div class="modal-section">
        <h3>Что в составе</h3>
        <p>${c.composition_details || c.desc}</p>
      </div>

      <div class="modal-section">
        <h3>Как ухаживать</h3>
        <ul>
          <li>Подрежьте стебли под острым углом перед постановкой в воду.</li>
          <li>Меняйте воду каждые 2 дня и промывайте вазу.</li>
          <li>Держите букет вдали от прямых солнечных лучей и сквозняков.</li>
          <li>Избегайте соседства с фруктами.</li>
        </ul>
      </div>

      <!-- КНОПКА ЗАКАЗА -->
      <div class="modal-section" style="border-top: none; padding-top: 0;">
        <button class="btn btn-rose" onclick="orderComposition('${c.id}')" style="width: 100%; padding: 16px; font-size: 18px;">
          Заказать букет за ${c.price} BYN
        </button>
      </div>
    </div>
  `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompositionModal() {
    const modal = document.getElementById('compositionModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/* ==================== ЛОГИКА ЗАКАЗА БУКЕТА ==================== */
function orderComposition(id) {
    const c = compositions.find(x => x.id === id);
    if (!c) return;

    const orderData = {
        isComposition: true,
        flowersSum: c.price,
        items: [{
            name: c.name,
            qty: 1,
            price: c.price,
            image: c.image,
            desc: c.desc
        }],
        wrapPrice: 0,
        ribbonPrice: 0
    };

    localStorage.setItem('bloomOrder', JSON.stringify(orderData));
    window.location.href = 'checkout.html';
}

/* ==================== ИНИЦИАЛИЗАЦИЯ И ГЛАВНАЯ ==================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Фильтры для страницы цветов
    const filterElements = document.querySelectorAll('.filter-color, .filter-price, #sortSelect, #searchInput');
    filterElements.forEach(el => {
        el.addEventListener('input', applyFilters);
        el.addEventListener('change', applyFilters);
    });

    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // 2. Модальные окна
    const modal = document.getElementById('flowerModal');
    const compModal = document.getElementById('compositionModal');

    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeFlowerModal(); });
    if (compModal) compModal.addEventListener('click', e => { if (e.target === compModal) closeCompositionModal(); });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeFlowerModal();
            closeCompositionModal();
        }
    });

    // 3. Вывод популярных композиций на главной странице
    const popularGrid = document.getElementById('popularGrid');
    if (popularGrid) {
        const popularComps = compositions.slice(0, 4); // Берем первые 4 букета
        popularGrid.innerHTML = popularComps.map(c => {
            const photo = c.image
                ? `<img src="${c.image}" alt="${c.name}" loading="lazy" style="object-position: ${c.position || 'center center'}" onerror="this.style.display='none'">`
                : '';
            return `
        <div class="card card-clickable" onclick="openCompositionModal('${c.id}')">
          <div class="card-image">${photo}</div>
          <h3>${c.name}</h3>
          <div class="card-desc">${c.desc}</div>
          <div class="price">${c.price} BYN</div>
          <div class="card-more">Подробнее →</div>
        </div>
      `;
        }).join('');
    }

    // 4. Запускаем рендер каталога
    renderCatalog();
});