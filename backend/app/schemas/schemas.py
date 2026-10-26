from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# Auth Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseModel):
    token: Optional[str] = None
    id_token: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Project Schemas
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    paper_count: Optional[int] = 0

    class Config:
        from_attributes = True

# Paper Analysis Schema
class PaperAnalysisResponse(BaseModel):
    id: str
    paper_id: str
    research_problem: Optional[str] = None
    objectives: Optional[str] = None
    research_questions: Optional[str] = None
    proposed_solution: Optional[str] = None
    methodology: Optional[str] = None
    algorithms: Optional[str] = None
    models: Optional[str] = None
    frameworks: Optional[str] = None
    dataset_name: Optional[str] = None
    dataset_size: Optional[str] = None
    dataset_domain: Optional[str] = None
    features: Optional[str] = None
    evaluation_metrics: Optional[str] = None
    results_summary: Optional[str] = None
    accuracy: Optional[str] = None
    precision_score: Optional[str] = None
    recall_score: Optional[str] = None
    f1_score: Optional[str] = None
    rouge_score: Optional[str] = None
    bleu_score: Optional[str] = None
    rmse: Optional[str] = None
    mae: Optional[str] = None
    other_metrics: Optional[Dict[str, Any]] = None
    limitations: Optional[str] = None
    future_work: Optional[str] = None
    short_summary: Optional[str] = None
    detailed_summary: Optional[str] = None
    technical_summary: Optional[str] = None
    section_summaries: Optional[Dict[str, str]] = None
    keywords: Optional[str] = None
    references_data: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

# Paper Schemas
class PaperResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    title: str
    file_name: str
    file_path: str
    authors: Optional[str] = None
    publication_year: Optional[int] = None
    journal_conference: Optional[str] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    created_at: datetime
    analysis: Optional[PaperAnalysisResponse] = None

    class Config:
        from_attributes = True

# Job Status Schema
class JobStatusResponse(BaseModel):
    job_id: str
    project_id: str
    status: str
    progress_pct: int
    step: str
    error_message: Optional[str] = None

# Chat / RAG Schemas
class ChatRequest(BaseModel):
    project_id: str
    question: str
    paper_id: Optional[str] = None  # None = across all papers in project

class SourceCitation(BaseModel):
    paper_id: str
    paper_title: str
    section: Optional[str] = None
    page_number: Optional[int] = None
    snippet: str

class ChatResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceCitation]
    created_at: datetime

# Comparison Schemas
class ComparisonRequest(BaseModel):
    project_id: str
    paper_ids: List[str]

class ComparisonMatrixItem(BaseModel):
    paper_id: str
    paper_title: str
    authors: Optional[str] = None
    year: Optional[int] = None
    research_problem: Optional[str] = None
    objective: Optional[str] = None
    methodology: Optional[str] = None
    algorithm: Optional[str] = None
    dataset: Optional[str] = None
    dataset_size: Optional[str] = None
    metrics: Optional[str] = None
    main_result: Optional[str] = None
    strengths: Optional[str] = None
    limitations: Optional[str] = None
    future_work: Optional[str] = None

class AISynthesisResponse(BaseModel):
    overall_comparison: str
    methodology_comparison: str
    dataset_comparison: str
    performance_comparison: str
    strengths_weaknesses: str
    common_limitations: str
    best_suited_approach: str
    potential_research_direction: str

class ComparisonResponse(BaseModel):
    matrix: List[ComparisonMatrixItem]
    ai_synthesis: Optional[AISynthesisResponse] = None

# Analytics & Insights Schemas
class PairwiseDetail(BaseModel):
    paper1_id: str
    paper2_id: str
    paper1_title: str
    paper2_title: str
    similarity_score: float
    rationale: str
    shared_keywords: List[str] = []
    paper1_objective: Optional[str] = None
    paper2_objective: Optional[str] = None

class Paper2DPoint(BaseModel):
    id: str
    title: str
    x: float
    y: float

class SimilarityMatrixResponse(BaseModel):
    paper_ids: List[str]
    paper_titles: List[str]
    matrix: List[List[float]]
    points_2d: Optional[List[Paper2DPoint]] = []
    pairwise_details: Optional[Dict[str, PairwiseDetail]] = {}

class ResearchGapItem(BaseModel):
    title: str
    description: str
    confidence_level: str  # "High" | "Medium" | "Low"
    evidence_count: int
    evidence_papers: List[str]  # paper titles

class ResearchGapAnalysisResponse(BaseModel):
    common_limitations: List[Dict[str, Any]]
    potential_research_directions: List[ResearchGapItem]
    author_stated_future_work: List[Dict[str, Any]]

class TopicItem(BaseModel):
    topic_id: int
    name: str
    keywords: List[str]
    paper_count: int
    papers: List[str]

class ResearchTrendsResponse(BaseModel):
    top_algorithms: List[Dict[str, Any]]
    top_topics: List[TopicItem]
    top_datasets: List[Dict[str, Any]]
    timeline: List[Dict[str, Any]]

# Citation Generator Schema
class CitationItem(BaseModel):
    paper_id: str
    paper_title: str
    apa: str
    ieee: str
    mla: str
    bibtex: str

# Settings Schema
class SettingsUpdateRequest(BaseModel):
    llm_provider: str
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    ollama_base_url: Optional[str] = None
    llm_model: Optional[str] = None
