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

| Метод | Endpoint                         | Описание          | Auth |
| ----- | -------------------------------- | ----------------- | ---- |
| POST  | `/auth/sign-up`                  | Регистрация       | ❌   |
| POST  | `/auth/sign-in`                  | Вход в систему    | ❌   |
| POST  | `/auth/verify-email`             | Верификация email | ❌   |
| POST  | `/auth/resend-verification-code` | Переправить код   | ❌   |
| PATCH | `/auth/change-password`          | Изменить пароль   | ✅   |

---

## 👥 Users (Публичные)

| Метод  | Endpoint    | Описание                               | Auth | Параметр |
| ------ | ----------- | -------------------------------------- | ---- | -------- |
| GET    | `/users/me` | Получить профиль текущего пользователя | ✅   | -        |
| PATCH  | `/users/me` | Обновить профиль                       | ✅   | -        |
| DELETE | `/users/me` | Удалить аккаунт                        | ✅   | -        |

## 👥 Users (Административные)

| Метод  | Endpoint              | Описание                        | Auth | Параметр            |
| ------ | --------------------- | ------------------------------- | ---- | ------------------- |
| GET    | `/admin/users`        | Получить всех пользователей     | ✅   | `page`, `limit`, `search`, `isActive` |
| GET    | `/admin/users/:id`    | Получить пользователя по ID     | ✅   | -                   |
| PATCH  | `/admin/users/:id/role` | Изменить роль пользователя    | ✅   | -                   |
| PATCH  | `/admin/users/:id/status` | Изменить статус пользователя | ✅   | -                   |
| DELETE | `/admin/users/:id`    | Удалить пользователя            | ✅   | -                   |

---

## 🏢 Complexes (Публичные)

| Метод  | Endpoint         | Описание              | Auth | Параметр                        |
| ------ | ---------------- | -------------------- | ---- | ------------------------------- |
| GET    | `/complexes`     | Получить все комплексы | ❌   | `page`, `limit`, `search`       |
| GET    | `/complexes/:slug` | Получить комплекс   | ❌   | -                               |

## 🏢 Complexes (Административные)

| Метод  | Endpoint                 | Описание                      | Auth | Параметр            |
| ------ | ------------------------ | ----------------------------- | ---- | ------------------- |
| POST   | `/admin/complexes`       | Создать жилой комплекс        | ✅   | files (multipart)   |
| GET    | `/admin/complexes`       | Получить все комплексы        | ✅   | `page`, `limit`, `search`, `isPublished` |
| GET    | `/admin/complexes/:identifier` | Получить комплекс (по ID или slug) | ✅   | - |
| PATCH  | `/admin/complexes/:id`   | Обновить комплекс             | ✅   | files (multipart)   |
| PATCH  | `/admin/complexes/:id/status` | Изменить статус публикации | ✅   | - |
| DELETE | `/admin/complexes/:id`   | Удалить комплекс              | ✅   | -                   |

---

## 🏠 Apartments (Публичные)

| Метод  | Endpoint        | Описание           | Auth | Параметр                                 |
| ------ | --------------- | ------------------ | ---- | ---------------------------------------- |
| GET    | `/apartments`   | Получить все квартиры | ❌   | `page`, `limit`, `status`, `rooms`, `floor`, `minPrice`, `maxPrice` |
| GET    | `/apartments/:id` | Получить квартиру по ID | ❌   | - |

## 🏠 Apartments (Административные)

| Метод  | Endpoint                  | Описание                        | Auth | Параметр            |
| ------ | ------------------------- | ------------------------------- | ---- | ------------------- |
| POST   | `/admin/apartments`       | Создать квартиру                | ✅   | files (multipart)   |
| GET    | `/admin/apartments`       | Получить все квартиры           | ✅   | `page`, `limit`, `status`, `rooms`, `floor`, `minPrice`, `maxPrice`, `isPublished` |
| GET    | `/admin/apartments/:id`   | Получить квартиру по ID         | ✅   | -                   |
| PATCH  | `/admin/apartments/:id`   | Обновить квартиру               | ✅   | files (multipart)   |
| PATCH  | `/admin/apartments/:id/status` | Изменить статус публикации | ✅   | - |
| DELETE | `/admin/apartments/:id`   | Удалить квартиру                | ✅   | -                   |

---

## ❤️ Favourites

| Метод  | Endpoint           | Описание                  | Auth | Параметр       |
| ------ | ------------------ | ------------------------- | ---- | -------------- |
| POST   | `/favourites`      | Добавить в избранное      | ✅   | `apartmentId`  |
| GET    | `/favourites`      | Получить избранное        | ✅   | `page`, `limit` |
| DELETE | `/favourites/:id`  | Удалить из избранного     | ✅   | -              |

## 📅 Bookings (Публичные)

| Метод  | Endpoint          | Описание           | Auth | Параметр      |
| ------ | ----------------- | ------------------ | ---- | ------------- |
| POST   | `/bookings`       | Создать бронь      | ✅   | `apartmentId` |
| GET    | `/bookings`       | Получить мои брони | ✅   | -             |
| DELETE | `/bookings/:id`   | Удалить бронь      | ✅   | -             |

## 📅 Bookings (Административные)

| Метод  | Endpoint                   | Описание               | Auth | Параметр                    |
| ------ | -------------------------- | ---------------------- | ---- | --------------------------- |
| GET    | `/admin/bookings`          | Получить все брони     | ✅   | `page`, `limit`, `userId`, `status` |
| GET    | `/admin/bookings/:id`      | Получить бронь по ID   | ✅   | -                           |
| PATCH  | `/admin/bookings/:id/status` | Изменить статус брони | ✅   | -                           |
| DELETE | `/admin/bookings/:id`      | Удалить бронь          | ✅   | -                           |

---
## 📋 Примеры запросов

### 🔐 Auth

#### Sign Up
```bash
curl -X POST http://localhost:3001/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Иван",
    "lastName": "Петров",
    "phone": "+79999999999",
    "email": "ivan@example.com",
    "password": "SecurePass123"
  }'
```

#### Sign In
```bash
curl -X POST http://localhost:3001/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan@example.com",
    "password": "SecurePass123"
  }'
```

#### Verify Email
```bash
curl -X POST http://localhost:3001/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ivan@example.com",
    "verificationCode": "123456"
  }'
```

#### Change Password
```bash
curl -X PATCH http://localhost:3001/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123",
    "newPassword": "NewSecurePass456"
  }'
```

---

### 👥 Users

#### Get Current User Profile
```bash
curl -X GET http://localhost:3001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Update Current User
```bash
curl -X PATCH http://localhost:3001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+79991234567"
  }'
```

#### Delete Current User
```bash
curl -X DELETE http://localhost:3001/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get All Users (Admin)
```bash
curl -X GET "http://localhost:3001/admin/users?page=1&limit=20&search=john&isActive=true" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Get User By ID (Admin)
```bash
curl -X GET http://localhost:3001/admin/users/5 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Update User Role (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/users/5/role \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "ADMIN"
  }'
```

#### Update User Status (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/users/5/status \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isActive": false
  }'
```

#### Delete User (Admin)
```bash
curl -X DELETE http://localhost:3001/admin/users/5 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---

### 🏢 Complexes

#### Create Complex (Admin)
```bash
curl -X POST http://localhost:3001/admin/complexes \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "title=Люкс Палас" \
  -F "slug=luks-palas" \
  -F "city=Санкт-Петербург" \
  -F "address=улица Пушкина, д. 10" \
  -F "description=Премиум жилой комплекс" \
  -F "priceFrom=5000000" \
  -F "completionDate=2026-12-31" \
  -F "isPublished=true" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg"
```

#### Get All Complexes (Public)
```bash
curl -X GET "http://localhost:3001/complexes?page=1&limit=20&search=люкс"
```

#### Get Complex By Slug (Public)
```bash
curl -X GET http://localhost:3001/complexes/luks-palas
```

#### Get All Complexes (Admin)
```bash
curl -X GET "http://localhost:3001/admin/complexes?page=1&limit=20&isPublished=true" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Get Complex By ID or Slug (Admin)
```bash
curl -X GET http://localhost:3001/admin/complexes/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Update Complex (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/complexes/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "title=Люкс Палас Премиум" \
  -F "description=Обновленное описание" \
  -F "priceFrom=5500000" \
  -F "deletedFileIds=1,2" \
  -F "files=@image3.jpg"
```

#### Update Complex Status (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/complexes/1/status \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

#### Delete Complex (Admin)
```bash
curl -X DELETE http://localhost:3001/admin/complexes/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---

### 🏠 Apartments

#### Create Apartment (Admin)
```bash
curl -X POST http://localhost:3001/admin/apartments \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "complexSlug=luks-palas" \
  -F "entrance=1" \
  -F "number=101" \
  -F "rooms=2" \
  -F "area=75.5" \
  -F "floor=1" \
  -F "price=750000" \
  -F "description=Уютная двухкомнатная квартира" \
  -F "isPublished=true" \
  -F "files=@apt_image1.jpg" \
  -F "files=@apt_image2.jpg"
```

#### Get All Apartments (Public)
```bash
curl -X GET "http://localhost:3001/apartments?page=1&limit=20&rooms=2&minPrice=500000&maxPrice=1000000&floor=1"
```

#### Get Apartment By ID (Public)
```bash
curl -X GET http://localhost:3001/apartments/1
```

#### Get All Apartments (Admin)
```bash
curl -X GET "http://localhost:3001/admin/apartments?page=1&limit=20&isPublished=true&status=AVAILABLE" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Get Apartment By ID (Admin)
```bash
curl -X GET http://localhost:3001/admin/apartments/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Update Apartment (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/apartments/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -F "rooms=3" \
  -F "area=95.5" \
  -F "price=850000" \
  -F "deletedFileIds=1" \
  -F "files=@new_image.jpg"
```

#### Update Apartment Status (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/apartments/1/status \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "isPublished": true
  }'
```

#### Delete Apartment (Admin)
```bash
curl -X DELETE http://localhost:3001/admin/apartments/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---

### ❤️ Favourites

#### Add to Favourites
```bash
curl -X POST http://localhost:3001/favourites \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartmentId": 1
  }'
```

#### Get My Favourites
```bash
curl -X GET "http://localhost:3001/favourites?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Remove from Favourites
```bash
curl -X DELETE http://localhost:3001/favourites/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### 📅 Bookings

#### Create Booking
```bash
curl -X POST http://localhost:3001/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartmentId": 1
  }'
```

#### Get My Bookings
```bash
curl -X GET http://localhost:3001/bookings \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Cancel Booking
```bash
curl -X DELETE http://localhost:3001/bookings/1 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Get All Bookings (Admin)
```bash
curl -X GET "http://localhost:3001/admin/bookings?page=1&limit=20&status=PENDING&userId=5" \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Get Booking By ID (Admin)
```bash
curl -X GET http://localhost:3001/admin/bookings/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

#### Update Booking Status (Admin)
```bash
curl -X PATCH http://localhost:3001/admin/bookings/1/status \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONFIRMED"
  }'
```

#### Delete Booking (Admin)
```bash
curl -X DELETE http://localhost:3001/admin/bookings/1 \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"
```

---
## �📝 Лицензия

UNLICENSED
