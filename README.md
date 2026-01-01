# HUSU - Human Sustainability Platform

<div align="center" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
  <img src="public/husu.png" width="200" height="200" alt="HUSU Logo"/>
</div>


## 🚀 Mission Overview
**HUSU (Human Sustainability Platform)** is a next-generation MERN ecosystem built to measure, analyze, and improve human sustainability in organizations. Security-first, encrypted, AI-assisted, and built for scale.

---

## 🛠 Strategic Tech Stack

### ⚙️ Frameworks & UI
![Next.js](https://img.shields.io/badge/Next.js-Framework-black?logo=next.js)
![React](https://img.shields.io/badge/React-Library-black?logo=react)

### 🧠 Database
![MongoDB](https://img.shields.io/badge/MongoDB-Database-black?logo=mongodb)

### ☁️ Storage
![Cloudflare R2](https://img.shields.io/badge/Cloudflare%20R2-Storage-black?logo=cloudflare)

### 🔐 Authentication
![2FA Speakeasy](https://img.shields.io/badge/2FA-Speakeasy-black?logo=key)

### 🐳 Containerization
![Docker](https://img.shields.io/badge/Docker-Container-black?logo=docker)

### 🚀 Hosting
![Render](https://img.shields.io/badge/Render-Deployment-black?logo=render)

---

## ⚡ Deployment Instructions

### 1. Initialize Clone
```bash
git clone https://github.com/yogeshjha06/husu-app.git
cd husu-app
````

### 2. Configure Environment

Create `.env.local`:

```bash
DATABASE_URL=your_mongodb_uri
# (Additional mission-critical secrets)
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Launch Local Terminal

```bash
npm run dev
```

Open `http://localhost:3000` to access Mission Control.

---

## 🐳 Containerized Deployment (Docker)

### 1. Build Image

```bash
docker build -t husu-app .
```

### 2. Run Container

```bash
docker run -p 3000:3000 --env-file .env.local husu-app
```

---

## 🔐 Tactical Features

* **2FA Fortification** for all accounts
* **Real-time Analytics & KPI tracking**
* **Admin & Employee portals**
* **Encrypted document storage**
* **AI-assisted research terminal**

---

## 👨‍💻 Architect

Built by **Yogesh Jha**

---

*© 2026 HUSU — Designed for mission-critical human sustainability.*
