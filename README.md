# Watt Wise
This project aims to develop a web-based dashboard that uses hybrid machine learning models to predict short-term energy consumption, detect anomalies, and optimize electricity costs specifically for university hostels and college buildings.

🎯 Features (MVP – First 5 Only)

1. **CSV Data Upload & Storage**  
2. **Live / Zone-Level Usage Monitoring**  
3. **Short-Term Predictive Forecasting**  
4. **Anomaly Detection & Alerts**  
5. **Billing & Cost Simulation** 
6. **Interactive Dashboard**
Responsive HTML + Chart.js frontend with toggles, tooltips, and smooth animations.

🏗️ Tech Stack

**Frontend**  
- HTML5  
- CSS3 (with responsive design)  
- JavaScript (Vanilla + Chart.js for interactive charts)

**Backend**  
- Python 3.10+  
- FastAPI (REST API endpoints)  
- SQLModel (lightweight database)

**Machine Learning**  
- Pre-trained model (saved as .h5 or .pkl)  
- TensorFlow/Keras or scikit-learn (for loading & inference only — no training in app)  
- pandas (data preprocessing)  
- scikit-learn (anomaly detection)

**Visualization**  
- Chart.js (v4+) – interactive, zoomable forecasts & usage trends

📊 Architecture Overview

- **Overall Architecture**: 
Client-server model with separation of concerns
- **Frontend Layer (User Browser)**
- **Backend Layer (FastAPI Server)**
- **Database Layer (SQLite)**
- **Machine Learning Inference Layer**
- **Data Flow Example (Forecast Feature)**
