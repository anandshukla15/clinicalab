"""LangGraph nodes implementing the Classify, Route, and Explain pipeline."""
import logging
from typing import Any
from app.graph.state import LabState
from app.models.schemas import LabInput
from app.services.classifier import DeterministicClassifier
from app.services.llm import llm_service

logger = logging.getLogger("clinical_analyzer.graph_nodes")


def classify_node(state: LabState) -> dict[str, Any]:
    """Node 1: Classify

    Deterministically resolves reference ranges (via local registry or MCP tool)
    and classifies each test into NORMAL, WARNING, or CRITICAL.
    """
    logger.info("Executing [classify_node]...")
    raw_labs = state.get("labs", [])
    classified: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = list(state.get("validation_errors", []))

    for idx, item in enumerate(raw_labs):
        try:
            # Handle item if already a LabInput or dict
            if isinstance(item, LabInput):
                lab = item
            elif isinstance(item, dict):
                lab = LabInput(
                    test_name=str(item.get("test_name", "")),
                    value=float(item.get("value", 0.0)),
                    unit=str(item.get("unit", "")),
                )
            else:
                errors.append({"row_index": idx + 1, "error": f"Invalid item format at index {idx}: {item}"})
                continue

            # Look up reference range (Local -> MCP server tool)
            ref, source = DeterministicClassifier.resolve_reference_range(lab.test_name)
            if not ref:
                logger.warning(f"Unknown test '{lab.test_name}'. Neither local nor MCP server had a reference range.")
                errors.append({
                    "row_index": idx + 1,
                    "test_name": lab.test_name,
                    "error": f"Unknown laboratory test '{lab.test_name}'. No reference range available in local catalog or MCP server.",
                })
                continue

            # Deterministic Python classification
            result_dict = DeterministicClassifier.classify(lab, ref, lookup_source=source)
            classified.append(result_dict)

        except Exception as e:
            logger.error(f"Error processing item at index {idx}: {e}")
            errors.append({"row_index": idx + 1, "error": f"Failed to classify row {idx + 1}: {str(e)}"})

    return {
        "classified_results": classified,
        "validation_errors": errors,
    }


def route_node(state: LabState) -> dict[str, Any]:
    """Node 2: Route

    Partitions classified results into Critical, Warning, and Normal groups,
    ordered strictly by clinical severity.
    """
    logger.info("Executing [route_node]...")
    classified = state.get("classified_results", [])

    routed: dict[str, list[dict[str, Any]]] = {
        "critical": [],
        "warning": [],
        "normal": [],
    }

    for item in classified:
        status_key = item.get("status", "NORMAL").lower()
        if status_key in routed:
            routed[status_key].append(item)
        else:
            routed["normal"].append(item)

    summary = {
        "critical": len(routed["critical"]),
        "warning": len(routed["warning"]),
        "normal": len(routed["normal"]),
        "total": len(classified),
    }

    logger.info(f"Routing summary: {summary}")
    return {
        "routed_results": routed,
        "summary": summary,
    }


def explain_node(state: LabState) -> dict[str, Any]:
    """Node 3: Explain

    Invokes Google Gemini to generate cautious, structured clinical explanations,
    possible clinical significance, and suggested next steps without modifying
    the deterministic Python classification.
    """
    logger.info("Executing [explain_node]...")
    routed = state.get("routed_results", {"critical": [], "warning": [], "normal": []})

    # Strict ordering: Critical first, then Warning, then Normal
    ordered_items = routed.get("critical", []) + routed.get("warning", []) + routed.get("normal", [])
    final_results: list[dict[str, Any]] = []
    explanations: list[dict[str, Any]] = []

    for item in ordered_items:
        # Call Gemini LLM explanation service
        clinical_expl = llm_service.generate_explanation(
            test_name=item["test_name"],
            value=item["value"],
            unit=item["unit"],
            reference_range=item["reference_range"],
            status=item["status"],  # Authoritative Python classification
        )

        merged_result = {
            **item,
            "explanation": clinical_expl.explanation,
            "possible_significance": clinical_expl.possible_significance,
            "suggested_next_steps": clinical_expl.suggested_next_steps,
        }
        final_results.append(merged_result)
        explanations.append({
            "test_name": item["test_name"],
            "explanation": clinical_expl.explanation,
            "possible_significance": clinical_expl.possible_significance,
            "suggested_next_steps": clinical_expl.suggested_next_steps,
        })

    return {
        "final_results": final_results,
        "explanations": explanations,
    }
