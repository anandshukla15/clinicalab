"""Tests for the LangGraph workflow execution and routing."""
from app.graph.graph import lab_workflow_app
from app.graph.state import LabState


def test_langgraph_pipeline_execution():
    """Verify end-to-end execution of the LangGraph workflow with Critical, Warning, and Normal labs."""
    initial_state: LabState = {
        "labs": [
            {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL"},  # Normal
            {"test_name": "Potassium", "value": 6.8, "unit": "mmol/L"},  # Critical
            {"test_name": "Glucose", "value": 130.0, "unit": "mg/dL"},   # Warning
        ],
        "classified_results": [],
        "routed_results": {"critical": [], "warning": [], "normal": []},
        "explanations": [],
        "final_results": [],
        "summary": {"critical": 0, "warning": 0, "normal": 0, "total": 0},
        "validation_errors": [],
    }

    final_state = lab_workflow_app.invoke(initial_state)

    # 1. Summary check
    summary = final_state["summary"]
    assert summary["critical"] == 1
    assert summary["warning"] == 1
    assert summary["normal"] == 1
    assert summary["total"] == 3

    # 2. Strict severity ordering check: Critical first, Warning second, Normal third
    results = final_state["final_results"]
    assert len(results) == 3
    assert results[0]["status"] == "CRITICAL"
    assert results[0]["test_name"] == "Serum Potassium"
    assert results[1]["status"] == "WARNING"
    assert results[1]["test_name"] == "Fasting Glucose"
    assert results[2]["status"] == "NORMAL"
    assert results[2]["test_name"] == "Hemoglobin"

    # 3. Explanations populated
    for res in results:
        assert res["explanation"] != ""
        assert res["possible_significance"] != ""
        assert len(res["suggested_next_steps"]) > 0


def test_langgraph_handles_unknown_test_gracefully():
    """Verify that an unknown test does not crash the pipeline and produces validation errors."""
    initial_state: LabState = {
        "labs": [
            {"test_name": "UnknownEnzyme3000", "value": 100.0, "unit": "U/L"},
            {"test_name": "Hemoglobin", "value": 14.5, "unit": "g/dL"},
        ],
        "classified_results": [],
        "routed_results": {"critical": [], "warning": [], "normal": []},
        "explanations": [],
        "final_results": [],
        "summary": {"critical": 0, "warning": 0, "normal": 0, "total": 0},
        "validation_errors": [],
    }

    final_state = lab_workflow_app.invoke(initial_state)
    assert len(final_state["validation_errors"]) == 1
    assert "Unknown laboratory test 'UnknownEnzyme3000'" in final_state["validation_errors"][0]["error"]
    assert len(final_state["final_results"]) == 1
    assert final_state["final_results"][0]["status"] == "NORMAL"
