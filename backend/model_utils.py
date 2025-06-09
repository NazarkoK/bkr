import os
import pickle
import psycopg2
import numpy as np
from sklearn.ensemble import IsolationForest

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

def fetch_training_data():
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "anomaly_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "nazar"),
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432))
    )
    cursor = conn.cursor()
    cursor.execute("SELECT affected_rows, execution_time_ms FROM query_logs")
    rows = cursor.fetchall()
    conn.close()
    return np.array(rows)

def retrain_model():
    print("🔁 Retraining model...")
    data = fetch_training_data()
    print(f"🧪 Training on {len(data)} rows")

    if len(data) == 0:
        return {"error": "No data to train model."}

    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(data)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)

    return {"status": "✅ Model retrained successfully", "logs_used": len(data)}

def load_model():
    if not os.path.exists(MODEL_PATH):
        retrain_model()
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

def predict_anomaly(model, log):
    features = np.array([[log.affected_rows, log.execution_time_ms]])
    prediction = model.predict(features)
    return prediction[0] == -1
