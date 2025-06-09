import pandas as pd
import psycopg2
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler

def run_detection():
    conn = psycopg2.connect(
        dbname="anomaly_db",
        user="postgres",
        password="nazar",
        host="localhost",
        port="5432"
    )

    df = pd.read_sql_query("SELECT * FROM query_logs", conn)

    if len(df) < 5:
        print("⚠️ Недостатньо даних для аналізу (менше 5 записів).")
        conn.close()
        return

    features = df[['affected_rows', 'execution_time_ms']].copy()
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(features)

    model = IsolationForest(contamination=0.15, random_state=42)
    df['anomaly'] = model.fit_predict(X_scaled).astype(bool)
    df['anomaly'] = ~df['anomaly']  # 1 → False, -1 → True

    cursor = conn.cursor()
    for _, row in df.iterrows():
        cursor.execute(
            "UPDATE query_logs SET is_anomaly = %s WHERE id = %s",
            (row['anomaly'], row['id'])
        )
    conn.commit()
    cursor.close()
    conn.close()

    detected = df[df['anomaly']]
    print(f"🧠 Аномалій знайдено: {len(detected)}")
    for _, row in detected.iterrows():
        print(f"⚠️ ID={row['id']} | {row['user_id']} {row['query_type']} [{row['affected_rows']} рядків, {row['execution_time_ms']} мс]")

if __name__ == "__main__":
    run_detection()
