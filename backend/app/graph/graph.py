"""LangGraph workflow definition for the Clinical Lab Results Analyzer."""
import logging
from langgraph.graph import StateGraph, START, END
from app.graph.state import LabState
from app.graph.nodes import classify_node, route_node, explain_node

logger = logging.getLogger("clinical_analyzer.graph")


def create_lab_workflow():
    """Build and compile the linear LangGraph workflow:

    START -> classify -> route -> explain -> END
    """
    workflow = StateGraph(LabState)

    # Register nodes
    workflow.add_node("classify", classify_node)
    workflow.add_node("route", route_node)
    workflow.add_node("explain", explain_node)

    # Wire linear pipeline
    workflow.add_edge(START, "classify")
    workflow.add_edge("classify", "route")
    workflow.add_edge("route", "explain")
    workflow.add_edge("explain", END)

    return workflow.compile()


# Pre-compiled workflow graph singleton
lab_workflow_app = create_lab_workflow()
