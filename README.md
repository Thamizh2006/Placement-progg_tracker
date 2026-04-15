🚀 AI Placement Progress Tracker


📌 Overview

AI Placement Progress Tracker is a full stack web application designed to help students systematically prepare for placements. It provides progress tracking, mentorship support, resume analysis, and AI-based readiness prediction in a centralized platform.

🎯 Problem Statement

Students often lack a structured system to:

Track their placement preparation progress
Identify weak areas
Get proper mentorship
Evaluate their readiness level
✅ Solution

This platform provides:

Structured progress tracking
Mentor guidance and doubt support
Resume builder with ATS analysis
AI-based readiness and level prediction
🏗️ Architecture

The system follows a layered architecture:

Frontend: React + Vite
Backend: Node.js + Express
Database: MongoDB
AI Module: Rule-based analytics


🔄 Workflow


User logs in through the frontend
Frontend sends API requests to backend
Backend processes logic and stores data in MongoDB
Backend sends data to AI module
AI module analyzes and returns predictions
Results are displayed on the dashboard


👥 User Roles


👨‍🎓 Student

Track progress

Select placement category (5 LPA, 7 LPA, 10 LPA)

Build resume

Ask doubts

Check readiness and level prediction

👨‍🏫 Faculty

Monitor assigned students

Respond to doubts

Guide student progress

🧑‍💼 HOD

View department analytics

Monitor performance

⚙️ Admin

Manage users

Monitor system activity

📦 Features

🔐 Authentication (JWT-based)


📊 Progress Tracking

👨‍🏫 Mentor Management

❓ Doubt Management System

📄 Resume Builder & ATS Scoring

🤖 AI-based Readiness Prediction

📈 Analytics Dashboard

🤖 AI Features

Readiness Score Calculation

Level Prediction (5 LPA / 7 LPA / 10 LPA)

Weak Area Detection

Resume ATS Scoring

Mentor Recommendation

🛠️ Tech Stack

Frontend:

React.js

Vite

HTML, CSS, JavaScript

Backend:

Node.js

Express.js

Database:

MongoDB

Mongoose

Authentication:

JWT


🚀 Deployment

Frontend: Netlify

Backend: Render

Database: MongoDB Atlas


⚙️ Installation & Setup

1. Clone the Repository

git clone https://github.com/Thamizh2006/Placement-progg_tracker.git

cd Placement-progg_tracker

2. Install Dependencies

Backend:

cd backend

npm install

Frontend:

cd ../frontend

npm install

3. Setup Environment Variables

Create a .env file in the backend folder:

PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

4. Run the Project

Backend:

cd backend

npm run server

Frontend:
cd frontend

npm run dev
