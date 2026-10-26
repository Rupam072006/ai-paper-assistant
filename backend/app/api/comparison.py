from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Paper, Project, User
from app.schemas.schemas import ComparisonRequest, ComparisonResponse
from app.api.auth import get_current_user
from app.services.comparison_service import ComparisonService
from app.services.report_service import ReportService

router = APIRouter(prefix="/comparison", tags=["Comparison"])

@router.post("", response_model=ComparisonResponse)
def compare_papers(
    comp_in: ComparisonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == comp_in.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    query = db.query(Paper).filter(Paper.project_id == comp_in.project_id)
    if comp_in.paper_ids:
        query = query.filter(Paper.id.in_(comp_in.paper_ids))
    
    papers = query.all()
    if not papers:
        raise HTTPException(status_code=400, detail="No papers available for comparison.")

    papers_data = [
        {
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "publication_year": p.publication_year,
            "analysis": {
                "research_problem": p.analysis.research_problem if p.analysis else "",
                "objectives": p.analysis.objectives if p.analysis else "",
                "methodology": p.analysis.methodology if p.analysis else "",
                "algorithms": p.analysis.algorithms if p.analysis else "",
                "dataset_name": p.analysis.dataset_name if p.analysis else "",
                "dataset_size": p.analysis.dataset_size if p.analysis else "",
                "evaluation_metrics": p.analysis.evaluation_metrics if p.analysis else "",
                "results_summary": p.analysis.results_summary if p.analysis else "",
                "f1_score": p.analysis.f1_score if p.analysis else None,
                "accuracy": p.analysis.accuracy if p.analysis else None,
                "bleu_score": p.analysis.bleu_score if p.analysis else None,
                "limitations": p.analysis.limitations if p.analysis else "",
                "future_work": p.analysis.future_work if p.analysis else ""
            }
        }
        for p in papers
    ]

    matrix = ComparisonService.build_comparison_matrix(papers_data)
    ai_synthesis = ComparisonService.generate_ai_comparison(papers_data)

    return ComparisonResponse(
        matrix=matrix,
        ai_synthesis=ai_synthesis
    )

@router.get("/export/{project_id}")
def export_comparison_csv(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).all()
    if not papers:
        raise HTTPException(status_code=404, detail="No papers found in project to export.")

    papers_data = [
        {
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "publication_year": p.publication_year,
            "analysis": {
                "research_problem": p.analysis.research_problem if p.analysis else "",
                "methodology": p.analysis.methodology if p.analysis else "",
                "algorithms": p.analysis.algorithms if p.analysis else "",
                "dataset_name": p.analysis.dataset_name if p.analysis else "",
                "dataset_size": p.analysis.dataset_size if p.analysis else "",
                "evaluation_metrics": p.analysis.evaluation_metrics if p.analysis else "",
                "results_summary": p.analysis.results_summary if p.analysis else "",
                "limitations": p.analysis.limitations if p.analysis else "",
                "future_work": p.analysis.future_work if p.analysis else ""
            }
        }
        for p in papers
    ]

    matrix = ComparisonService.build_comparison_matrix(papers_data)
    csv_content = ReportService.generate_comparison_csv(matrix)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=comparison_matrix_{project_id[:8]}.csv"}
    )
