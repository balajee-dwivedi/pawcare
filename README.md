# PawCare

A full-stack neighborhood network for stray animal rescue, lost-and-found reporting, shelter discovery, and pet adoption. Built with the MERN stack, Mapbox GL JS, and local ONNX computer-vision photo verification.

**Live Demo:** [https://pawcare-ch3x.onrender.com](https://pawcare-ch3x.onrender.com)

## Core Features

- **Stray Rescue Reporting & Live Map:** Interactive Mapbox GL JS map with click-to-drop coordinates, priority tagging, real-time rescue status updates, and volunteer assignment.
- **Automated AI Photo Verification:** Server-side image pipeline (`sharp` + `@huggingface/transformers` running `Xenova/resnet-50`) using Laplacian blur detection and species classification to filter out blurry images and non-animal uploads before reports enter the queue.
- **Lost & Found Board:** Community-reported missing and found animals with location pins, photo attachments, and status tracking.
- **Adoption & Shelter Directory:** Browse verified adoption listings and local animal shelters, submit adoption applications, and manage shelter records.
- **Role-Based Access Control & Email Flows:** JWT authentication with 6-digit email OTP verification, SHA-256 expiring password reset links via Brevo's HTTPS transactional email API, rate-limited endpoints, and dedicated dashboards for regular users, volunteers, shelters, and admins.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Mapbox GL JS
- **Backend:** Node.js, Express, Mongoose, Multer
- **Database:** MongoDB / MongoDB Atlas
- **AI & Media Processing:** `@huggingface/transformers` (ResNet-50 ONNX), `sharp`
- **Email & Security:** Brevo Transactional Email API, JWT, `bcryptjs`, `express-validator`, `express-rate-limit`
- **Deployment:** Multi-stage Docker build hosted on Render (serving compiled Vite assets from Express)

## Project Structure

```text
├── backend/
│   ├── controllers/      # Route handlers for auth, verification, reports, adoptions, shelters & admin
│   ├── models/           # Mongoose schemas (User, AnimalReport, Adoption, LostFound, Shelter, Volunteer)
│   ├── routes/           # Express REST API endpoints & rate limiters
│   ├── auth.js           # JWT authentication & role/verification guards
│   ├── mailer.js         # Brevo HTTPS API client for OTP & password reset emails
│   ├── imageCheck.js     # Laplacian blur detection & ResNet-50 species classification
│   ├── emailCheck.js     # Email domain validation
│   ├── app.js            # Express app setup, trust proxy & production static file serving
│   └── index.js          # Server entry point & background model warmup
├── frontend/
│   └── src/              # React pages, Mapbox components, auth flows & API client
└── Dockerfile            # Multi-stage production container build
```

## Local Setup

### 1. Prerequisites

- Node.js 20+
- MongoDB (local instance or MongoDB Atlas URI)
- Mapbox public access token (`VITE_MAPBOX_TOKEN`)
- Brevo API key (`BREVO_API_KEY`) and verified sender email (`MAIL_FROM`)

### 2. Configure Environment Variables

Create `backend/.env` and `frontend/.env`:

**`backend/.env`**

```env
NODE_ENV=development
API_PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/pawcare
PAWCARE_JWT_SECRET=your_random_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
CLIENT_ORIGIN=http://localhost:3000
BREVO_API_KEY=xkeysib-your_brevo_api_key
MAIL_FROM=your_verified_sender@example.com
```

**`frontend/.env`**

```env
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token
```

### 3. Install & Run

```bash
# Start backend API (port 3001)
cd backend
npm install
node index.js

# In a separate terminal, start frontend dev server (port 3000)
cd frontend
npm install
npm run dev
```

## Docker Deployment

The root `Dockerfile` builds the Vite frontend and bundles it into the Express server on port `3000` (or Render's `PORT`):

```bash
docker build --build-arg VITE_MAPBOX_TOKEN=pk.your_token -t pawcare .
docker run -p 3000:3000 --env-file backend/.env -e NODE_ENV=production pawcare
```