# Notinix - AI Second Brain

Notinix is an AI-powered note management platform designed to centralize your knowledge, automate workflows, and visualize connections between your ideas.

![Notinix Logo](client/public/logo.png)

## Features

-   **AI-Powered Notes**: Auto-tagging, summarization, and connection discovery.
-   **Knowledge Graph**: Interactive 2D/3D visualization of your note connections in a star-constellation style.
-   **Intelligent Editor**: Markdown support, slash commands, and AI text completion/brainstorming.
-   **Tasks & Calendar**: Integrated task management with calendar view and reminders.
-   **Automations**: Create "If This Then That" workflows for your notes (e.g., "When note created -> Auto-summarize").
-   **RAG Chat**: Chat with your notes using an AI assistant.

## Tech Stack

-   **Frontend**: React (Vite), TailwindCSS, Three.js (Graph), Framer Motion.
-   **Backend**: Node.js, Express, MongoDB.
-   **AI**: Groq API (LLM), Vector Storage.

## Getting Started

### Prerequisites

-   Node.js (v16+)
-   MongoDB (Local or Atlas)
-   Groq API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/notinix.git
    cd notinix
    ```

2.  **Server Setup**
    ```bash
    cd server
    npm install
    # Create .env file with:
    # PORT=5000
    # MONGODB_URI=mongodb://localhost:27017/notinix
    # GROQ_API_KEY=your_key_here
    npm run dev
    ```

3.  **Client Setup**
    ```bash
    cd client
    npm install
    npm run dev
    ```

4.  **Access App**
    Open `http://localhost:5173` in your browser.

## Project Structure

-   `/client`: React frontend application.
-   `/server`: Express backend API and background services.
-   `render.yaml`: Render deployment blueprint.

## Deploy to Render

### Option 1: Blueprint Deploy (Recommended)

1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click **New** → **Blueprint**
4. Connect your GitHub repo
5. Render will detect `render.yaml` and create services
6. Add environment variables in Render dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `GROQ_API_KEY`: Your Groq API key

### Option 2: Manual Deploy

**Backend API:**
1. Create new **Web Service** on Render
2. Connect GitHub repo
3. Settings:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Add environment variables (see above)

**Frontend:**
1. Create new **Static Site** on Render
2. Connect GitHub repo
3. Settings:
   - Build Command: `cd client && npm install && npm run build`
   - Publish Directory: `client/dist`
   - Add env: `VITE_API_URL=https://your-api-name.onrender.com/api`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT tokens |
| `GROQ_API_KEY` | Groq API key for AI features |

## License

MIT

