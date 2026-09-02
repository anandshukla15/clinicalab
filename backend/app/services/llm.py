"""Google Gemini integration service for explainable clinical interpretations."""
import json
import logging
from typing import Optional
from app.config import settings
from app.models.schemas import ClinicalExplanation

logger = logging.getLogger("clinical_analyzer.llm")

# Try importing the official modern google-genai SDK
try:
    from google import genai
    from google.genai import types
    HAS_GENAI_SDK = True
except ImportError:
    HAS_GENAI_SDK = False


SYSTEM_PROMPT = """You are a cautious, professional clinical-information assistant.
You are given a laboratory result that has ALREADY been classified by deterministic Python logic.
You MUST NOT change the classification under any circumstances.
Your job is to explain the result in clear, cautious, patient-friendly language.

Safety & Medical Guidelines:
1. Do NOT diagnose the patient. Never state a definitive diagnosis.
2. Do NOT claim certainty. Use language such as "may indicate", "can be associated with", or "may warrant discussion with a healthcare professional".
3. Explain why the value is outside the reference range (or why it is normal).
4. Mention that laboratory reference ranges can vary between laboratories, methods, and individual patient contexts.
5. For WARNING or CRITICAL results, clearly recommend discussing the findings with a qualified healthcare provider. For CRITICAL, advise prompt medical attention.
6. Return valid JSON only with keys: "explanation", "possible_significance", "suggested_next_steps" (array of strings).
"""


class LLMExplanationService:
    """Service generating clinical explanations using Google Gemini with an offline fallback."""

    def __init__(self):
        self.api_key = settings.GOOGLE_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.client = None
        if HAS_GENAI_SDK and self.api_key:
            try:
                self.client = genai.Client(api_key=self.api_key)
                logger.info("Google GenAI client initialized successfully with API key.")
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}. Falling back to offline clinical generator.")

    def generate_explanation(
        self,
        test_name: str,
        value: float,
        unit: str,
        reference_range: str,
        status: str,
    ) -> ClinicalExplanation:
        """Generate structured clinical explanation for a single lab result."""
        if self.client:
            try:
                return self._call_gemini(test_name, value, unit, reference_range, status)
            except Exception as exc:
                logger.error(f"Gemini API call failed for '{test_name}': {exc}. Using fallback clinical explanation.")
                return self._fallback_explanation(test_name, value, unit, reference_range, status)
        else:
            return self._fallback_explanation(test_name, value, unit, reference_range, status)

    def _call_gemini(
        self,
        test_name: str,
        value: float,
        unit: str,
        reference_range: str,
        status: str,
    ) -> ClinicalExplanation:
        """Invoke Gemini API to generate structured JSON response."""
        user_prompt = f"""Laboratory Result to Explain:
- Test: {test_name}
- Measured Value: {value}
- Unit: {unit}
- Reference Range: {reference_range}
- Deterministic Classification: {status}

Remember: The classification is fixed as {status}. Do not alter it.
Return valid JSON matching this schema:
{{
  "explanation": "concise, patient-friendly explanation of this result",
  "possible_significance": "potential clinical associations using cautious language ('may be associated with...')",
  "suggested_next_steps": ["step 1", "step 2", "step 3"]
}}
"""
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[user_prompt],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )

        raw_text = response.text.strip()
        data = json.loads(raw_text)
        return ClinicalExplanation(
            explanation=data.get("explanation", f"{test_name} was measured at {value} {unit}."),
            possible_significance=data.get("possible_significance", "Clinical context required for full interpretation."),
            suggested_next_steps=data.get("suggested_next_steps", ["Discuss this result with your healthcare provider."]),
        )

    def _fallback_explanation(
        self,
        test_name: str,
        value: float,
        unit: str,
        reference_range: str,
        status: str,
    ) -> ClinicalExplanation:
        """Deterministic clinical knowledge generator for offline demo & testing."""
        name_lower = test_name.lower()

        if status == "CRITICAL":
            explanation = (
                f"Your {test_name} level is {value} {unit}, which is significantly outside the typical physiological reference range "
                f"({reference_range}) and falls into the critical alert zone. Markedly abnormal values require prompt clinical review."
            )
            significance = (
                f"Marked deviations in {test_name} may be associated with acute metabolic, hematologic, or organ-system disturbances. "
                "Individual clinical history, current symptoms, and concurrent medications are crucial for safe assessment."
            )
            next_steps = [
                "Seek prompt medical evaluation or contact your prescribing clinician immediately.",
                "Do not adjust medications or start supplements without direct physician guidance.",
                "A repeat confirmation test and comprehensive clinical examination are strongly recommended.",
            ]
        elif status == "WARNING":
            explanation = (
                f"Your {test_name} level of {value} {unit} is slightly outside the standard laboratory reference range of {reference_range}. "
                "Minor deviations are common and may be influenced by hydration, timing, diet, or mild physiological stress."
            )
            significance = (
                f"A moderately abnormal {test_name} can be associated with early-stage physiological changes or transient non-specific factors. "
                "Laboratory reference ranges vary between clinical sites and methodologies."
            )
            next_steps = [
                "Discuss this result with your primary healthcare provider at your next consultation.",
                "Consider repeating the test under standardized fasting or resting conditions as advised by your doctor.",
                "Review any recent symptoms, dietary changes, or over-the-counter supplements with your clinician.",
            ]
        else:  # NORMAL
            explanation = (
                f"Your {test_name} result of {value} {unit} falls within the standard expected reference range of {reference_range}."
            )
            significance = (
                f"This result indicates normal physiological functioning for {test_name} at the time of specimen collection. "
                "Normal individual lab values should always be interpreted alongside overall patient wellness."
            )
            next_steps = [
                "Continue standard routine preventive health screenings as recommended by your physician.",
                "Maintain healthy dietary, hydration, and lifestyle habits.",
            ]

        return ClinicalExplanation(
            explanation=explanation,
            possible_significance=significance,
            suggested_next_steps=next_steps,
        )


llm_service = LLMExplanationService()
