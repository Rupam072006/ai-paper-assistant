from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.database import get_db
from app.models.schema import Project, Paper, User
from app.schemas.schemas import ProjectCreate, ProjectResponse
from app.api.auth import get_current_user
from app.services.report_service import ReportService

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = Project(
        user_id=current_user.id,
        name=project_in.name,
        description=project_in.description
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    resp = ProjectResponse.model_validate(project)
    resp.paper_count = 0
    return resp

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    projects = db.query(Project).filter(Project.user_id == current_user.id).order_by(Project.created_at.desc()).all()

    project_list = []
    for p in projects:
        count = db.query(func.count(Paper.id)).filter(Paper.project_id == p.id).scalar() or 0
        resp = ProjectResponse.model_validate(p)
        resp.paper_count = count
        project_list.append(resp)

    return project_list

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count = db.query(func.count(Paper.id)).filter(Paper.project_id == project.id).scalar() or 0
    resp = ProjectResponse.model_validate(project)
    resp.paper_count = count
    return resp

@router.get("/{project_id}/export/pdf")
def export_project_pdf(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    papers = db.query(Paper).filter(Paper.project_id == project_id).all()
    if not papers:
        raise HTTPException(status_code=400, detail="Cannot export PDF for an empty project without papers.")

    pdf_bytes = ReportService.build_full_pdf_bytes(project, papers)
    safe_name = "".join(c for c in project.name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    filename = f"literature_review_{safe_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.get("/{project_id}/export/csv")
def export_project_csv(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    papers = db.query(Paper).filter(Paper.project_id == project_id).all()
    if not papers:
        raise HTTPException(status_code=400, detail="Cannot export CSV for an empty project without papers.")

    csv_content = ReportService.build_extracted_parameters_csv(papers)
    safe_name = "".join(c for c in project.name if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    filename = f"comparison_matrix_{safe_name}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(project)
    db.commit()
    return None
