"""MCP Client adapter for querying the reference range lookup tool."""
import logging
from typing import Optional
from app.models.schemas import ReferenceRangeModel
from app.mcp.server import reference_range_lookup

logger = logging.getLogger("clinical_analyzer.mcp_client")


class MCPReferenceClient:
    """Client communicating with the MCP server to fetch lab reference ranges."""

    def __init__(self):
        self.client_name = "FastAPI-LangGraph-MCP-Client"

    def query_reference_range(self, test_name: str) -> Optional[ReferenceRangeModel]:
        """Call the MCP tool `reference_range_lookup` for the specified test.

        Logs the MCP tool invocation explicitly so the flow is traceable and demonstrable.
        """
        logger.info(f"[MCP-TOOL-CALL] Invoking tool 'reference_range_lookup' on MCP server for test='{test_name}'")
        raw_data = reference_range_lookup(test_name)
        if not raw_data:
            logger.warning(f"[MCP-TOOL-CALL] Test '{test_name}' not found in MCP registry.")
            return None

        logger.info(f"[MCP-TOOL-RESPONSE] Received reference range for '{test_name}': {raw_data['unit']} ({raw_data['normal_min']}-{raw_data['normal_max']})")
        return ReferenceRangeModel(
            test_name=raw_data["test_name"],
            unit=raw_data["unit"],
            normal_min=raw_data["normal_min"],
            normal_max=raw_data["normal_max"],
            warning_min=raw_data["warning_min"],
            warning_max=raw_data["warning_max"],
            critical_min=raw_data["critical_min"],
            critical_max=raw_data["critical_max"],
            description=raw_data.get("description"),
        )


# Singleton instance
mcp_client = MCPReferenceClient()
