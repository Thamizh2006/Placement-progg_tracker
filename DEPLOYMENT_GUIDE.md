# Deployment Guide

## Recommended setup

- Frontend: Netlify
- Backend: Render
- Database: MongoDB Atlas

Netlify can host your React frontend, but it cannot run `backend/server.js` as a normal long-running Express server. For this project, the clean deployment path is:

1. Deploy the backend to Render.
2. Deploy the frontend to Netlify.
3. Connect both using environment variables.

## 1. Secure your secrets first

If your MongoDB URI, JWT secrets, or email password were shared in code, chat, screenshots, or committed to git, treat them as exposed.

- Create a new MongoDB Atlas database password.
- Create new `JWT_SECRET` and `JWT_REFRESH` values.
- Create a new email app password if you use Gmail.
- Keep the real values only in hosting environment variables.
- Use [.env.example](c:/Users/mutha/OneDrive/Desktop/authentication/.env.example) as the template, not your real `.env`.

## 2. MongoDB Atlas

- Create or open your Atlas cluster.
- Create a database user with a new password.
- In Network Access, allow your backend host to connect.
  For quick testing, `0.0.0.0/0` works, but tighten it later if possible.
- Copy the connection string and save it for Render as `MONGO_URI`.

Example format:

```text
mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
```

## 3. Backend on Render

- Push the repo to GitHub.
- In Render, create a new Web Service from the repo.
- Use these settings:
  - Root Directory: leave blank
  - Build Command: `npm install`
  - Start Command: `npm start`
- You can also deploy with [render.yaml](c:/Users/mutha/OneDrive/Desktop/authentication/render.yaml).

### Render environment variables

Set these in the Render dashboard:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_REFRESH`
- `EMAIL`
- `EMAIL_PASSWORD`
- `FRONTEND_URL`
  Set this to your Netlify URL, for example `https://your-site.netlify.app`
- `ALLOWED_ORIGINS`
  Use the same Netlify URL, or multiple URLs separated by commas
- `APP_URL`
  Set this to your Render backend URL
- `PORT`
  Optional on Render, because Render usually provides this automatically

### Backend test

After deployment, open:

```text
https://your-render-service.onrender.com/api/health
```

You should get a JSON response showing the API is up.

## 4. Frontend on Netlify

This repo already has a usable [netlify.toml](c:/Users/mutha/OneDrive/Desktop/authentication/netlify.toml) for the frontend build.

- Import the GitHub repo into Netlify.
- Use these build settings:
  - Base directory: `frontend`
  - Build command: `npm run build`
  - Publish directory: `dist`

### Netlify environment variables

- `VITE_API_BASE_URL=https://your-render-service.onrender.com/api`

After adding the variable, trigger a new deploy so the frontend rebuilds with the correct API URL.

## 5. Final wiring check

- Open the Netlify site.
- Open DevTools and try logging in.
- Confirm requests go to your Render URL, not `localhost`.
- If login fails with CORS, re-check `FRONTEND_URL` and `ALLOWED_ORIGINS` on Render.

## 6. Important note

This project is not currently set up to run the backend directly on Netlify Functions. If you want everything on Netlify, the backend would need a serverless conversion first.
