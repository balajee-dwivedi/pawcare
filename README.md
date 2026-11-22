
# PawCare

A full-stack neighborhood network for stray animal rescue, lost-and-found reporting, shelter discovery, and pet adoption. Built with the MERN stack, Mapbox GL JS, and local ONNX computer-vision photo verification.

## Core Features

- **Stray Rescue Reporting & Live Map:** Interactive Mapbox map with click-to-drop coordinates, priority tagging, real-time rescue status updates, and volunteer assignment.
- **Automated AI Photo Verification:** Server-side image pipeline (`sharp` + `@huggingface/transformers` running `Xenova/resnet-50`) that filters out blurry images and non-animal uploads before listings or reports enter the queue.
- **Lost & Found Board:** Community-reported missing and found animals with location pins, photo attachments, and status tracking.
- **Adoption & Shelter Directory:** Browse verified adoption listings and local animal shelters, submit adoption applications, and manage shelter records.
- **Role-Based Access Control & Email Flows:** JWT authentication with email OTP verification, password reset links via SMTP, and dedicated dashboards for regular users, volunteers, and admins.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Mapbox GL JS
- **Backend:** Node.js, Express, Mongoose, Multer
- **Database:** MongoDB / MongoDB Atlas
- **AI & Media Processing:** `@huggingface/transformers` (ResNet-50), `sharp`
- **Deployment:** Multi-stage Docker build (serving compiled Vite assets from Express)

## Project Structure

```text
├── backend/
│   ├── controllers/      # Route handlers for auth, reports, adoptions, shelters & admin
│   ├── middleware/       # JWT auth guards & AI photo validation middleware
│   ├── models/           # Mongoose schemas (User, AnimalReport, Adoption, LostFound, Shelter, Volunteer)
│   ├── routes/           # Express REST API endpoints
│   ├── imageCheck.js     # Laplacian blur detection & ResNet-50 species classification
│   ├── app.js            # Express app setup & production static file serving
│   └── index.js          # Server entry point & background model warmup
├── frontend/
│   └── src/              # React pages, Mapbox components & API client
└── Dockerfile            # Multi-stage production container build

```

## Local Setup

### 1. Prerequisites

* Node.js 20+
* MongoDB (local instance or MongoDB Atlas URI)
* Mapbox public access token (`VITE_MAPBOX_TOKEN`)

### 2. Configure Environment Variables

Create `backend/.env` and `frontend/.env` based on `backend/.env.example`:

**`backend/.env`**

```env
NODE_ENV=development
API_PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/pawcare
PAWCARE_JWT_SECRET=your_random_jwt_secret
FRONTEND_URL=http://localhost:3000
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
MAIL_FROM="PawCare <noreply@example.com>"

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

The root `Dockerfile` builds the Vite frontend and bundles it into the Express server on port `3000`:

```bash
docker build --build-arg VITE_MAPBOX_TOKEN=pk.your_token -t pawcare .
docker run -p 3000:3000 --env-file backend/.env -e NODE_ENV=production pawcare

```

```

### Push It to GitHub
Paste the block above into `D:\PawCare Final\README.md`, save it, and run:
```bash
git add README.md
git commit -m "Add project README"
git push

```