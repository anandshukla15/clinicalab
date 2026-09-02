"""MCP Server implementation exposing the reference_range_lookup tool."""
import json
import logging
from typing import Optional, Any
from app.tools.reference_ranges import (
    LOCAL_REFERENCE_RANGES,
    MCP_EXTENDED_RANGES,
    normalize_test_name,
)

logger = logging.getLogger("clinical_analyzer.mcp_server")

# Combined catalog accessible by the MCP server
CATALOG = {**LOCAL_REFERENCE_RANGES, **MCP_EXTENDED_RANGES}


def reference_range_lookup(test_name: str) -> Optional[dict[str, Any]]:
    """Look up reference range data for a laboratory test.

    Args:
        test_name: Name or alias of the laboratory test (e.g. 'hemoglobin', 'cholesterol', 'tsh')

    Returns:
        Structured reference range dictionary with thresholds and unit, or None if not found.
    """
    key = normalize_test_name(test_name)
    data = CATALOG.get(key)
    if not data:
        return None

    return {
        "test_name": data.get("canonical_name", test_name),
        "unit": data["unit"],
        "normal_min": float(data["normal_min"]),
        "normal_max": float(data["normal_max"]),
        "warning_min": float(data["warning_min"]),
        "warning_max": float(data["warning_max"]),
        "critical_min": float(data["critical_min"]),
        "critical_max": float(data["critical_max"]),
        "description": data.get("description", ""),
        "source": "mcp_server",
    }


# Try importing FastMCP from official mcp SDK for stdio server capability
try:
    from mcp.server.fastmcp import FastMCP

    mcp_app = FastMCP("clinical-lab-reference-server")

    @mcp_app.tool()
    def mcp_reference_range_lookup(test_name: str) -> str:
        """Tool: Retrieve clinical laboratory reference ranges for deterministic evaluation."""
        result = reference_range_lookup(test_name)
        if result is None:
            return json.dumps({"error": f"Test '{test_name}' not found in MCP reference registry."})
        return json.dumps(result)

except ImportError:
    mcp_app = None


if __name__ == "__main__":
    if mcp_app:
        mcp_app.run(transport="stdio")
    else:
        print("FastMCP not installed; running standalone test.")
        print(reference_range_lookup("hemoglobin"))
