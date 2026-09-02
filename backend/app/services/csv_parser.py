"""CSV parsing and row-level validation service."""
import io
import logging
from typing import Tuple
import pandas as pd
from app.models.schemas import LabInput, RowValidationError

logger = logging.getLogger("clinical_analyzer.csv_parser")


class CSVParserService:
    """Parses and validates CSV input data for clinical lab test analysis."""

    REQUIRED_COLUMNS = ["test_name", "value", "unit"]

    @classmethod
    def parse_csv(cls, file_content: bytes | str) -> Tuple[list[LabInput], list[RowValidationError]]:
        """Parse raw CSV content and separate valid lab rows from row-level validation errors.

        Returns:
            Tuple of (valid_labs, validation_errors)
        """
        valid_labs: list[LabInput] = []
        validation_errors: list[RowValidationError] = []

        if isinstance(file_content, bytes):
            # Decode with fallback handling
            try:
                decoded = file_content.decode("utf-8")
            except UnicodeDecodeError:
                decoded = file_content.decode("latin-1", errors="replace")
        else:
            decoded = file_content

        if not decoded.strip():
            validation_errors.append(RowValidationError(row_index=0, error="Uploaded CSV file is completely empty."))
            return valid_labs, validation_errors

        try:
            df = pd.read_csv(io.StringIO(decoded))
        except Exception as e:
            validation_errors.append(RowValidationError(row_index=0, error=f"CSV format error: {str(e)}"))
            return valid_labs, validation_errors

        if df.empty:
            validation_errors.append(RowValidationError(row_index=0, error="CSV file contains headers but no data rows."))
            return valid_labs, validation_errors

        # Normalize column names: strip, lowercase
        col_map = {col: col.strip().lower().replace(" ", "_") for col in df.columns}
        df = df.rename(columns=col_map)

        # Check required columns
        missing_cols = [c for c in cls.REQUIRED_COLUMNS if c not in df.columns]
        if missing_cols:
            validation_errors.append(
                RowValidationError(
                    row_index=0,
                    error=f"Missing required columns in CSV: {', '.join(missing_cols)}. Expected columns: test_name, value, unit",
                )
            )
            return valid_labs, validation_errors

        # Process row by row for partial failure tolerance
        for idx, row in df.iterrows():
            row_num = int(idx) + 1  # 1-indexed for human readability
            raw_dict = {
                "test_name": str(row.get("test_name", "")),
                "value": str(row.get("value", "")),
                "unit": str(row.get("unit", "")),
            }

            # 1. Validate test name
            raw_test = row.get("test_name")
            if pd.isna(raw_test) or not str(raw_test).strip():
                validation_errors.append(
                    RowValidationError(
                        row_index=row_num,
                        raw_input=raw_dict,
                        error="Row rejected: 'test_name' is missing or empty.",
                    )
                )
                continue
            test_name = str(raw_test).strip()

            # 2. Validate value
            raw_val = row.get("value")
            if pd.isna(raw_val) or str(raw_val).strip() == "":
                validation_errors.append(
                    RowValidationError(
                        row_index=row_num,
                        raw_input=raw_dict,
                        error=f"Row rejected for '{test_name}': 'value' is missing.",
                    )
                )
                continue

            try:
                numeric_val = float(str(raw_val).replace(",", "").strip())
            except (ValueError, TypeError):
                validation_errors.append(
                    RowValidationError(
                        row_index=row_num,
                        raw_input=raw_dict,
                        error=f"Row rejected for '{test_name}': value '{raw_val}' cannot be parsed as a number.",
                    )
                )
                continue

            # 3. Validate unit
            raw_unit = row.get("unit")
            if pd.isna(raw_unit) or not str(raw_unit).strip():
                validation_errors.append(
                    RowValidationError(
                        row_index=row_num,
                        raw_input=raw_dict,
                        error=f"Row rejected for '{test_name}': 'unit' is missing or empty.",
                    )
                )
                continue
            unit = str(raw_unit).strip()

            valid_labs.append(
                LabInput(
                    test_name=test_name,
                    value=numeric_val,
                    unit=unit,
                )
            )

        return valid_labs, validation_errors


csv_parser = CSVParserService()
