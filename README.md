# Renzo AI

A full-stack AI chat platform with authentication, real-time streaming responses, collaboration (shared chats + invitations), and an in-app JavaScript sandbox execution module.

## What This Project Includes

- Email/password authentication with OTP verification
- Google OAuth login
- JWT-based auth with secure cookies (+ bearer fallback)
- Real-time AI response streaming with Socket.IO
- Chat collaboration:
  - invite collaborators (read / write)
  - inbox accept/reject invitations
  - shared chat visibility and permission-aware behavior
- Markdown + code-highlighted AI responses
- File/image attachments in prompts
- Secure JavaScript sandbox executor (timeout, output limits, cleanup, rate limit)
- Responsive UI with modularized chat dashboard architecture

## Tech Stack

### Frontend

- React (Vite)
- Tailwind CSS
- Socket.IO client
- Axios
- React Markdown + Rehype Highlight
- Monaco Editor
- React Hot Toast

### Backend

- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT + cookie-parser
- Google Generative AI SDK (Gemini)
- Google Auth Library
- Brevo (transactional email)

## Project Structure

- `client/` - React frontend
- `server/` - Express + Socket.IO backend

## Core Architecture (High Level)

1. Frontend sends auth/chat requests to REST API.
2. Frontend uses Socket.IO for real-time chat events and AI chunks.
3. Backend validates JWT (cookie or bearer token), authorizes access, and stores chats/messages in MongoDB.
4. AI responses stream from backend to client via socket events.
5. Sandbox execution runs submitted JS in controlled child-process flow and returns stdout/stderr.

## Main Features

### 1) Authentication

- Register -> OTP verify -> login
- Forgot/reset password using OTP email flow
- Google OAuth login

### 2) Chat + AI

- Create and continue chats
- Real-time streamed AI output (chunked)
- Message history persistence
- Rich markdown/code rendering

### 3) Collaboration

- Chat owner can invite collaborators
- Permission model: owner / write / read
- Invite inbox with accept/reject
- Shared chat listing and sync updates

### 4) Sandbox (Secure JS Execution)

- Run JavaScript from in-app editor
- Timeout kill switch
- Output size cap
- Temporary file cleanup
- Per-user execution quota/rate limiting

## Environment Variables

## Frontend (`client`)

Create `client/.env`:

```dotenv
VITE_BACKEND_URL=http://localhost:5000/api/users
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

## Backend (`server`)

Create `server/.env`:

```dotenv
PORT=5000
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string

CLIENT_URL=http://localhost:5173
# Optional (comma-separated additional frontend origins)
CLIENT_URLS=http://localhost:5174

ACCESS_TOKEN_SECRET=your_access_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=7d

GOOGLE_CLIENT_ID=your_google_oauth_client_id

GEMINI_API_KEY=your_gemini_api_key
# Optional
GEMINI_MODEL=gemini-1.5-flash-latest

BREVO_API_KEY=your_brevo_api_key
SMTP_EMAIL=your_verified_sender_email

# Optional (if cloud uploads are used)
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

## Local Development

Install dependencies:

```bash
cd server
npm install

cd ../client
npm install
```

Start backend:

```bash
cd server
npm run dev
```

Start frontend:

```bash
cd client
npm run dev
```

Build frontend:

```bash
cd client
npm run build
```

## API Overview

### Auth (`/api/users`)

- `POST /register`
- `POST /verify-otp`
- `POST /login`
- `POST /google-login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /logout` (auth required)

### Chat + Collaboration (`/api/v1/chats`) (auth required)

- `POST /` create chat
- `GET /` list owned chats
- `GET /shared` list shared chats
- `POST /send` send message (HTTP response mode)
- `POST /execute` sandbox JS execution
- `GET /:chatId` get chat messages
- `POST /:chatId/invitations` invite collaborator
- `GET /invitations/inbox` inbox invites
- `POST /invitations/:inviteId/respond` accept/reject invite
- `GET /:chatId/collaborators` list collaborators

## Deployment

### Recommended

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

### Deploy Backend (Render)

- Root: `server`
- Build command: `npm install`
- Start command: `npm start`
- Add all backend env vars from section above
- Set `CLIENT_URL` exactly to your frontend origin (with `https://` and no trailing slash)

### Deploy Frontend (Vercel)

- Root: `client`
- Build command: `npm run build`
- Output: `dist`
- Add frontend env vars from section above
- Ensure SPA rewrite exists in `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Google OAuth Setup

In Google Cloud Console (OAuth client):

- Add authorized JavaScript origins:
  - local (`http://localhost:5173`, `http://localhost:5174`)
  - production frontend origin (e.g. `https://your-frontend.vercel.app`)

Use the same client ID in:

- `VITE_GOOGLE_CLIENT_ID` (frontend)
- `GOOGLE_CLIENT_ID` (backend)

## Troubleshooting

### 1) Login CORS blocked

- Verify backend `CLIENT_URL` includes protocol (`https://...`)
- Redeploy backend after env changes
- Confirm preflight (`OPTIONS`) succeeds

### 2) Refresh on `/login` or `/chat` returns 404 (Vercel)

- Ensure SPA rewrite exists in `client/vercel.json`
- Redeploy frontend

### 3) Prompts not responding in production

- Verify `GEMINI_API_KEY` and model availability
- Check backend logs for 429/403/404 Gemini errors
- Ensure socket auth is valid (cookie and/or bearer token path)

### 4) Google login fails

- Ensure production domain is added to OAuth authorized origins
- Ensure client and server use matching Google client ID

## Security Notes

The sandbox is a secure MVP-level executor:

- controlled child process
- timeout and output limits
- temp-file cleanup
- rate limiting

For enterprise-grade isolation, use containerized execution workers (Docker/microVM).

## License

This project is currently private / internal unless you add a specific license file.
