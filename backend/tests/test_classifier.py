"""Unit tests for deterministic lab classification engine."""
import pytest
from pydantic import ValidationError
from app.models.schemas import LabInput
from app.services.classifier import DeterministicClassifier
from app.tools.reference_ranges import get_local_reference_range


def test_classify_normal_value():
    """Test that a value within normal reference range is classified as NORMAL."""
    ref = get_local_reference_range("hemoglobin")
    assert ref is not None
    lab = LabInput(test_name="Hemoglobin", value=14.5, unit="g/dL")
    result = DeterministicClassifier.classify(lab, ref)
    assert result["status"] == "NORMAL"
    assert "within the healthy physiological reference range" in result["why_flagged"]


def test_classify_warning_low_value():
    """Test that a mildly depressed value is classified as WARNING."""
    ref = get_local_reference_range("hemoglobin")
    assert ref is not None
    lab = LabInput(test_name="Hemoglobin", value=11.0, unit="g/dL")
    result = DeterministicClassifier.classify(lab, ref)
    assert result["status"] == "WARNING"
    assert "below the normal reference range" in result["why_flagged"]


def test_classify_warning_high_value():
    """Test that an elevated value below critical threshold is classified as WARNING."""
    ref = get_local_reference_range("glucose")
    assert ref is not None
    lab = LabInput(test_name="Glucose", value=125.0, unit="mg/dL")
    result = DeterministicClassifier.classify(lab, ref)
    assert result["status"] == "WARNING"
    assert "above the normal reference range" in result["why_flagged"]


def test_classify_critical_high_value():
    """Test that a severely elevated value is classified as CRITICAL."""
    ref = get_local_reference_range("potassium")
    assert ref is not None
    lab = LabInput(test_name="Potassium", value=6.8, unit="mmol/L")
    result = DeterministicClassifier.classify(lab, ref)
    assert result["status"] == "CRITICAL"
    assert "critically elevated" in result["why_flagged"]


def test_classify_critical_low_value():
    """Test that a dangerously low value is classified as CRITICAL."""
    ref = get_local_reference_range("potassium")
    assert ref is not None
    lab = LabInput(test_name="Potassium", value=2.5, unit="mmol/L")
    result = DeterministicClassifier.classify(lab, ref)
    assert result["status"] == "CRITICAL"
    assert "critically low" in result["why_flagged"]


def test_boundary_values():
    """Test inclusive boundary conditions for normal ranges."""
    ref = get_local_reference_range("hemoglobin")
    assert ref is not None

    # Exact normal_min boundary
    lab_min = LabInput(test_name="Hemoglobin", value=13.5, unit="g/dL")
    result_min = DeterministicClassifier.classify(lab_min, ref)
    assert result_min["status"] == "NORMAL"

    # Exact normal_max boundary
    lab_max = LabInput(test_name="Hemoglobin", value=17.5, unit="g/dL")
    result_max = DeterministicClassifier.classify(lab_max, ref)
    assert result_max["status"] == "NORMAL"


def test_unknown_test_resolution():
    """Test handling of tests not found locally or in MCP catalog."""
    ref, source = DeterministicClassifier.resolve_reference_range("unknown_enzyme_xyz")
    assert ref is None
    assert source == "none"


def test_mcp_fallback_resolution():
    """Test that tests absent from local registry are resolved via the MCP catalog."""
    ref, source = DeterministicClassifier.resolve_reference_range("cholesterol")
    assert ref is not None
    assert source == "mcp"
    assert ref.unit == "mg/dL"


def test_validation_missing_or_invalid_fields():
    """Test validation errors for empty test name, empty unit, or non-numeric values."""
    # Empty test name
    with pytest.raises(ValidationError):
        LabInput(test_name="", value=12.0, unit="g/dL")

    # Empty unit
    with pytest.raises(ValidationError):
        LabInput(test_name="Hemoglobin", value=12.0, unit="")

    # Non-numeric value
    with pytest.raises(ValidationError):
        LabInput(test_name="Hemoglobin", value="abc", unit="g/dL")
