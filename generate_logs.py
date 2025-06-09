import random
import datetime
import psycopg2
import os

query_types = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']
tables = ['clients', 'orders', 'products']
users = ['admin', 'manager', 'guest']
ips = ['192.168.1.10', '192.168.1.11', '192.168.1.12']

def generate_log():
    return {
        "timestamp": datetime.datetime.now(),
        "user_id": random.choice(users),
        "query_type": random.choice(query_types),
        "table_name": random.choice(tables),
        "affected_rows": random.randint(0, 200),
        "execution_time_ms": random.randint(5, 500),
        "ip_address": random.choice(ips),
        "is_anomaly": False
    }

def insert_log_to_db(log):
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME", "anomaly_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432")
    )
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO query_logs (timestamp, user_id, query_type, table_name,
            affected_rows, execution_time_ms, ip_address, is_anomaly)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        log["timestamp"], log["user_id"], log["query_type"], log["table_name"],
        log["affected_rows"], log["execution_time_ms"], log["ip_address"],
        log["is_anomaly"]
    ))
    conn.commit()
    cur.close()
    conn.close()

for _ in range(10):
    insert_log_to_db(generate_log())

print("✅ Логи додані в базу.")
