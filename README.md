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

Создать файл `.env` в корне проекта и заполнить переменные:

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

## 📑 Swagger (документация API)

После запуска в режиме разработки Swagger UI доступен по адресу:

http://localhost:3001/api

В нём перечислены все эндпоинты, DTO с `@ApiProperty` и примеры тел запросов/ответов — используйте Swagger как единственный источник правды для вызовов API.

---

## 📝 Лицензия

UNLICENSED
