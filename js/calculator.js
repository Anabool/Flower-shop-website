function renderFlowerPicker() {
    const picker = document.getElementById('flowerPicker');
    if (!picker) return;
    picker.innerHTML = flowers.map(f => `
        <div class="flower-row">
            <label>
                <input type="checkbox" class="flower-check" data-id="${f.id}">
                ${f.name}
            </label>
            <input type="number" class="flower-qty" data-id="${f.id}" value="1" min="0" max="99">
            <span class="fprice">${f.price} BYN</span>
        </div>
    `).join('');
}

function parseWishes(text) {
    const lower = text.toLowerCase();
    const exTypes = [], exColors = [], preferredTypes = [];
    let budgetFromWish = null;

    const neg = '(?:без|не\\s+(?:добав|нужн|клад|хочу)|убрать|исключить)\\w*[^.]*?';
    if (new RegExp(neg + 'роз').test(lower)) exTypes.push('роза');
    if (new RegExp(neg + 'тюльпан').test(lower)) exTypes.push('тюльпан');
    if (new RegExp(neg + 'хризантем').test(lower)) exTypes.push('хризантема');
    if (new RegExp(neg + 'пион').test(lower)) exTypes.push('пион');
    if (new RegExp(neg + 'лили').test(lower)) exTypes.push('лилия');
    if (new RegExp(neg + 'гербер').test(lower)) exTypes.push('гербера');
    if (new RegExp(neg + 'эустом').test(lower)) exTypes.push('эустома');

    if (/без\s+жёлт|без\s+желт|не\s+жёлт|не\s+желт|никаких\s+жёлт|никаких\s+желт/.test(lower)) exColors.push('жёлтый');
    if (/без\s+красн|не\s+красн|никаких\s+красн/.test(lower)) exColors.push('красный');
    if (/без\s+бел|не\s+бел|никаких\s+бел/.test(lower) && !/без\s+белк/.test(lower)) exColors.push('белый');
    if (/без\s+розов|не\s+розов|никаких\s+розов/.test(lower)) exColors.push('розовый');

    const pref = '(?:с|добавить|хочу|только|из)\\s+';
    if (new RegExp(pref + 'роз').test(lower) && !exTypes.includes('роза')) preferredTypes.push('роза');
    if (new RegExp(pref + 'тюльпан').test(lower) && !exTypes.includes('тюльпан')) preferredTypes.push('тюльпан');
    if (new RegExp(pref + 'хризантем').test(lower) && !exTypes.includes('хризантема')) preferredTypes.push('хризантема');
    if (new RegExp(pref + 'пион').test(lower) && !exTypes.includes('пион')) preferredTypes.push('пион');

    const m = lower.match(/бюджет\w*\s*[:=]?\s*(\d+)/) || lower.match(/(\d+)\s*(?:руб|₽|р\b|byn|бр)/) || lower.match(/(?:на|в\s+пределах)\s+(\d+)/);
    if (m) budgetFromWish = parseInt(m[1]);

    return { exTypes, exColors, preferredTypes, budgetFromWish };
}

function getOrderTotals() {
    const wrapSel = document.getElementById('wrapping').selectedOptions[0];
    const ribSel = document.getElementById('ribbon').selectedOptions[0];
    return {
        wrapSel, ribSel,
        wrapPrice: parseInt(wrapSel.dataset.price) || 0,
        ribPrice: parseInt(ribSel.dataset.price) || 0,
        decorAndExtras: (parseInt(wrapSel.dataset.price) || 0) + (parseInt(ribSel.dataset.price) || 0)
    };
}

function calculateBouquet() {
    const resultEl = document.getElementById('result');
    const wishesText = document.getElementById('wishes').value;
    const parsed = parseWishes(wishesText);

    const selected = [];
    document.querySelectorAll('.flower-check').forEach(chk => {
        if (!chk.checked) return;
        const id = chk.dataset.id;
        const qty = parseInt(document.querySelector(`.flower-qty[data-id="${id}"]`).value) || 0;
        if (qty > 0) selected.push({ ...flowers.find(x => x.id === id), qty });
    });

    const totals = getOrderTotals();
    let budget = parseInt(document.getElementById('budget').value);
    if (isNaN(budget)) budget = parsed.budgetFromWish;

    let finalItems = [];
    let flowersSum = 0;
    let isAuto = false;

    // 1. Автоподбор по бюджету
    if (selected.length === 0 && budget && !isNaN(budget)) {
        isAuto = true;
        let available = flowers.filter(f => !parsed.exTypes.includes(f.type) && !parsed.exColors.includes(f.color));

        if (parsed.preferredTypes.length > 0) {
            const prefAvail = available.filter(f => parsed.preferredTypes.includes(f.type));
            if (prefAvail.length > 0) available = prefAvail;
        }

        if (available.length === 0) {
            showResultModal(`<div class="result"><h3>Увы!</h3><p>По вашим пожеланиям не осталось подходящих цветов.</p></div>`);
            return;
        }

        let moneyForFlowers = budget - totals.decorAndExtras;
        if (moneyForFlowers <= 0) {
            showResultModal(`<div class="result"><h3>Бюджет слишком мал</h3><p>Упаковка и лента стоят дороже, чем ваш бюджет.</p></div>`);
            return;
        }

        available.sort((a, b) => a.price - b.price);
        for (let f of available) {
            while (flowersSum + f.price <= moneyForFlowers) {
                flowersSum += f.price;
                const existing = finalItems.find(x => x.id === f.id);
                if (existing) existing.qty++;
                else finalItems.push({ ...f, qty: 1 });
                if (finalItems.find(x => x.id === f.id).qty >= 9) break;
            }
        }

        if (finalItems.length === 0) {
            showResultModal(`<div class="result"><h3>Бюджет слишком мал</h3><p>Не хватает даже на один цветок.</p></div>`);
            return;
        }
    }
    // 2. Ручной выбор
    else {
        const removed = [];
        finalItems = selected.filter(f => {
            const blocked = parsed.exTypes.includes(f.type) || parsed.exColors.includes(f.color);
            if (blocked) removed.push(`${f.name} (${f.qty} шт.)`);
            return !blocked;
        });

        if (finalItems.length === 0) {
            showResultModal(`<div class="result"><h3>Ничего не выбрано</h3><p>Отметьте цветы слева или укажите бюджет.</p></div>`);
            return;
        }
        flowersSum = finalItems.reduce((s, f) => s + f.price * f.qty, 0);
        parsed.removed = removed;
    }

    const total = flowersSum + totals.decorAndExtras;
    const lines = finalItems.map(f => `<div class="result-line"><span>${f.emoji} ${f.name} × ${f.qty}</span><span>${f.price * f.qty} BYN</span></div>`).join('');

    let budgetBlock = '';
    if (budget && !isNaN(budget)) {
        budgetBlock = total <= budget
            ? `<div class="ok">✓ Укладывается в бюджет ${budget} BYN (остаток ${budget - total} BYN)</div>`
            : `<div class="warn">✗ Дороже бюджета на ${total - budget} BYN.</div>`;
    }
    const removedBlock = parsed.removed && parsed.removed.length ? `<div class="warn">Исключено: ${parsed.removed.join(', ')}</div>` : '';

    const html = `
        <div class="result" style="margin-top: 0; border: none; padding: 0; background: transparent;">
            <h3>${isAuto ? 'Мы подобрали для вас букет' : 'Ваш букет'}</h3>
            ${lines}
            <div class="result-line"><span>Упаковка: ${totals.wrapSel.text.split(' —')[0]}</span><span>${totals.wrapPrice} BYN</span></div>
            <div class="result-line"><span>Лента: ${totals.ribSel.text.split(' —')[0]}</span><span>${totals.ribPrice} BYN</span></div>
            <div class="result-total"><span>Итого</span><span>${total} BYN</span></div>
            ${budgetBlock}${removedBlock}
            <button class="btn" id="checkoutBtn" style="width:100%; margin-top: 20px; background: var(--sage);">Перейти к оформлению &rarr;</button>
        </div>
    `;

    showResultModal(html);

    // Настраиваем кнопку перехода
    setTimeout(() => {
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.onclick = () => {
                const orderData = { flowersSum, items: finalItems, wrapPrice: totals.wrapPrice, ribbonPrice: totals.ribPrice };
                localStorage.setItem('bloomOrder', JSON.stringify(orderData));
                window.location.href = 'checkout.html';
            };
        }
    }, 100);
}

/* Функции для управления модальным окном */
function showResultModal(html) {
    const resultEl = document.getElementById('result');
    const modal = document.getElementById('resultModal');

    resultEl.innerHTML = html;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeResultModal() {
    const modal = document.getElementById('resultModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Закрытие по клику вне окна
document.addEventListener('DOMContentLoaded', () => {
    renderFlowerPicker();
    const btn = document.getElementById('calcBtn');
    if (btn) btn.addEventListener('click', calculateBouquet);

    const modal = document.getElementById('resultModal');
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) closeResultModal();
        });
    }
    // Закрытие на Escape
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeResultModal();
    });
});