import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models.schema import Paper, Project, User, Report
from app.api.auth import get_current_user
from app.config import settings
from app.services.comparison_service import ComparisonService
from app.services.research_gap_service import ResearchGapService
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/preview")
@router.get("/preview/{project_id}")
def get_report_preview(
    project_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not project_id:
        raise HTTPException(status_code=400, detail="Project ID is required.")

    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    papers = db.query(Paper).filter(Paper.project_id == project_id).all()
    if not papers:
        return {
            "project_name": project.name,
            "generated_date": datetime.utcnow().strftime("%b %d, %Y"),
            "paper_count": 0,
            "synthesis_text": "No papers uploaded in this workspace yet. Upload 3–5 research papers to generate the live literature review synthesis.",
            "gaps": [],
            "citations": []
        }

    papers_data = [
        {
            "id": p.id,
            "title": p.title,
            "authors": p.authors,
            "publication_year": p.publication_year,
            "journal_conference": p.journal_conference,
            "analysis": {
                "research_problem": p.analysis.research_problem if p.analysis else "",
                "objectives": p.analysis.objectives if p.analysis else "",
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

    ai_synthesis_dict = ComparisonService.generate_ai_comparison(papers_data)
    synthesis_text = ai_synthesis_dict.get("overall_comparison") or (
        f"This literature review synthesizes {len(papers)} research papers under '{project.name}'. "
        f"The corpus primarily investigates {papers[0].title[:50]} and related methodology frameworks. "
        f"Key algorithmic models focus on {papers[0].analysis.algorithms if papers[0].analysis else 'machine learning'}."
    )

    gaps_raw = ResearchGapService.analyze_gaps_and_trends(papers_data)
    raw_directions = gaps_raw.get("potential_research_directions", [])

    gaps = []
    for idx, d in enumerate(raw_directions, 1):
        ev_count = d.get("evidence_count", 1)
        gaps.append({
            "id": f"gap-{idx}",
            "title": d.get("title", "Domain Bottleneck & Constraint"),
            "confidence_level": d.get("confidence_level", "High"),
            "evidence_count": ev_count,
            "total_papers": len(papers),
            "evidence_tag": f"Supported by {min(ev_count, len(papers))}/{len(papers)} uploaded papers",
            "description": d.get("description", "Identified research limitation across corpus."),
            "suggested_future_avenue": f"Extend evaluation benchmarks to address {d.get('title')}."
        })

    # Citations
    citations = []
    for p in papers:
        authors = p.authors or "Unknown Authors"
        title = p.title or "Untitled Paper"
        year = str(p.publication_year or 2024)
        journal = p.journal_conference or "Academic Proceedings"

        first_author = authors.split()[0].replace(",", "") if authors else "Author"
        first_word = title.split()[0] if title else "Paper"
        bib_key = f"{first_author}{year}{first_word}".lower()

        citations.append({
            "paper_id": p.id,
            "paper_title": title,
            "ieee": f'{authors}, "{title}," {journal}, {year}.',
            "apa": f'{authors} ({year}). {title}. {journal}.',
            "mla": f'{authors}. "{title}." {journal}, {year}.',
            "bibtex": f'@article{{{bib_key},\n  author = {{{authors}}},\n  title = {{{title}}},\n  journal = {{{journal}}},\n  year = {{{year}}}\n}}'
        })

    return {
        "project_name": project.name,
        "generated_date": datetime.utcnow().strftime("%b %d, %Y"),
        "paper_count": len(papers),
        "synthesis_text": synthesis_text,
        "gaps": gaps,
        "citations": citations
    }

@router.post("/generate/{project_id}")
def generate_report(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    papers = db.query(Paper).filter(Paper.project_id == project_id).all()
    if not papers:
        raise HTTPException(status_code=400, detail="Cannot generate report for empty project without papers.")

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
                "limitations": p.analysis.limitations if p.analysis else "",
                "future_work": p.analysis.future_work if p.analysis else ""
            }
        }
        for p in papers
    ]

    matrix = ComparisonService.build_comparison_matrix(papers_data)
    ai_synthesis = ComparisonService.generate_ai_comparison(papers_data)
    gaps_data = ResearchGapService.analyze_gaps_and_trends(papers_data)

    report_id = str(uuid.uuid4())
    pdf_filename = f"literature_review_{project.name.replace(' ', '_')}_{report_id[:8]}.pdf"
    output_path = os.path.join(settings.UPLOAD_DIR, pdf_filename)

    ReportService.generate_pdf_report(
        project_name=project.name,
        papers_data=papers_data,
        comparison_matrix=matrix,
        ai_synthesis=ai_synthesis,
        gaps_data=gaps_data,
        output_path=output_path
    )

    report_obj = Report(
        id=report_id,
        project_id=project_id,
        user_id=current_user.id,
        title=f"Literature Review Report - {project.name}",
        file_path=output_path,
        report_data={"paper_count": len(papers)}
    )
    db.add(report_obj)
    db.commit()
    db.refresh(report_obj)

    return {
        "report_id": report_obj.id,
        "title": report_obj.title,
        "download_url": f"/api/reports/download/{report_obj.id}"
    }

@router.get("/download/{report_id}")
def download_report(
    report_id: str,
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found")

    return FileResponse(
        path=report.file_path,
        filename=os.path.basename(report.file_path),
        media_type="application/pdf"
    )
