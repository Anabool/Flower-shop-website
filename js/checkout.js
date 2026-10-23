document.addEventListener('DOMContentLoaded', () => {
    const summaryBlock = document.getElementById('checkoutSummary');
    const summaryItems = document.getElementById('summaryItems');
    const finalTotalEl = document.getElementById('finalTotal');

    let orderData = JSON.parse(localStorage.getItem('bloomOrder'));

    if (!orderData) {
        summaryItems.innerHTML = `<p style="color: #b85c5c;">Вы ничего не выбрали. Пожалуйста, вернитесь в каталог или калькулятор.</p>`;
        orderData = { flowersSum: 0, items: [], wrapPrice: 0, ribbonPrice: 0 };
    } else {
        // Если заказан готовый букет, показываем его красиво с картинкой
        if (orderData.isComposition && orderData.items.length > 0) {
            const item = orderData.items[0];
            summaryItems.innerHTML = `
                <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 10px;">
                    ${item.image ? `<img src="${item.image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">` : ''}
                    <div>
                        <div style="font-weight: bold; font-size: 16px; color: var(--charcoal);">${item.name}</div>
                        <div style="color: #777; font-size: 13px;">${item.desc || ''}</div>
                        <div style="color: var(--rose-dark); font-weight: bold; margin-top: 5px;">${item.price} BYN</div>
                    </div>
                </div>
            `;
        } else {
            // Если это кастомный букет из калькулятора
            summaryItems.innerHTML = orderData.items.map(i =>
                `<div style="display:flex; justify-content:space-between; margin-bottom: 5px;">
                    <span>${i.name} × ${i.qty}</span><span>${i.price * i.qty} BYN</span>
                </div>`
            ).join('');

            if (orderData.wrapPrice > 0) {
                summaryItems.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><span>Упаковка</span><span>${orderData.wrapPrice} BYN</span></div>`;
            }
            if (orderData.ribbonPrice > 0) {
                summaryItems.innerHTML += `<div style="display:flex; justify-content:space-between; margin-bottom: 5px;"><span>Лента</span><span>${orderData.ribbonPrice} BYN</span></div>`;
            }
        }
    }

    summaryBlock.style.display = 'block';
    updateTotal();

    function updateTotal() {
        const baseSum = orderData.flowersSum + (orderData.wrapPrice || 0) + (orderData.ribbonPrice || 0);
        const cardPrice = document.getElementById('addCard').checked ? 1 : 0;
        const sweetsPrice = document.getElementById('addSweets').checked ? 5 : 0;
        finalTotalEl.textContent = `${baseSum + cardPrice + sweetsPrice} BYN`;
    }

    document.getElementById('addCard').addEventListener('change', updateTotal);
    document.getElementById('addSweets').addEventListener('change', updateTotal);

    document.getElementById('checkoutForm').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!document.getElementById('deliveryDate').value) {
            alert('Пожалуйста, выберите дату доставки!');
            return;
        }
        localStorage.removeItem('bloomOrder');
        document.getElementById('successModal').classList.add('active');
    });
});