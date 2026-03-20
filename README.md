<div align="center">
  <h1>💸 FinTran - Personal Finance Management System</h1>

  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white"/>
  <img alt="AWS" src="https://img.shields.io/badge/AWS-%23FF9900.svg?style=for-the-badge&logo=amazon-aws&logoColor=white"/>
  <img alt="MySQL" src="https://img.shields.io/badge/mysql-4479A1.svg?style=for-the-badge&logo=mysql&logoColor=white"/>
  <img alt="Docker" src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white"/>
</div>

FinTran is a multi-tier Personal Finance Management application built with a Vanilla JavaScript frontend and a robust Node.js/Express backend. Deployed on **AWS Cloud** using a decoupled service architecture, it offers users secure tracking of incomes, expenses, budgets, and savings goals.

---

## ✨ Key Features

- **Full Financial Dashboard:** Real-time visibility into income, expenses, and savings goals.
- **User Authentication:** Highly secure login and registration utilizing **JWT** and **Bcrypt**.
- **Secure Password Reset:** Automated OTP emails via **AWS SES (Simple Email Service)**.
- **Admin Dashboard:** Exclusive administrative portal allowing system overview and account user management.
- **Decoupled Cloud Architecture:** Separately hosted Frontend & Backend inside **Docker** containers, with datastore shifted from SQLite to **Amazon RDS (MySQL)**.
- **Robust Routing:** Managed API networking and reverse proxy paths using **Nginx**.
- **CI/CD Pipeline:** Fully automated deployments to an **Amazon EC2** Linux instance via **GitHub Actions**.

---

## 🛠 Tech Stack

**Frontend:** HTML5, CSS3, Vanilla JavaScript  
**Backend:** Node.js, Express.js  
**Database:** AWS RDS (MySQL 8)  
**Cloud & DevOps:**
- Amazon EC2 (Hosting Compute Layer)
- AWS VPC & Security Groups (Network Isolation)
- AWS SES (Mailing API)
- ALB / CloudWatch (Availability & Monitoring)
- Docker & Docker Compose (Containerization)
- GitHub Actions (CI/CD Automations)

---

## 🏗 System Architecture

```mermaid
graph TD;
    User([End User / Browser]) -->|HTTPS Request| ALB[AWS ALB]
    ALB --> Nginx(Nginx Reverse Proxy Container)
    
    subgraph Amazon EC2 Instance
      Nginx -->|/ (Static Files)| Frontend(Frontend Container)
      Nginx -->|/api/* (Proxy Pass)| Backend(Node.js Backend API Container)
    end
    
    Backend -->|MySQL Connection| RDS[(Amazon RDS MySQL)]
    Backend -->|SMTP / API| SES(AWS Simple Email Service)
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) and Docker Compose installed.
- MySQL Database accessibility.
- AWS Account with SES configured (Optional, strictly for email flows).

### 2. Clone the Repository
```bash
git clone https://github.com/Asirindusamod99/FinTran.git
cd FinTran
```

### 3. Environment Variables
Create a `.env` file inside the `backend/` directory based on what is active:
```env
# Server Configuration
PORT=3000

# Database (AWS RDS or Local Machine)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASS=password123
DB_NAME=fintran_db

# Security
JWT_SECRET=your_super_secret_jwt_key

# AWS SES credentials (If forgot password flow needed)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SENDER_EMAIL=noreply@fintran.lk
```

### 4. Run the Application
The standard way to build both the frontend asset reverse-proxy and the backend API is with Docker Compose:
```bash
docker compose up --build -d
```
- **Application Live GUI:** [http://localhost:8080](http://localhost:8080)
- **Backend API Layer:** [http://localhost:3000](http://localhost:3000)

---

## 👨‍💻 Author
**Asirindu Samod** - *Cloud & DevOps Enthusiast, Full-Stack Developer*  
[GitHub](https://github.com/Asirindusamod99)
