# UniClub — Студенческая платформа

## 🚀 Быстрый старт

```bash
# 1. Установка зависимостей
npm install

# 2. Запуск
npm start

# 3. Открой http://localhost:3000
```

## 🔐 Демо аккаунты

| Роль | Email | Пароль |
|------|-------|--------|
| Админ | admin@uniclub.ru | admin123 |
| Студент | student@uniclub.ru | student123 |

## 📁 Структура проекта

```
uniclub/
├── public/
│   ├── index.html      # HTML шаблон
│   ├── manifest.json   # PWA манифест
│   ├── favicon.svg     # Иконка
│   └── icons/          # PWA иконки
├── src/
│   ├── components/     # UI компоненты
│   │   ├── Icons.js    # SVG иконки Apple style
│   │   ├── UI.js       # Базовые компоненты
│   │   ├── Modal.js    # Модальные окна
│   │   ├── Navigation.js # Sidebar и TabBar
│   │   └── Login.js    # Страница входа
│   ├── context/        # React Context
│   │   ├── AppContext.js
│   │   └── NotificationContext.js
│   ├── hooks/          # Custom hooks
│   │   └── index.js
│   ├── pages/          # Страницы
│   │   ├── Dashboard.js
│   │   ├── ClubsPage.js
│   │   ├── EventsPage.js
│   │   ├── SchedulePage.js
│   │   ├── FacultiesPage.js
│   │   ├── UsersPage.js
│   │   └── ProfilePage.js
│   ├── styles/
│   │   └── index.css   # iOS 26 Liquid Glass стили
│   ├── utils/
│   │   ├── supabase.js # Supabase клиент
│   │   ├── constants.js
│   │   ├── helpers.js
│   │   └── haptic.js
│   ├── App.js          # Главный компонент
│   └── index.js        # Точка входа
└── package.json
```

## ✨ Фичи

- 🎨 **iOS 26 Liquid Glass** дизайн
- 📱 **Mobile-first** адаптивность
- ⚡ **Оптимизация** (lazy loading, memoization)
- 🔔 **Push уведомления**
- 📴 **Offline режим** (PWA)
- 🎯 **60+ SVG иконок** в стиле SF Symbols

## 🛠 Технологии

- React 18
- Supabase (backend)
- CSS Variables + Liquid Glass
- Service Worker (PWA)

## 📱 PWA установка

На iPhone/Android откройте сайт в браузере и нажмите "Добавить на главный экран".
