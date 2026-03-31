# WattWise – Campus Energy Intelligence Dashboard

**WattWise** is a modern full-stack energy monitoring and forecasting platform specifically designed for university campuses. It provides real-time usage tracking, short-term predictions using hybrid machine learning models, anomaly detection, billing simulation, and an AI assistant — all in a sleek cyberpunk-themed interface.

Built as a FossHack project with clean, expert-level, production-ready code quality.

## 🎯 Key Features (MVP – First 5 Core Functions Completed)

1. **User Authentication & Role Management**  
   - Secure registration and login using JWT  
   - Role-based access (Admin / Viewer)  
   - User management panel (promote/demote/delete)

2. **CSV Data Upload & Storage**  
   - Drag & drop CSV upload for meter data  
   - Structured support for date, block, room, appliance, kWh, etc. (Admin only)

3. **Live & Historical Usage Monitoring**  
   - Real-time consumption per block  
   - Interactive 7-day trend charts using Chart.js

4. **Short-Term Predictive Forecasting**  
   - LSTM + XGBoost hybrid model integration  
   - Next-day block-wise predictions with confidence scores  
   - Dedicated LSTM Forecast Dashboard with model performance metrics

5. **Anomaly Detection & Alerts**  
   - Automatic detection of unusual consumption patterns  
   - Visual alerts with severity levels

### Additional Implemented Features
- Gemini-powered AI Energy Assistant (multi-turn chat)
- Billing & Budget Management with visual progress bars
- Detailed block-wise analysis pages (Girls Hostel, Boys Hostel, Academic Blocks, Admin)
- Export reports as CSV
- Responsive cyberpunk-style UI with smooth animations

## 🛠️ Tech Stack

### Frontend
- HTML5 + CSS3 (custom cyberpunk design system)
- Vanilla JavaScript
- Chart.js (v4) for all interactive visualizations

### Backend
- Node.js + Express.js (v5)
- JWT Authentication
- bcryptjs for secure password hashing
- CORS enabled
- JSON-based user storage (easily upgradable to SQLite)

### AI/ML Integration
- Secure Gemini API proxy (`/ai/chat`)
- Mock + ready endpoints for LSTM + XGBoost forecasting
- Model info, history, and prediction routes

### Development Tools
- Nodemon
- dotenv for environment variables

## 📁 Project Structure
       WattWise/
        │
        ├── package.json
        ├── package-lock.json
        ├── README.md
        ├── LICENSE
        ├── dataset.csv
        ├── .gitignore
        |──Local Setup & Usage Instructions
        |──documentation/
        |  |──documentation.md
        |  |──planing-notes-img/
        |       |──coloumns in the dataset.jpg
        |       ├── dashboard main plan .jpg
        |       ├── discussion(25-3-26).jpg
        |       ├── explained work flow of the dashboard.jpg
        |       ├── main dahsboard final plan.jpeg
        |       ├── priority list till(26-3-26).jpg
        |       ├── priority list till(29-3-26).jpg
        |       ├── sampel dataset plan 1.jpg
        |       ├── sampel dataset plan 2.jpg
        |       ├── sampel dataset plan 3.jpg
        |       ├── sampel dataset plan 4.jpg
        |       ├── summmery till(20-3-26).jpg
        |       ├── summmery till(20-3-26)2.jpg
        |       ├── summmery till(20-3-26)3.jpg
        |       └── work flow prototype 1.jpg
        ├── backend/                          
        │   ├── data/
        │   │   └── users.json
        │   │
        │   ├── node_modules/                 
        │   │
        │   ├── .env
        │   ├── .env.example
        │   │
        │   ├── package.json
        │   ├── package-lock.json
        │   │
        │   └── server.js                    
        │
        ├── Dashboard/                       
        │   ├── dashboard.html
        │   │
        │   ├── css/
        │   │   ├── dashboard.css
        │   │   └── shared.css
        │   │
        │   ├── js/
        │   │   ├── dashboard.js
        │   │   └── shared.js
        │   │
        │   └──<details>
                <summary> pages/ </summary>                        
        │       ├── ai_assistant.html
        │       ├── anomalies.html
        │       ├── billing.html
        │       ├── block_ab1.html
        │       ├── block_ab2.html
        │       ├── block_adm.html
        │       ├── block_bh.html
        │       ├── block_gh.html
        │       ├── consumption.html
        │       ├── export.html
        │       ├── forecast.html
        │       ├── live.html
        │       ├── lstm_dashboard.html
        │       ├── switch_user.html
        │       ├── upload.html
                 </details>
        │   
        │
        ├── public/                          
        │   ├── css/
        │   │   └── styles.css
        │   │
        │   ├── js/
        │   │   ├── auth.js
        │   │   └── register.js
        │   │
        │   ├── index.html                   
        │   ├── register.html
        |
        |── wecomepage/
            ├── welcome.html
            ├── w_script.js
            └── w_style.css

        
👥 Team Members

    Samridhi Parashar – Full Stack Developer , API Development & ML Forcasting 
    Aaryamann Kapoor – Full Stack , Database Devoloper & API Development
    Kunal Bhatia – Data Handling & css Devolopment

Current Status:
      First 5 core functions completed with clean, expert, and authentic code quality. The project is well-structured, secure, and ready for further enhancements (real Python ML integration, database migration, or deployment).
    Made with ❤️ for sustainable campus energy management.
