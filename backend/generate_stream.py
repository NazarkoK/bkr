import requests
import time
import random
from datetime import datetime

URL = "http://localhost:8000/add-log"

USERS = ["user1", "user2", "admin", "guest"]
QUERY_TYPES = ["SELECT", "INSERT", "UPDATE", "DELETE"]
TABLES = ["customers", "orders", "products", "logs"]

def generate_log():
    return {
        "timestamp": datetime.now().isoformat(),
        "user_id": random.choice(USERS),
        "query_type": random.choice(QUERY_TYPES),
        "table_name": random.choice(TABLES),
        "affected_rows": random.randint(1, 100),
        "execution_time_ms": random.randint(5, 200),
        "ip_address": f"192.168.1.{random.randint(1, 255)}"
    }

def send_log():
    log = generate_log()
    try:
        response = requests.post(URL, json=log)
        if response.status_code == 200:
            print(f"[{response.status_code}] {response.json()}")
        else:
            print(f"[{response.status_code}] ❌ {response.text}")
    except Exception as e:
        print("❌ Connection error:", e)

if __name__ == "__main__":
    while True:
        send_log()
        time.sleep(2)
