# Curova — Doctor Appointment Booking System

Curova is a premium healthcare platform built with React, Node.js, and Supabase. It features real-time appointments, AI-powered lab analysis, medical history tracking, secure 2FA, and an integrated payment system.

## 🚀 Live Demo
- **Frontend:** [Netlify URL Placeholder]
- **Backend:** [Render URL Placeholder]

## 🛠 Tech Stack
- **Frontend:** React, Tailwind CSS, Vite, Lucide Icons, Framer Motion
- **Backend:** Node.js, Express, PDFKit (Invoicing/Prescriptions), Nodemailer
- **Database:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI:** Google Gemini 2.0 (Symptom Checker, Lab Analysis)
- **Payments:** Razorpay (Test Mode)

## 📦 Installation

### Prerequisites
- Node.js (v18+)
- Supabase Account
- Razorpay Account (Test Mode)
- Gemini API Key

### Backend Setup
1. `cd server`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm start`

### Frontend Setup
1. `cd client`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

## 👤 Test Accounts
- **Admin:** admin@curova.com / Password123
- **Doctor:** dr.smith@curova.com / Password123
- **Patient:** john.doe@curova.com / Password123

## ✨ Key Features
- **Real-time Notifications:** Instant alerts for bookings and chat.
- **AI Lab Analysis:** Get simplified summaries of medical reports powered by Google Gemini (Note: code uses Gemini although docs might mention Claude).
- **Secure 2FA:** Protect your health data with OTP verification.
- **Waitlist System:** Automatically get notified when slots open.
- **Analytics:** Comprehensive dashboards for doctors and admins.
