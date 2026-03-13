// Глобальные переменные
let tg;
let cart = [];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Приложение запускается...');
    
    // Проверяем, запущено ли приложение в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        console.log('✅ Telegram Web App инициализирован');
        
        // Получаем данные пользователя
        const user = tg.initDataUnsafe?.user;
        if (user) {
            console.log(`👤 Пользователь: ${user.first_name} ${user.last_name || ''}`);
        }
    } else {
        console.warn('⚠️ Приложение запущено вне Telegram');
    }
    
    // Инициализация меню
    initMenu();
    
    // Привязка обработчиков
    bindEvents();
});

// Инициализация меню
function initMenu() {
    console.log('Загрузка меню...');
    
    // Здесь ваш код для загрузки меню из data-атрибутов
    const burgers = document.querySelectorAll('.burger-item');
    burgers.forEach((burger, index) => {
        burger.setAttribute('data-id', `burger_${index + 1}`);
    });
}

// Привязка событий
function bindEvents() {
    console.log('Привязка обработчиков событий...');
    
    // Кнопки в меню
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const item = this.closest('.item-card');
            if (item) {
                const id = item.dataset.id;
                const name = item.querySelector('.item-name')?.textContent;
                const price = item.querySelector('.item-price')?.textContent;
                
                console.log('✅ Добавлено в корзину:', { id, name, price });
                
                // Добавляем в корзину
                addToCart({ id, name, price });
                
                // Показываем уведомление
                showNotification('Товар добавлен в корзину!');
                
                // Отправляем данные в Telegram (если нужно)
                if (tg) {
                    tg.sendData(JSON.stringify({ action: 'add', item: { id, name, price } }));
                }
            }
        });
    });
    
    // Навигационные кнопки
    document.querySelectorAll('.nav-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const target = this.dataset.target || this.innerText;
            console.log('Навигация:', target);
            
            // Убираем активный класс у всех
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Показываем нужную секцию
            if (target === 'Меню') {
                document.getElementById('menuSection').style.display = 'block';
                document.getElementById('cartSection').style.display = 'none';
            } else if (target === 'Корзина') {
                document.getElementById('menuSection').style.display = 'none';
                document.getElementById('cartSection').style.display = 'block';
                updateCartDisplay();
            }
        });
    });
}

// Функция добавления в корзину
function addToCart(item) {
    cart.push(item);
    updateCartCounter();
}

// Обновление счётчика корзины
function updateCartCounter() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        if (cart.length > 0) {
            badge.textContent = cart.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Обновление отображения корзины
function updateCartDisplay() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (cartItems && cartTotal) {
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Корзина пуста</p>';
            cartTotal.textContent = 'Итого: 0₽';
        } else {
            let html = '';
            let total = 0;
            
            cart.forEach((item, index) => {
                const priceNum = parseInt(item.price) || 0;
                total += priceNum;
                html += `
                    <div class="cart-item" data-index="${index}">
                        <span>${item.name}</span>
                        <span>${item.price}</span>
                    </div>
                `;
            });
            
            cartItems.innerHTML = html;
            cartTotal.textContent = `Итого: ${total}₽`;
        }
    }
}

// Показ уведомления
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    } else {
        alert(message); // Запасной вариант
    }
}

// Экспортируем функции для глобального доступа
window.showSection = function(section) {
    console.log('Переключение на секцию:', section);
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.includes(section === 'menu' ? 'Меню' : 'Корзина')) {
            btn.classList.add('active');
        }
    });
    
    if (section === 'menu') {
        document.getElementById('menuSection').style.display = 'block';
        document.getElementById('cartSection').style.display = 'none';
    } else {
        document.getElementById('menuSection').style.display = 'none';
        document.getElementById('cartSection').style.display = 'block';
        updateCartDisplay();
    }
};

window.selectPayment = function(method) {
    console.log('Выбран способ оплаты:', method);
    
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (method === 'online') {
        document.querySelector('.online-btn').classList.add('active');
    } else {
        document.querySelector('.cash-btn').classList.add('active');
    }
    
    // Активируем кнопку заказа
    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
        orderBtn.disabled = false;
    }
};

window.createOrder = function() {
    console.log('Создание заказа...');
    
    if (cart.length === 0) {
        showNotification('Корзина пуста!');
        return;
    }
    
    // Отправляем данные в Telegram
    if (tg) {
        const orderData = {
            action: 'create_order',
            items: cart,
            total: cart.reduce((sum, item) => sum + (parseInt(item.price) || 0), 0),
            payment_method: document.querySelector('.payment-btn.active')?.textContent.includes('Онлайн') ? 'online' : 'cash'
        };
        
        tg.sendData(JSON.stringify(orderData));
        tg.close(); // Закрываем Web App после отправки
    } else {
        alert('Заказ оформлен! (демо-режим)');
    }
};

window.clearCart = function() {
    cart = [];
    updateCartCounter();
    updateCartDisplay();
    showNotification('Корзина очищена');
};
