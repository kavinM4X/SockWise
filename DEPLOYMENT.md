# SockWise Deployment Guide

This guide covers deploying the SockWise application to production using Vercel (Frontend), Render (Backend), and MongoDB Atlas (Database).

---

## 1. MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Under "Database Access", create a new database user (keep the password secure).
3. Under "Network Access", add `0.0.0.0/0` (Allow access from anywhere) so the backend can connect.
4. Click "Connect", choose "Connect your application", and copy the connection string.
5. Replace `<password>` with your database user's password.
   - Example: `mongodb+srv://admin:mySecurePass123@cluster0.mongodb.net/sockwise?retryWrites=true&w=majority`

---

## 2. Render (Backend Deployment)

1. Push your repository to GitHub.
2. Create an account on [Render](https://render.com/).
3. Click "New" -> "Web Service".
4. Connect your GitHub repository.
5. Configuration:
   - **Name**: `sockwise-api`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Click "Advanced" and add the following Environment Variables:
   - `PORT`: `5001`
   - `MONGO_URI`: `(Paste your MongoDB connection string here)`
   - `JWT_SECRET`: `(Generate a random strong secret key)`
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: `(You will update this later after deploying to Vercel)`
7. Click "Create Web Service".
8. Once deployed, copy the Render URL (e.g., `https://sockwise-api.onrender.com`).
9. Verify by opening: `https://sockwise-api.onrender.com/api/health`

---

## 3. Vercel (Frontend Deployment)

1. Create an account on [Vercel](https://vercel.com/).
2. Click "Add New" -> "Project" and import your GitHub repository.
3. Configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand "Environment Variables" and add:
   - `VITE_API_URL`: `(Paste your Render URL here, e.g., https://sockwise-api.onrender.com/api)`
5. Click "Deploy".
6. Once deployed, copy the Vercel Domain (e.g., `https://sockwise.vercel.app`).

---

## 4. Final Security Check

1. Go back to Render -> `sockwise-api` -> Environment.
2. Update the `FRONTEND_URL` variable to your Vercel URL (e.g., `https://sockwise.vercel.app`). This enforces CORS security.
3. Save changes. Render will automatically redeploy the backend with the new environment variable.

You're done! SockWise is now live in production.
