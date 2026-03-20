<div align="center">

# 💸 FinTran

### Personal Finance Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**FinTran** is a fast, secure, and beautifully designed Full-Stack Web Application for managing your personal finances — track expenses, set budgets, achieve savings goals, and more.

[🚀 Getting Started](#-getting-started) · [✨ Features](#-features) · [🛠️ Tech Stack](#%EF%B8%8F-tech-stack) · [🐳 Docker Deployment](#-docker-deployment) · [📡 API Reference](#-api-reference)

---

</div>

## 📖 Project Overview

FinTran is built with a **"Local-First API Sync"** architecture — UI updates happen instantly via browser `localStorage`, while data is simultaneously synced to the backend SQLite database in the background. This means a blazing-fast user experience with full data persistence.

```
User Action → LocalStorage Update (instant UI) → Background API Sync → SQLite Database
```

---

## ✨ Features

### 🔐 Authentication System
- User registration with **password strength indicator**
- Secure login with **JWT token-based** session management
- **Forgot Password** flow via 6-digit OTP sent to real Gmail inbox
- OTP verification and secure password reset

### 📊 Dashboard (`index.html`)
- Total income, expenses, and **net balance** at a glance
- **6-month income vs expense chart** using Chart.js
- Recent transactions overview

### 💳 Transactions (`transactions.html`)
- Full **CRUD operations** for income and expense entries
- Categorized transactions with date and notes
- Filter and search through transaction history

### 📁 Budgets (`budget.html`)
- Set monthly spending limits per category (Food, Transport, etc.)
- Visual **progress bars** showing budget utilization
- Instant alerts when approaching budget limits

### 🎯 Savings Goals (`savings.html`)
- Create savings goals (e.g., New Phone, Vacation, Car)
- Make deposits toward each goal
- Track progress with visual indicators

### 🛡️ Admin Dashboard (`admin.html`)
- **Owner-only** access via special credentials
- View all registered users (name, email, status)
- **Block / Unblock** user accounts instantly

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| HTML5 & CSS3 | UI structure with Glassmorphism, Dark/Light theme, Animations |
| Vanilla JavaScript (ES6+) | API calls, LocalStorage handling, DOM manipulation |
| Chart.js | Income/expense bar and line charts |
| FontAwesome | UI icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | REST API server and routing |
| SQLite3 | File-based persistent database (no separate server needed) |
| JWT | Secure user authentication and session tokens |
| Bcrypt.js | Password hashing before database storage |
| Nodemailer | Sending OTP emails via Gmail for password reset |
| CORS + Dotenv | Cross-origin security and environment variable management |

---

## 📁 Project Structure

```
fintran/
├── backend/
│   ├── server.js              # Express.js entry point
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── transactions.js    # Transaction CRUD routes
│   │   ├── budgets.js         # Budget routes
│   │   ├── savings.js         # Savings goals routes
│   │   └── admin.js           # Admin panel routes
│   ├── middleware/
│   │   └── verifyToken.js     # JWT authentication middleware
│   ├── db/
│   │   └── database.js        # SQLite3 connection & schema init
│   ├── finTran.db             # SQLite database file (auto-created)
│   ├── package.json
│   ├── .env                   # Environment variables (not committed)
│   └── Dockerfile
├── frontend/
│   ├── index.html             # Dashboard
│   ├── transactions.html      # Transactions management
│   ├── budget.html            # Budget tracking
│   ├── savings.html           # Savings goals
│   ├── admin.html             # Admin panel
│   ├── login.html             # Login page
│   ├── register.html          # Registration page
│   ├── css/
│   │   └── styles.css         # Global styles
│   ├── js/
│   │   └── app.js             # Frontend JS logic
│   ├── nginx.conf             # Nginx routing config
│   └── Dockerfile
└── docker-compose.yml         # Multi-container orchestration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- [npm](https://npmjs.com) v9 or higher
- [Git](https://git-scm.com)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fintran.git
cd fintran
```

### 2. Configure Environment Variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

EMAIL_USER=yourapp@gmail.com
EMAIL_PASS=your_gmail_app_password

ADMIN_EMAIL=admin@fintran.lk
ADMIN_PASSWORD=Admin@Secure123

DB_PATH=./finTran.db
```

> ⚠️ **Gmail Setup:** Enable 2-Factor Authentication on your Gmail account, then generate an **App Password** from Google Account Settings and use it as `EMAIL_PASS`.

### 3. Install Dependencies & Run

```bash
# Install backend dependencies
cd backend
npm install

# Start the backend server
npm start
```

Open `frontend/index.html` in your browser or serve it with a local server:

```bash
# Using npx serve (optional)
cd frontend
npx serve .
```

The app will be available at:
- **Frontend:** `http://localhost:3000` (or open `index.html` directly)
- **Backend API:** `http://localhost:5000`

---

## 🐳 Docker Deployment

The easiest way to run FinTran in any environment.

### Quick Start

```bash
# Clone and configure
git clone https://github.com/your-username/fintran.git
cd fintran

# Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Build and launch all containers
docker-compose up --build -d
```

### Access the Application

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:5000 |
| API Health Check | http://localhost:5000/health |
| Admin Panel | http://localhost/admin.html |

### Useful Docker Commands

```bash
# View running containers
docker-compose ps

# Stream backend logs
docker-compose logs -f backend

# Stop all containers
docker-compose down

# Rebuild after code changes
docker-compose up --build -d

# Restart services
docker-compose restart
```

### docker-compose.yml Overview

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    container_name: fintran-backend
    ports:
      - "5000:5000"
    env_file:
      - ./backend/.env
    volumes:
      - ./backend/finTran.db:/app/finTran.db  # Persist database
    restart: unless-stopped

  frontend:
    build: ./frontend
    container_name: fintran-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## 📡 API Reference

All protected endpoints require the header:
```
Authorization: Bearer <JWT_TOKEN>
```

### Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Create a new user account | Public |
| `POST` | `/api/auth/login` | Login and receive JWT token | Public |
| `POST` | `/api/auth/forgot-password` | Send OTP to email | Public |
| `POST` | `/api/auth/verify-otp` | Verify the OTP code | Public |
| `POST` | `/api/auth/reset-password` | Set a new password | Public |

### Transactions

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/transactions` | Get all user transactions | 🔒 |
| `POST` | `/api/transactions` | Add a new transaction | 🔒 |
| `PUT` | `/api/transactions/:id` | Update a transaction | 🔒 |
| `DELETE` | `/api/transactions/:id` | Delete a transaction | 🔒 |
| `GET` | `/api/transactions/summary` | Get 6-month summary for charts | 🔒 |

### Budgets

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/budgets` | Get all budgets | 🔒 |
| `POST` | `/api/budgets` | Create a new budget | 🔒 |
| `PUT` | `/api/budgets/:id` | Update budget amount | 🔒 |
| `DELETE` | `/api/budgets/:id` | Delete a budget | 🔒 |

### Savings Goals

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/savings` | Get all savings goals | 🔒 |
| `POST` | `/api/savings` | Create a new savings goal | 🔒 |
| `POST` | `/api/savings/:id/deposit` | Deposit amount to a goal | 🔒 |
| `DELETE` | `/api/savings/:id` | Delete a savings goal | 🔒 |

### Admin *(Owner only)*

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/users` | List all registered users | 🔒 Owner |
| `PATCH` | `/api/admin/users/:id/block` | Block or unblock a user | 🔒 Owner |
| `DELETE` | `/api/admin/users/:id` | Delete a user account | 🔒 Owner |

---

## 🗄️ Database Schema

FinTran uses **SQLite3** with 6 tables:

```
users              → id, name, email, password, role, blocked
transactions       → id, userId, type, amount, category, date, note
budgets            → id, userId, category, amount, month, year
savings_goals      → id, userId, title, target, saved
savings_deposits   → id, goalId, amount, date
password_resets    → id, email, otp, expiresAt
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Commit** your changes
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. **Push** to your branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Open** a Pull Request

### Commit Convention

| Prefix | Use for |
|---|---|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `docs:` | Documentation updates |
| `style:` | Code formatting |
| `refactor:` | Code restructuring |
| `chore:` | Build / config changes |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by the FinTran Team

⭐ Star this repo if you found it helpful!

</div>
