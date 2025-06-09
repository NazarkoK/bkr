# 🧠 Anomaly Detection in Database Logs

## 🚀 How to Run via Docker

> ✅ Requirements: Docker & Docker Compose

`git clone https://github.com/your-username/anomaly-detector.git`
`cd anomaly-detector`
`docker-compose up --build`
`Frontend available at: http://localhost:3000`

Backend API: http://localhost:8000/docs

##🧠 Features
✅ Real-time anomaly detection using IsolationForest

📉 Interactive dashboard with graphs and tables

🔁 Model retraining on new logs

📧 Email alerts and logging to file

🌐 Interface in English and Ukrainian

📄 PDF exports: logs, anomalies, charts, full report

##🧪 Development / Testing
To run FastAPI backend locally without Docker:

`cd backend`
`pip install -r requirements.txt`
`uvicorn main:app --reload`

To generate logs manually:

`python backend/generate_logs.py`