from typing import List, Dict, Any
from app.services.llm_service import LLMService

class ResearchGapService:
    @staticmethod
    def analyze_gaps_and_trends(papers_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Discover research gaps, limitations, and future directions dynamically from uploaded papers."""
        if not papers_data:
            return {
                "common_limitations": [],
                "potential_research_directions": [],
                "author_stated_future_work": []
            }

        total_papers = len(papers_data)
        author_future = []
        limitations_list = []
        
        for p in papers_data:
            analysis = p.get("analysis") or {}
            p_title = p.get("title", "Paper")
            
            if analysis.get("future_work"):
                author_future.append({
                    "paper_title": p_title,
                    "future_work": analysis.get("future_work")
                })
            
            if analysis.get("limitations"):
                limitations_list.append({
                    "paper_title": p_title,
                    "limitation": analysis.get("limitations")
                })

        # Dynamically build common limitations from actual paper limitations
        common_limitations = []
        for lim_item in limitations_list:
            common_limitations.append({
                "limitation": lim_item["limitation"],
                "evidence_count": 1,
                "affected_papers": [lim_item["paper_title"]]
            })

        # Dynamically build potential research directions from actual author future work or extracted limitations
        directions = []
        for item in author_future:
            directions.append({
                "title": f"Future Direction: {item['paper_title'][:50]}",
                "description": item["future_work"],
                "confidence_level": "High",
                "evidence_count": 1,
                "evidence_papers": [item["paper_title"]]
            })

        # Fallback to dynamic paper-specific directions if no author future work extracted
        if not directions:
            for p in papers_data:
                an = p.get("analysis") or {}
                algo = an.get("algorithms") or "the evaluated methodology"
                directions.append({
                    "title": f"Further Research on {p.get('title', 'Paper')[:45]}",
                    "description": f"Targeting model optimization, computational scaling, and domain validation for {algo}.",
                    "confidence_level": "Medium",
                    "evidence_count": 1,
                    "evidence_papers": [p.get("title")]
                })

        return {
            "common_limitations": common_limitations,
            "potential_research_directions": directions,
            "author_stated_future_work": author_future
        }
