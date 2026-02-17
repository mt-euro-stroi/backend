# MT Euro Stroy Backend

Backend API для проекта MT Euro Stroy.  
Стек: NestJS, Prisma, MySQL, JWT Auth, Nodemailer.

---

## 🚀 Технологии

- NestJS
- Prisma ORM
- MySQL
- JWT (Access Token)
- Nodemailer (SMTP)
- CORS
- Multer (File Upload)

---

# 📦 Установка и запуск

## 1️⃣ Клонирование проекта

```bash
git clone <repo_url>
cd <project_folder>
```

## 2️⃣ Установка зависимостей

```bash
npm install
```

## 3️⃣ Настройка переменных окружения

Создать файл `.env` в корне проекта:

```env
# Server
PORT=3001

# Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DATABASE_NAME"
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database_name

# JWT
JWT_ACCESS_SECRET=your_jwt_secret_key_min_32_chars
JWT_ACCESS_EXPIRES_IN=86400

# Email (Gmail SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your@gmail.com
MAIL_PASSWORD=your_app_password
MAIN_FROM=your@gmail.com

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 4️⃣ Запуск Prisma

```bash
npx prisma generate
npx prisma db push
```

## 5️⃣ Запуск сервера

### Development

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

---

## 🌐 API Base URL

```
http://localhost:3001
```

---

## 🔐 Авторизация

Проект использует JWT (Bearer Token).
В защищённых запросах необходимо передавать заголовок:

```
Authorization: Bearer <access_token>
```

---

# 📌 API Endpoints

## 👤 Auth

| Метод | Endpoint | Описание | Auth |
|-------|----------|---------|------|
| POST | `/auth/sign-up` | Регистрация | ❌ |
| POST | `/auth/sign-in` | Вход в систему | ❌ |
| POST | `/auth/verify-email` | Верификация email | ❌ |
| POST | `/auth/resend-verification-code` | Переправить код | ❌ |
| PATCH | `/auth/change-password` | Изменить пароль | ✅ |

---

## 👥 Users

| Метод | Endpoint | Описание | Auth | Роль |
|-------|----------|---------|------|------|
| GET | `/users` | Получить всех пользователей | ✅ | Admin |
| GET | `/users/me` | Получить профиль текущего пользователя | ✅ | Any |
| GET | `/users/:id` | Получить пользователя по ID | ✅ | Admin |
| PATCH | `/users/me` | Обновить профиль | ✅ | Any |
| DELETE | `/users/me` | Удалить аккаунт | ✅ | Any |

---

## 🏢 Residential Complex

| Метод | Endpoint | Описание | Auth | Параметр |
|-------|----------|---------|------|----------|
| POST | `/residential-complex` | Создать жилой комплекс | ✅ | - |
| GET | `/residential-complex` | Получить все жилые комплексы | ❌ | `page`, `limit`, `search` |
| GET | `/residential-complex/:identifier` | Получить комплекс | ❌ | `id` или `slug` * |
| PATCH | `/residential-complex/:slug` | Обновить комплекс | ✅ | `slug` |
| DELETE | `/residential-complex/:id` | Удалить комплекс | ✅ | `id` |

*️⃣ `:identifier` - может быть как числовой ID, так и slug

---

## 🏠 Apartments

| Метод | Endpoint | Описание | Auth | Параметр |
|-------|----------|---------|------|----------|
| POST | `/apartment` | Создать квартиру | ✅ | - |
| GET | `/apartment` | Получить все квартиры | ❌ | `complexSlug`, `page`, `limit` |
| GET | `/apartment/:id` | Получить квартиру по ID | ❌ | `id` |
| PATCH | `/apartment/:id` | Обновить квартиру | ✅ | `id` |
| DELETE | `/apartment/:id` | Удалить квартиру | ✅ | `id` |

---

## ❤️ Favourites

| Метод | Endpoint | Описание | Auth |
|-------|----------|---------|------|
| POST | `/favourites` | Добавить в избранное | ✅ |
| GET | `/favourites` | Получить избранные | ✅ |
| GET | `/favourites/:id` | Получить избранное по ID | ✅ |
| PATCH | `/favourites/:id` | Обновить избранное | ✅ |
| DELETE | `/favourites/:id` | Удалить из избранного | ✅ |

---

## 📅 Bookings

| Метод | Endpoint | Описание | Auth |
|-------|----------|---------|------|
| POST | `/bookings` | Создать бронирование | ✅ |
| GET | `/bookings` | Получить все бронирования | ✅ |
| GET | `/bookings/:id` | Получить бронирование по ID | ✅ |
| PATCH | `/bookings/:id` | Обновить бронирование | ✅ |
| DELETE | `/bookings/:id` | Отменить бронирование | ✅ |

---

## � Использование Slug

Некоторые эндпоинты используют `slug` вместо числовых ID для удобства URL-адресации.

### Residential Complex

- **GET** `/residential-complex/:identifier` - принимает как ID так и slug
  - Примеры: `/residential-complex/1` (ID) или `/residential-complex/elite-residence` (slug)
  
- **PATCH** `/residential-complex/:slug` - требует именно slug
  - Пример: `/residential-complex/elite-residence`

- **DELETE** `/residential-complex/:id` - требует числовой ID
  - Пример: `/residential-complex/1`

### Apartments

- Все эндпоинты используют числовой ID

---

## �📝 Лицензия

UNLICENSED
