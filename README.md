# <img src="public/images/sovely-image.png" width="40" align="top">  Sovely B2B E-Commerce Platform

Welcome to the Sovely E-Commerce repository. This is a robust, production-ready MERN (MongoDB, Express, React, Node.js) application designed for B2B wholesale commerce. It features professional-grade authentication, automated product catalog management, a seamless wallet/payment system, and an advanced reseller analytics suite.

## 🚀 Core Features
*   **Wholesale Catalog**: Grid/List views with advanced filtering for bulk buyers.
*   **Smart Wallet**: Integrated wallet system with Razorpay topping for seamless transactions.
*   **Bulk Management**: CSV-based product importing and bulk-order validation.
*   **Reseller Tools**: Personalized dashboards, order tracking, and dynamic PDF invoice generation.
*   **Admin Shield**: Comprehensive role-based access control (RBAC) and data management.

---

## 🛠️ Local Setup & Installation

### 1. Prerequisites
*   **Node.js**: v20.11.0+ (LTS recommended)
*   **MongoDB**: An Atlas Cluster URI with read/write permissions.
*   **Razorpay**: API credentials in Test Mode for transaction handling.

### 2. Configure Environment
Create a `.env` file in the root directory and `web-app/` directory based on the `.env.example` templates provided.

**Backend (`/.env`):**
```env
PORT=8000
MONGODB_URI=your_atlas_connection_string
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_EXPIRY=1d
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Install & Start

Execute the following in your terminal:

```bash
# 1. Install Backend Dependencies
npm install

# 2. Install Frontend Dependencies
cd web-app && npm install && cd ..

# 3. Seed Initial Data (Products & Categories)
npm run seed

# 4. Launch Development Environment
# Starts Backend on 8000 and Frontend on 5173
npm run dev
```

---

## 📂 Project Organization

- `src/`: Backend source logic (Models, Controllers, Routes, Middlewares).
- `web-app/`: React (Vite) frontend application.
- `scripts/`: Essential utilities for database seeding and product imports.
- `data/`: Reference datasets and CSV samples for bulk operations.
- `public/`: Static assets including optimized product images and user avatars.

---

## 👨‍💻 Maintained Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Spins up the full development stack. |
| `npm run seed` | POPULATES the database with production-ready sample data. |
| `npm run import:csv` | Manually TRIGGERS a mass bulk product import. |
| `npm run format` | ENFORCES consistent code styling via Prettier. |

---
*© 2026 Sovely E-Commerce Systems. Built for Scale.*
