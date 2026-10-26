from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import JobStatus
from app.schemas.schemas import JobStatusResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job = db.query(JobStatus).filter(JobStatus.job_id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job.job_id,
        project_id=job.project_id,
        status=job.status,
        progress_pct=job.progress_pct,
        step=job.step,
        error_message=job.error_message
    )
