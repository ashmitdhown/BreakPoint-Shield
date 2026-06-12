import pytest
import json
import os
import sys
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_models_endpoint(client):
    resp = client.get("/api/models")
    assert resp.status_code == 200
    assert "models" in resp.json()


def test_history_endpoint(client):
    resp = client.get("/api/history")
    assert resp.status_code == 200
    assert "runs" in resp.json()


def test_get_sample_run(client):
    resp = client.get("/api/eval/sample-demo-run-0001/results")
    assert resp.status_code == 200
    data = resp.json()
    assert "overall_score" in data
    assert "results" in data


def test_delete_nonexistent_run(client):
    resp = client.delete("/api/history/nonexistent-run-id-xyz")
    assert resp.status_code == 404
