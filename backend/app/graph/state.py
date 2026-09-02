"""LangGraph State definition for the Clinical Lab Results Analyzer."""
from typing import TypedDict, Any


class LabState(TypedDict):
    """Workflow state passed through the LangGraph pipeline."""

    labs: list[dict[str, Any]]
    classified_results: list[dict[str, Any]]
    routed_results: dict[str, list[dict[str, Any]]]
    explanations: list[dict[str, Any]]
    final_results: list[dict[str, Any]]
    summary: dict[str, int]
    validation_errors: list[dict[str, Any]]
