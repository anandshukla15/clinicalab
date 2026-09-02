"""FastAPI API routes for clinical lab result analysis."""
import logging
from typing import Any
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.models.schemas import (
    LabAnalysisRequest,
    LabAnalysisResponse,
    AnalysisSummary,
    LabResultItem,
    RowValidationError,
)
from app.graph.graph import lab_workflow_app
from app.graph.state import LabState
from app.services.csv_parser import csv_parser
from app.tools.reference_ranges import LOCAL_REFERENCE_RANGES, MCP_EXTENDED_RANGES

logger = logging.getLogger("clinical_analyzer.routes")

router = APIRouter()


@router.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Health check endpoint confirming service status."""
    return {
        "status": "ok",
        "service": "clinical-lab-analyzer",
        "version": "1.0.0",
    }


@router.get("/reference_ranges", tags=["Reference Ranges"])
async def get_reference_ranges() -> dict[str, Any]:
    """Return configured reference ranges from local catalog and MCP registry."""
    return {
        "local": LOCAL_REFERENCE_RANGES,
        "mcp_extended": MCP_EXTENDED_RANGES,
    }


@router.post(
    "/analyze_labs",
    response_model=LabAnalysisResponse,
    tags=["Analysis"],
    status_code=status.HTTP_200_OK,
)
async def analyze_labs(request: LabAnalysisRequest) -> LabAnalysisResponse:
    """Analyze a list of laboratory test results through the LangGraph workflow:

    Classify -> Route -> Explain
    """
    if not request.labs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one laboratory test result must be provided in 'labs'.",
        )

    # Convert request items to list of dicts for LangGraph state
    raw_labs = [lab.model_dump() for lab in request.labs]

    initial_state: LabState = {
        "labs": raw_labs,
        "classified_results": [],
        "routed_results": {"critical": [], "warning": [], "normal": []},
        "explanations": [],
        "final_results": [],
        "summary": {"critical": 0, "warning": 0, "normal": 0, "total": 0},
        "validation_errors": [],
    }

    try:
        final_state = lab_workflow_app.invoke(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while running the analysis workflow: {str(e)}",
        )

    results = [LabResultItem(**item) for item in final_state.get("final_results", [])]
    summary_dict = final_state.get("summary", {"critical": 0, "warning": 0, "normal": 0, "total": len(results)})
    validation_errors = [
        RowValidationError(**err) if isinstance(err, dict) else RowValidationError(error=str(err))
        for err in final_state.get("validation_errors", [])
    ]

    return LabAnalysisResponse(
        results=results,
        summary=AnalysisSummary(**summary_dict),
        validation_errors=validation_errors,
    )


@router.post(
    "/analyze_csv",
    response_model=LabAnalysisResponse,
    tags=["Analysis"],
    status_code=status.HTTP_200_OK,
)
async def analyze_csv(file: UploadFile = File(...)) -> LabAnalysisResponse:
    """Upload and analyze laboratory results from a CSV file.

    Handles partial failures row-by-row without crashing on malformed entries.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a .csv extension.",
        )

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}",
        )

    valid_labs, row_errors = csv_parser.parse_csv(content)

    if not valid_labs and row_errors:
        # All rows failed validation
        return LabAnalysisResponse(
            results=[],
            summary=AnalysisSummary(critical=0, warning=0, normal=0, total=0),
            validation_errors=row_errors,
        )

    # Run LangGraph on valid rows
    initial_state: LabState = {
        "labs": [lab.model_dump() for lab in valid_labs],
        "classified_results": [],
        "routed_results": {"critical": [], "warning": [], "normal": []},
        "explanations": [],
        "final_results": [],
        "summary": {"critical": 0, "warning": 0, "normal": 0, "total": 0},
        "validation_errors": [err.model_dump() for err in row_errors],
    }

    try:
        final_state = lab_workflow_app.invoke(initial_state)
    except Exception as e:
        logger.error(f"LangGraph execution error on CSV: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while analyzing the CSV dataset: {str(e)}",
        )

    results = [LabResultItem(**item) for item in final_state.get("final_results", [])]
    summary_dict = final_state.get("summary", {"critical": 0, "warning": 0, "normal": 0, "total": len(results)})
    combined_errors = [
        RowValidationError(**err) if isinstance(err, dict) else RowValidationError(error=str(err))
        for err in final_state.get("validation_errors", [])
    ]

    return LabAnalysisResponse(
        results=results,
        summary=AnalysisSummary(**summary_dict),
        validation_errors=combined_errors,
    )
