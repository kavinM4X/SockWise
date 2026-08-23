# 🧦 SockWise — Stock & Inventory Management System

SockWise is a modern, high-performance full-stack web and mobile POS application designed for retail store inventory management, point-of-sale billing, financial tracking, and business analytics.

---

## 🌐 Live Deployments & Downloads

- ⚡ **Live Web Application**: [https://sock-wise.vercel.app](https://sock-wise.vercel.app)
- ⚙️ **Production API Backend**: [https://sockwise.onrender.com](https://sockwise.onrender.com)
- 📱 **Android App Download**: [Download SockWise APK (Android)](https://bucket.appilix.com/app-apk-d315e4c706be4d749e55f9e1a6df9453-1787502700.apk)

---

## 🌟 Key Features

- **🛒 Point of Sale (POS) & Billing Terminal**:
  - One-tap product search drawer & direct cart addition.
  - Multi-payment support: Cash, UPI, Card, and Credit (Tab).
  - Credit down-payment modal with real-time ledger breakdown.
  - Digital invoice receipt modal with instant cancellation & stock restoration.

- **📦 Inventory & Stock Control**:
  - Real-time stock quantity tracking with automated low-stock alerts.
  - Category and brand organization.
  - Rapid stock adjustment and restock triggers.

- **💰 Expense Management**:
  - Categorized expense logging (Rent, Utilities, Salary, Maintenance, etc.).
  - Payment method tagging and detailed expense logs.

- **📊 Financial Analytics & Reports**:
  - Interactive 6-month financial trend charts (Revenue vs Expenses).
  - Payment method distribution pie charts & category breakdown.
  - One-click **CSV Data Export** and **PDF Report Generation**.

- **👥 Customer Credit Ledger**:
  - Outstanding balance tracking for credit customers.
  - Top customer spending leaderboards.

- **⚡ Performance & Resilience**:
  - Parallelized `Promise.allSettled` queries for rapid load speeds (< 1s).
  - 24-hour CORS preflight caching (`maxAge: 86400`).
  - Gzip / Brotli payload compression middleware.
  - Automated 14-minute self-keep-alive ping scheduler (`*/14 * * * *`) eliminating Render free-tier cold starts.

---

## 🛠️ Tech Stack

### **Frontend**:
- **Framework**: React 18 (Vite)
- **State & Routing**: React Context API, React Router DOM v7
- **Styling**: Custom CSS Design Tokens (Dark & Light Mode, Glassmorphism, Micro-animations)
- **Charts & Icons**: Chart.js, React-Chartjs-2, React Icons (Feather)
- **HTTP Client**: Axios with dynamic environment configuration

### **Backend**:
- **Runtime**: Node.js & Express.js (ES Modules)
- **Database**: MongoDB Atlas (`StockWise` database) with Mongoose ODM
- **Security & Performance**: Helmet.js, Express CORS, Gzip Compression, Express Rate Limit
- **Task Scheduler**: Node-Cron (Automated Keep-Alive Ping & System Health Checks)
- **Documentation**: Swagger UI (`/api/docs`)

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB Atlas** database URI

### 2. Clone Repository
```bash
git clone https://github.com/kavinM4X/SockWise.git
cd SockWise
```

### 3. Install Dependencies
```bash
# Install root, backend, and frontend dependencies
npm run install-all
```

### 4. Environment Variables

Create `.env` in the `server/` directory:
```env
PORT=5001
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

Create `.env` in the `client/` directory:
```env
VITE_API_URL=http://localhost:5001/api
```

### 5. Run Concurrently
```bash
# Launches both server (port 5001) and client (port 5173) simultaneously
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001/api`
- API Health Check: `http://localhost:5001/api/health`

---

## 📜 License

This project is open-source and available under the [ISC License](LICENSE).
