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


## Security Notes

The sandbox is a secure MVP-level executor:

- controlled child process
- timeout and output limits
- temp-file cleanup
- rate limiting

For enterprise-grade isolation, use containerized execution workers (Docker/microVM).

## License

This project is currently private / internal unless you add a specific license file.
