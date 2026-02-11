# Deployment Guide for Render.com

This guide explains how to deploy the DIY Home Repair backend to Render.com and connect it with MongoDB Atlas.

## 1. Prerequisites
- GitHub Account
- [Render.com](https://render.com) Account
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account

## 2. Set up MongoDB Atlas (Database)
1.  Create a free cluster on MongoDB Atlas.
2.  Go to **Database Access** -> create a user (e.g., `diy_user`). Save the password.
3.  Go to **Network Access** -> Add IP Address -> `0.0.0.0/0` (Allow from anywhere).
4.  Go to **Connect** -> **Drivers** -> Copy the Connection String.
    -   Example: `mongodb+srv://diy_user:<password>@cluster0.abcd.mongodb.net/?retryWrites=true&w=majority`

## 3. Deploy Backend to Render
1.  Log in to Render and click **New +** -> **Web Service**.
2.  Connect your GitHub repo (`DIY-App-V2`).
3.  **Settings**:
    -   **Name**: `diy-home-repair-backend`
    -   **Root Directory**: `backend` (Important!)
    -   **Runtime**: `Python 3`
    -   **Build Command**: `pip install -r requirements.txt`
    -   **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
    -   **Instance Type**: Free

4.  **Environment Variables** (Add these):
    -   `PYTHON_VERSION`: `3.11.9`
    -   `MONGO_URL`: (Paste your MongoDB connection string from step 2)
    -   `DB_NAME`: `diy_home_repair`
    -   `GOOGLE_API_KEY`: (Your Google Gemini API Key)

5.  Click **Create Web Service**.

## 4. Verify Deployment
Once deployed, Render provides a URL (e.g., `https://diy-home-repair-backend.onrender.com`).
-   Visit `https://<your-url>/` in a browser.
-   You should see: `{"status": "ok", "message": "Backend is running"}`.

## 5. Connect Frontend
1.  On your local machine, open `frontend/.env`.
2.  Update `EXPO_PUBLIC_BACKEND_URL`:
    ```bash
    EXPO_PUBLIC_BACKEND_URL=https://diy-home-repair-backend.onrender.com
    ```
3.  Rebuild your iOS app using `npx expo prebuild --platform ios --clean` and Xcode.
