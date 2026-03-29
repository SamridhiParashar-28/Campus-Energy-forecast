# WattWise – Campus Energy Intelligence Dashboard

**Project Documentation**  
**Version:** 1.0 (MVP)  
**Built for:** FossHack 2026  
**Last Updated:** March 2026

## 📖 Executive Summary

**WattWise** is a modern, full-stack energy monitoring and forecasting platform designed specifically for university campuses. It delivers real-time usage tracking, short-term predictions using hybrid machine learning models, anomaly detection, billing simulation, and an intelligent AI assistant — all wrapped in a sleek **cyberpunk-themed** interface with **light/dark mode** support.

The platform empowers campus administrators and students to make data-driven decisions for sustainable energy management by visualizing consumption patterns, forecasting future usage, and providing actionable alerts.

**Key Goal:** Promote energy efficiency and sustainability on campuses through an accessible, intelligent, and visually appealing dashboard.

**Project Status:** MVP completed with all core features fully functional and additional enhancements implemented.

## 🎯 Problem Statement & Objectives

### Problem
University campuses often lack centralized, real-time visibility into energy consumption across different blocks (hostels, academic buildings, admin). Manual tracking leads to inefficiencies, undetected waste, high costs, and missed opportunities for optimization. Existing systems are usually outdated and lack predictive or AI capabilities.

### Objectives
- Provide real-time and historical energy monitoring across campus blocks.
- Deliver accurate short-term forecasting for proactive planning.
- Automatically detect anomalies and generate alerts.
- Offer an intuitive AI assistant for natural language energy-related queries.
- Implement secure role-based access control.
- Create a responsive, modern UI with cyberpunk aesthetics and seamless light/dark mode switching.

## ✨ Features

### Core MVP Features
1. **User Authentication & Role Management**  
   - Secure registration and login using JWT  
   - Role-based access (Admin / Viewer)  
   - Admin panel to promote/demote/delete users

2. **Data Ingestion**  
   - Drag & drop CSV upload for meter data (Admin only)  
   - Supports structured data: date, block, room, appliance, kWh, etc.

3. **Monitoring & Visualization**  
   - Real-time consumption tracking per block  
   - Interactive 7-day trend charts using Chart.js  
   - Dedicated block-wise analysis pages (GH, BH, AB1, AB2, ADM)

4. **Predictive Forecasting**  
   - Hybrid LSTM + XGBoost model integration  
   - Next-day block-wise predictions with confidence scores  
   - Dedicated LSTM Forecast Dashboard with model performance metrics

5. **Anomaly Detection & Alerts**  
   - Automatic detection of unusual consumption patterns  
   - Visual alerts with severity levels (High / Medium / Low)

### Additional Implemented Features
- **Gemini-powered AI Energy Assistant** (multi-turn conversational chat)
- Billing & Budget Management with visual progress bars
- CSV report export
- **Light / Dark Mode** with smooth transitions
- **Scrollable Sidebar** for improved navigation on all screen sizes
- Theme switcher button in the top-right corner

## 🛠️ Tech Stack

### Frontend
- HTML5 + CSS3 (Custom Cyberpunk + Modern UI Design System)
- Vanilla JavaScript
- Chart.js (v4) for all interactive visualizations
- Fully responsive with smooth animations

### Backend
- Node.js + Express.js
- JWT Authentication
- bcryptjs for secure password hashing
- CORS enabled
- JSON-based user storage (easily upgradable to SQLite or PostgreSQL)

### AI/ML Integration
- Secure Gemini API proxy endpoint (`/ai/chat`)
- Mock + production-ready endpoints for LSTM + XGBoost forecasting
- Model info, training history, and prediction routes

### Development Tools
- Nodemon
- dotenv for environment variables

## 🏗️ System Architecture

**High-Level Flow:**
- **Frontend** (HTML/JS pages) communicates with the backend via REST APIs.
- **Backend** handles authentication, data processing, CSV parsing, and proxies AI requests.
- **Data Layer**: CSV uploads are processed and visualized; user data stored in JSON.
- **ML Layer**: Hybrid forecasting models generate predictions and detect anomalies.
- **UI Layer**: Cyberpunk theme with light/dark mode toggle and scrollable sidebar.

**Key Components:**
- Authentication Layer (JWT + bcrypt)
- Data Processing Layer
- Visualization Layer (Chart.js)
- AI/ML Integration Layer
- Responsive UI Layer

*(You can add architecture diagrams here later using Excalidraw, Draw.io, or Mermaid.)*

## 📸 Screenshots & Visual Documentation

Include the following in the `docs/images/` or `docs/screenshots/` folder:

- Welcome / Landing page
- Main Dashboard (Cyberpunk theme)
- Light Mode vs Dark Mode comparison
- Scrollable Sidebar demonstration
- Block-wise analysis pages (e.g., Girls Hostel)
- Forecasting Dashboard (LSTM predictions)
- AI Assistant chat interface
- Anomaly alerts and billing section

### Project Planning Phase

![Planning Notes and Early Sketches](docs/images/planning_notes.jpg)

*Caption: Early planning notes, wireframes, feature prioritization, and architecture sketches for WattWise. This photo captures the initial brainstorming sessions, UI layout ideas, and tech stack decisions made during the planning phase.*

(Add more screenshots or short GIFs for theme switching, chat interaction, and chart animations to make the documentation more engaging.)

## 📁 Project Structure

```bash
WattWise/
├── package.json
├── README.md
├── DOCUMENTATION.md              ← This file
├── LICENSE
├── dataset.csv
├── docs/                         ← Recommended folder for images & screenshots
│   └── images/
│       ├── planning_notes.jpg
│       └── screenshots/
├── Local Setup & Usage Instructions.md
├── backend/
│   ├── data/
│   │   └── users.json
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── Dashboard/
│   ├── dashboard.html
│   ├── css/
│   ├── js/
│   └── pages/ (ai_assistant.html, anomalies.html, block_*.html, etc.)
├── public/ (auth pages)
└── wecomepage/