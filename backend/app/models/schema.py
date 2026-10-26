import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, DateTime, ForeignKey, Table, Column, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(191), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    projects: Mapped[List["Project"]] = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    papers: Mapped[List["Paper"]] = relationship("Paper", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(191), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship("User", back_populates="projects")
    papers: Mapped[List["Paper"]] = relationship("Paper", back_populates="project", cascade="all, delete-orphan")
    questions: Mapped[List["Question"]] = relationship("Question", back_populates="project", cascade="all, delete-orphan")
    insights: Mapped[List["ResearchInsight"]] = relationship("ResearchInsight", back_populates="project", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="project", cascade="all, delete-orphan")


comparison_papers = Table(
    "comparison_papers",
    Base.metadata,
    Column("comparison_id", String(36), ForeignKey("comparisons.id", ondelete="CASCADE"), primary_key=True),
    Column("paper_id", String(36), ForeignKey("papers.id", ondelete="CASCADE"), primary_key=True)
)


class Paper(Base):
    __tablename__ = "papers"
    __table_args__ = (
        UniqueConstraint("project_id", "file_hash", name="uq_project_file_hash"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    file_name: Mapped[str] = mapped_column(String(191), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    authors: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publication_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    journal_conference: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    doi: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    abstract: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="papers")
    user: Mapped["User"] = relationship("User", back_populates="papers")
    analysis: Mapped[Optional["PaperAnalysis"]] = relationship("PaperAnalysis", back_populates="paper", uselist=False, cascade="all, delete-orphan")
    chunks: Mapped[List["PaperChunk"]] = relationship("PaperChunk", back_populates="paper", cascade="all, delete-orphan")


class PaperAnalysis(Base):
    __tablename__ = "paper_analysis"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False, unique=True)

    research_problem: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    objectives: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    research_questions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    proposed_solution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    methodology: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    algorithms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    models: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    frameworks: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    dataset_name: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    dataset_size: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    dataset_domain: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    features: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    evaluation_metrics: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    results_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    accuracy: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    precision_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    recall_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    f1_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rouge_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    bleu_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rmse: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mae: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    auc_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    r2_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    dice_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    kappa: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    map_score: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    mse: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    specificity: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    other_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    limitations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    future_work: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    short_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    detailed_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    technical_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    section_summaries: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    keywords: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    domain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    references_data: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    paper: Mapped["Paper"] = relationship("Paper", back_populates="analysis")


class PaperChunk(Base):
    __tablename__ = "paper_chunks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    paper_id: Mapped[str] = mapped_column(String(36), ForeignKey("papers.id", ondelete="CASCADE"), index=True, nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    chunk_text: Mapped[str] = mapped_column(Text, nullable=False)
    section: Mapped[Optional[str]] = mapped_column(String(191), nullable=True)
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)

    paper: Mapped["Paper"] = relationship("Paper", back_populates="chunks")


# Chunk alias for backward compatibility
Chunk = PaperChunk


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    paper_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="questions")


class Comparison(Base):
    __tablename__ = "comparisons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(191), default="Multi-Paper Comparison")
    ai_synthesis: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    papers: Mapped[List["Paper"]] = relationship("Paper", secondary=comparison_papers)


class ResearchInsight(Base):
    __tablename__ = "research_insights"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    insight_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(191), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_level: Mapped[str] = mapped_column(String(20), default="High")
    evidence_count: Mapped[int] = mapped_column(Integer, default=1)
    evidence_papers: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="insights")


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(191), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    report_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    project: Mapped["Project"] = relationship("Project", back_populates="reports")


class JobStatus(Base):
    __tablename__ = "job_statuses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(String(191), unique=True, index=True, nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="processing")
    progress_pct: Mapped[int] = mapped_column(Integer, default=0)
    step: Mapped[str] = mapped_column(String(191), default="Initializing upload...")
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
