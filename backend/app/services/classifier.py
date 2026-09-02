"""Deterministic Python classification engine for clinical laboratory results."""
import logging
from typing import Optional, Tuple
from app.models.schemas import LabInput, ReferenceRangeModel
from app.tools.reference_ranges import get_local_reference_range
from app.mcp.client import mcp_client

logger = logging.getLogger("clinical_analyzer.classifier")


class DeterministicClassifier:
    """Classifies lab values strictly deterministically using defined reference thresholds."""

    @staticmethod
    def resolve_reference_range(test_name: str) -> Tuple[Optional[ReferenceRangeModel], str]:
        """Look up reference range from local dictionary, falling back to MCP server."""
        # 1. Local dictionary lookup
        ref = get_local_reference_range(test_name)
        if ref:
            return ref, "local"

        # 2. Fallback to MCP server tool lookup
        logger.info(f"Test '{test_name}' not in local dictionary; querying MCP server...")
        ref = mcp_client.query_reference_range(test_name)
        if ref:
            return ref, "mcp"

        return None, "none"

    @classmethod
    def classify(
        cls,
        lab: LabInput,
        ref: ReferenceRangeModel,
        lookup_source: str = "local",
    ) -> dict:
        """Classify a lab test deterministically into NORMAL, WARNING, or CRITICAL.

        Args:
            lab: Validated lab input (test_name, value, unit)
            ref: ReferenceRangeModel with normal, warning, and critical thresholds
            lookup_source: Source of the reference range ('local' or 'mcp')

        Returns:
            Dictionary with status, reference_range, why_flagged, and threshold metadata.
        """
        val = lab.value
        name = ref.test_name

        # Critical thresholds check (outermost boundaries)
        if val < ref.critical_min:
            status = "CRITICAL"
            why_flagged = (
                f"{name} is {val} {lab.unit}, which is critically low and below the critical safety threshold "
                f"(< {ref.critical_min} {ref.unit})."
            )
        elif val > ref.critical_max:
            status = "CRITICAL"
            why_flagged = (
                f"{name} is {val} {lab.unit}, which is critically elevated and exceeds the critical safety threshold "
                f"(> {ref.critical_max} {ref.unit})."
            )
        # Warning thresholds check (outside normal range)
        elif val < ref.normal_min:
            status = "WARNING"
            why_flagged = (
                f"{name} is {val} {lab.unit}, which is below the normal reference range of "
                f"{ref.normal_min}–{ref.normal_max} {ref.unit}."
            )
        elif val > ref.normal_max:
            status = "WARNING"
            why_flagged = (
                f"{name} is {val} {lab.unit}, which is above the normal reference range of "
                f"{ref.normal_min}–{ref.normal_max} {ref.unit}."
            )
        else:
            status = "NORMAL"
            why_flagged = (
                f"{name} is {val} {lab.unit}, which falls within the healthy physiological reference range of "
                f"{ref.normal_min}–{ref.normal_max} {ref.unit}."
            )

        ref_range_str = f"{ref.normal_min} - {ref.normal_max} {ref.unit}"

        return {
            "test_name": ref.test_name,
            "value": val,
            "unit": lab.unit,
            "status": status,
            "reference_range": ref_range_str,
            "why_flagged": why_flagged,
            "normal_min": ref.normal_min,
            "normal_max": ref.normal_max,
            "warning_min": ref.warning_min,
            "warning_max": ref.warning_max,
            "critical_min": ref.critical_min,
            "critical_max": ref.critical_max,
            "lookup_source": lookup_source,
        }
