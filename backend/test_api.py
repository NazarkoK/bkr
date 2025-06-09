from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app, fetch_logs

client = TestClient(app)

def test_get_all_logs():
    response = client.get("/logs")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    if response.json():
        log = response.json()[0]
        assert "id" in log
        assert "timestamp" in log
        assert "user_id" in log
        assert "query_type" in log
        assert "table_name" in log
        assert "affected_rows" in log
        assert "execution_time_ms" in log
        assert "ip_address" in log
        assert "is_anomaly" in log

def test_get_anomalies():
    response = client.get("/logs/anomalies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    for log in response.json():
        assert log["is_anomaly"] is True

def test_filter_logs_by_query_type():
    response = client.get("/logs?query_type=SELECT")
    assert response.status_code == 200
    for log in response.json():
        assert log["query_type"] == "SELECT"

def test_filter_logs_by_user_id():
    response = client.get("/logs?user_id=test_user")
    assert response.status_code == 200
    for log in response.json():
        assert log["user_id"] == "test_user"

def test_filter_logs_by_date_range():
    response = client.get("/logs?date_from=2024-01-01&date_to=2024-12-31")
    assert response.status_code == 200
    for log in response.json():
        assert "timestamp" in log

def test_invalid_query_type_filter():
    response = client.get("/logs?query_type=INVALID")
    assert response.status_code == 200

def test_empty_database_behavior():
    with patch("main.fetch_logs", return_value=[]):
        response = client.get("/logs")
        assert response.status_code == 200
        assert response.json() == []
