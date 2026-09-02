"""API integration tests for FastAPI endpoints using TestClient."""
import io
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify that GET /health returns 200 and expected status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "clinical-lab-analyzer"


def test_reference_ranges_endpoint():
    """Verify that GET /reference_ranges returns local and MCP datasets."""
    response = client.get("/reference_ranges")
    assert response.status_code == 200
    data = response.json()
    assert "local" in data
    assert "mcp_extended" in data
    assert "hemoglobin" in data["local"]
    assert "cholesterol" in data["mcp_extended"]


def test_analyze_labs_valid_payload():
    """Verify POST /analyze_labs with valid mixed laboratory tests."""
    payload = {
        "labs": [
            {"test_name": "Hemoglobin", "value": 9.2, "unit": "g/dL"},
            {"test_name": "Glucose", "value": 95.0, "unit": "mg/dL"},
            {"test_name": "Potassium", "value": 6.8, "unit": "mmol/L"},
        ]
    }
    response = client.post("/analyze_labs", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert "results" in data
    assert "summary" in data
    assert "disclaimer" in data

    summary = data["summary"]
    assert summary["critical"] == 1
    assert summary["warning"] == 1
    assert summary["normal"] == 1
    assert summary["total"] == 3

    # Ensure critical result appears first
    assert data["results"][0]["status"] == "CRITICAL"
    assert data["results"][0]["test_name"] == "Serum Potassium"


def test_analyze_labs_empty_payload():
    """Verify that empty lab list is rejected with 422 or 400."""
    response = client.post("/analyze_labs", json={"labs": []})
    assert response.status_code in [400, 422]


def test_analyze_csv_endpoint():
    """Verify CSV upload analysis endpoint with synthetic CSV data."""
    csv_content = """test_name,value,unit
Hemoglobin,14.5,g/dL
Potassium,6.8,mmol/L
Glucose,126,mg/dL
"""
    files = {
        "file": ("test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/analyze_csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 3
    assert data["summary"]["critical"] == 1
    assert data["summary"]["warning"] == 1
    assert data["summary"]["normal"] == 1


def test_analyze_csv_with_malformed_row():
    """Verify partial failure handling in CSV: valid rows process, invalid rows yield validation_errors."""
    csv_content = """test_name,value,unit
Hemoglobin,14.5,g/dL
InvalidTest,not_a_number,mg/dL
Potassium,6.8,mmol/L
"""
    files = {
        "file": ("mixed.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")
    }
    response = client.post("/analyze_csv", files=files)
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 2  # Hemoglobin and Potassium
    assert len(data["validation_errors"]) >= 1  # InvalidTest rejected
    assert "cannot be parsed as a number" in data["validation_errors"][0]["error"]
