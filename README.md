# Real-time Multiplayer Tic Tac Toe

A real-time multiplayer Tic Tac Toe game built using React (Vite), Express, and Socket.IO.

## Features
- Real-time gameplay with synchronized turns.
- In-game room chat.
- Room creation and joining.
- Game status tracking (turn indicators, winner announcements, draw states).
- Premium responsive styling.

---

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server (Dev Mode)
```bash
npm run server:dev
```
The server runs on `http://localhost:5000`.

### 3. Start the Frontend Client (Dev Mode)
```bash
npm run client
```
The client runs on `http://localhost:3000`.

---

## Production & Deployment Setup

We have configured the application as a **unified fullstack app** where the Node/Express server serves both the Socket.IO server and the compiled React frontend client.

### Testing the Production Build Locally

1. **Build the frontend:**
   ```bash
   npm run build
   ```
   This compiles the React code and generates the production static assets in the `dist` directory.

2. **Start the production server:**
   ```bash
   npm start
   ```
   This runs `node server.js`, which serves the backend socket connection and hosts the static files.

3. **Visit the app:**
   Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## Deploying to the Cloud

Since the app is unified, you can deploy it to any cloud hosting provider supporting Node.js (such as **Render**, **Railway**, **Fly.io**, or **Heroku**) as a single Web Service.

### Option A: Deploy to Render (Recommended & Free)

1. Create a free account on [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository (`Thidas03/Tic-Tac-Toe-Game`).
4. Configure the service settings:
   - **Name:** `tic-tac-toe-multiplayer` (or any custom name)
   - **Environment / Runtime:** `Node`
   - **Region:** Choose a region close to your target players.
   - **Branch:** `main`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add the following **Environment Variables** in the "Environment" tab:
   - `NODE_ENV` = `production`
6. Click **Deploy Web Service**. Render will automatically build the React assets and spin up the Node.js server. Your game will be live at the provided `.onrender.com` URL!

---

### Option B: Deploy to Railway

1. Create a free account on [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Choose your repository.
4. Railway will automatically detect the `package.json` file.
5. In the variables configuration, add:
   - `NODE_ENV` = `production`
6. Railway will run the build and start commands automatically. Once the build finishes, generate a domain in the settings tab to access your deployed app.
