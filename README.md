# 🛒 Sovely E-Commerce Platform

Welcome to the Sovely E-Commerce repository! This is a full-stack MERN (MongoDB, Express, React, Node.js) application featuring user authentication, product catalog management, a Razorpay payment gateway, order tracking, PDF invoice generation, and a comprehensive Admin Dashboard.

## 🚀 Tech Stack
* **Frontend:** React (Vite), React Router, Lucide Icons, Axios.
* **Backend:** Node.js, Express, Mongoose.
* **Database:** MongoDB Atlas (Cloud).
* **Utilities:** `pdfkit` (Invoices), `qrcode` (UPI generation), `dotenvx` (Env management).

---

## 🛠️ Local Setup & Installation

### 1. Prerequisites
* **Node.js:** v24+ recommended.
* **MongoDB:** A MongoDB Atlas account and cluster URI.
* **Razorpay:** A Razorpay account in **Test Mode** to generate API keys.

### 2. Environment Variables
You will need two `.env` files. Ask the lead developer for the `dotenvx` secrets, or create your own local `.env` files:

**Backend (`sovely-ecommerce/.env`):**
```
PORT=8000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sovely
CORS_ORIGIN=http://localhost:5173
ACCESS_TOKEN_SECRET=your_jwt_secret_here
ACCESS_TOKEN_EXPIRY=1d
RAZORPAY_KEY_ID=rzp_test_your_key_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
```
Frontend (sovely-ecommerce/web-app/.env):
```
Code Snippet:
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_here
```

### 3. Install Dependencies

Open your terminal and install packages for both environments:
```
# Install backend dependencies
cd sovely-ecommerce
npm install

# Install frontend dependencies
cd web-app
npm install
```
### 4. Seed the Database (Crucial Step!)

If you are connecting to a fresh MongoDB Atlas database, the products screen will be blank. You must import the catalog from the reference CSV file.
```
# From the root backend folder:
node importCsv.js
```
Wait for the terminal to confirm that all 800+ products have been saved.
### 5. Start the Development Servers

You will need two terminal windows running simultaneously.
```
Terminal 1 (Backend):
Bash

cd sovely-ecommerce
npm run dev
# Expected output: "Server is running at port 8000..."

Terminal 2 (Frontend):
Bash

cd sovely-ecommerce/web-app
npm run dev
# Expected output: "Vite server running at http://localhost:5173"
```
## 🗺️ Navigation & Key Routes

    Customer Storefront: http://localhost:5173

    Admin Dashboard: http://localhost:5173/admin

    Backend API Base: http://localhost:8000/api/v1

## 🛠️ Common Local Setup Errors & Troubleshooting

If the app crashes or the frontend fails to load, check these common local setup issues:

* **Backend Crash (`querySrv ENOTFOUND`):** If your Node server crashes immediately with a MongoDB error, your `MONGODB_URI` in the backend `.env` file is likely still using the placeholder `<username>:<password>` or cluster string. Replace it with your actual Atlas connection string.
* **Terminal says `injecting env (0)`:** This means your backend server is not reading your environment variables. Ensure your backend file is named exactly `.env` (not `.env.example`) and is located in the root `sovely-ecommerce` folder.
* **Frontend Red Screen (`AxiosError: Network Error`):** This is a CORS and routing failure. To fix this, you must have two things:
  1. **Frontend:** Your `web-app/.env` must contain `VITE_API_BASE_URL=http://localhost:8000/api/v1`.
  2. **Backend:** Your root `.env` must contain `CORS_ORIGIN=http://localhost:5173`.
  *(Note: If you add or modify these files, you must restart both your frontend and backend servers for the changes to take effect!)*

## ⚠️ Important Developer Notes (Demo Hacks to Fix)

To facilitate a seamless demonstration, a few security protocols were temporarily bypassed. DO NOT push this to production without fixing the following:

    Admin Routes are Unprotected: Currently, the GET /admin/all and PUT /admin/:id routes in order.routes.js, product.routes.js, and user.routes.js do not have the authorize('ADMIN') middleware applied. Any logged-in user can access them.

    Razorpay Localhost Bypass: If Razorpay is blocking localhost checkout testing, check Checkout.jsx. There is a commented-out "Developer Bypass" that fakes a successful payment ping to the backend.

    Cart Bypassed for Direct Checkout: The placeOrder controller currently accepts items directly from the request body rather than strictly enforcing a pre-existing MongoDB Cart document.
