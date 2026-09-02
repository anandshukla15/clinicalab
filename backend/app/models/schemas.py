from typing import Optional, Literal
from pydantic import BaseModel, Field, field_validator


class LabInput(BaseModel):
    test_name: str = Field(..., description="Name of laboratory test (e.g., Hemoglobin, Glucose)")
    value: float = Field(..., description="Measured numerical value")
    unit: str = Field(..., description="Measurement unit (e.g., g/dL, mg/dL, mmol/L)")

    @field_validator("test_name")
    @classmethod
    def validate_test_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Test name is required")
        return s

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Unit is required")
        return s


class LabAnalysisRequest(BaseModel):
    labs: list[LabInput] = Field(..., min_length=1, description="List of laboratory results to analyze")


class ReferenceRangeModel(BaseModel):
    test_name: str
    unit: str
    normal_min: float
    normal_max: float
    warning_min: float
    warning_max: float
    critical_min: float
    critical_max: float
    description: Optional[str] = None


class ClinicalExplanation(BaseModel):
    explanation: str = Field(..., description="Patient-friendly cautious clinical explanation")
    possible_significance: str = Field(..., description="Possible clinical conditions or associations")
    suggested_next_steps: list[str] = Field(default_factory=list, description="Cautious actionable next steps")


class LabResultItem(BaseModel):
    test_name: str
    value: float
    unit: str
    status: Literal["CRITICAL", "WARNING", "NORMAL"]
    reference_range: str
    why_flagged: str
    explanation: str
    possible_significance: str
    suggested_next_steps: list[str]
    normal_min: Optional[float] = None
    normal_max: Optional[float] = None
    warning_min: Optional[float] = None
    warning_max: Optional[float] = None
    critical_min: Optional[float] = None
    critical_max: Optional[float] = None
    lookup_source: Optional[str] = "local"


class RowValidationError(BaseModel):
    row_index: Optional[int] = None
    raw_input: Optional[dict] = None
    error: str


class AnalysisSummary(BaseModel):
    critical: int = 0
    warning: int = 0
    normal: int = 0
    total: int = 0


class LabAnalysisResponse(BaseModel):
    results: list[LabResultItem]
    summary: AnalysisSummary
    validation_errors: list[RowValidationError] = Field(default_factory=list)
    disclaimer: str = (
        "This tool is for educational/informational purposes only and does not provide a medical diagnosis. "
        "Laboratory reference ranges may vary by laboratory, method, age, sex, and other factors. "
        "Consult a qualified healthcare professional for interpretation of your results."
    )
