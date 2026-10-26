from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.schema import Question, Paper, Project, User
from app.schemas.schemas import ChatRequest, ChatResponse
from app.api.auth import get_current_user
from app.services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("", response_model=ChatResponse)
def ask_question(
    chat_in: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == chat_in.project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    papers = db.query(Paper).filter(Paper.project_id == chat_in.project_id).all()
    paper_title_map = {p.id: p.title for p in papers}

    rag_result = RAGService.answer_question(
        project_id=chat_in.project_id,
        question=chat_in.question,
        paper_id=chat_in.paper_id,
        paper_title_map=paper_title_map,
        papers=papers,
        db=db
    )

    q_obj = Question(
        project_id=chat_in.project_id,
        user_id=current_user.id,
        paper_id=chat_in.paper_id,
        question=chat_in.question,
        answer=rag_result["answer"],
        sources=rag_result["sources"]
    )
    db.add(q_obj)
    db.commit()
    db.refresh(q_obj)

    return ChatResponse(
        question=q_obj.question,
        answer=q_obj.answer,
        sources=rag_result["sources"],
        created_at=q_obj.created_at
    )
