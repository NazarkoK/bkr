from fastapi import FastAPI, Query
from typing import List, Optional
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from model_utils import retrain_model, load_model, predict_anomaly
import psycopg2
import yagmail
import logging
import os

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_NAME = os.getenv("DB_NAME", "anomaly_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "nazar")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def init_db():
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS query_logs (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMP,
            user_id TEXT,
            query_type TEXT,
            table_name TEXT,
            affected_rows INTEGER,
            execution_time_ms INTEGER,
            ip_address TEXT,
            is_anomaly BOOLEAN
        )
    """)
    conn.commit()
    conn.close()

log_path = os.path.join(os.path.dirname(__file__), "anomalies.log")
logger = logging.getLogger("anomaly_logger")
logger.setLevel(logging.INFO)

if not logger.hasHandlers():
    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    formatter = logging.Formatter('%(asctime)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

EMAIL_SENDER = os.getenv("EMAIL_SENDER", "example@example.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "example_password")
EMAIL_RECEIVER = os.getenv("EMAIL_RECEIVER", "receiver@example.com")

def send_email_alert(log: dict):
    try:
        yag = yagmail.SMTP(EMAIL_SENDER, EMAIL_PASSWORD)
        yag.send(
            to=EMAIL_RECEIVER,
            subject="🚨 Anomaly Detected!",
            contents=f"Anomaly log:\n\n{log}"
        )
    except Exception as e:
        logger.error(f"Email send failed: {e}")

model = load_model()

class QueryLog(BaseModel):
    id: int
    timestamp: str
    user_id: str
    query_type: str
    table_name: str
    affected_rows: int
    execution_time_ms: int
    ip_address: str
    is_anomaly: bool

class NewLog(BaseModel):
    timestamp: str
    user_id: str
    query_type: str
    table_name: str
    affected_rows: int
    execution_time_ms: int
    ip_address: str

def fetch_logs(
    only_anomalies=False,
    query_type=None,
    user_id=None,
    date_from=None,
    date_to=None,
    search=None
) -> List[QueryLog]:
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()

    conditions = []
    if only_anomalies:
        conditions.append("is_anomaly = TRUE")
    if query_type:
        conditions.append(f"query_type = '{query_type}'")
    if user_id:
        conditions.append(f"user_id = '{user_id}'")
    if date_from:
        conditions.append(f"DATE(timestamp) >= '{date_from}'")
    if date_to:
        conditions.append(f"DATE(timestamp) <= '{date_to}'")
    if search:
        pattern = f"%{search.lower()}%"
        conditions.append(
            f"(LOWER(user_id) LIKE '{pattern}' OR LOWER(query_type) LIKE '{pattern}' "
            f"OR LOWER(table_name) LIKE '{pattern}' OR ip_address LIKE '{pattern}')"
        )

    query = "SELECT * FROM query_logs"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY id DESC"

    cur.execute(query)
    rows = cur.fetchall()
    conn.close()

    return [
        QueryLog(
            id=row[0],
            timestamp=str(row[1]),
            user_id=row[2],
            query_type=row[3],
            table_name=row[4],
            affected_rows=row[5],
            execution_time_ms=row[6],
            ip_address=row[7],
            is_anomaly=row[8]
        )
        for row in rows
    ]

@app.get("/logs", response_model=List[QueryLog])
def get_all_logs(
    query_type: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None
):
    return fetch_logs(False, query_type, user_id, date_from, date_to, search)

@app.get("/logs/anomalies", response_model=List[QueryLog])
def get_anomalies(
    query_type: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None
):
    return fetch_logs(True, query_type, user_id, date_from, date_to, search)

@app.post("/add-log")
def add_log(log: NewLog):
    global model
    is_anomaly = bool(predict_anomaly(model, log))

    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO query_logs (timestamp, user_id, query_type, table_name, affected_rows, execution_time_ms, ip_address, is_anomaly)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        log.timestamp, log.user_id, log.query_type, log.table_name,
        log.affected_rows, log.execution_time_ms, log.ip_address, is_anomaly
    ))
    conn.commit()
    conn.close()

    if is_anomaly:
        logger.info(f"[ALERT] Anomaly Detected:\n{log}")
        send_email_alert(log.dict())

        retrain_model()
        model = load_model()
        logger.info("✅ Model retrained after anomaly detected.")

    return {"status": "saved", "anomaly": is_anomaly}
