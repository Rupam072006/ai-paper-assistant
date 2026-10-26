from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.schema import Paper, Project, User
from app.schemas.schemas import SimilarityMatrixResponse, ResearchTrendsResponse, ResearchGapAnalysisResponse, CitationItem
from app.api.auth import get_current_user
from app.services.embedding_service import EmbeddingService
from app.services.research_gap_service import ResearchGapService

from app.services.similarity_service import SimilarityService

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/similarity/{project_id}", response_model=SimilarityMatrixResponse)
def get_semantic_similarity(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).order_by(Paper.created_at.asc()).all()
    if not papers:
        return SimilarityMatrixResponse(paper_ids=[], paper_titles=[], matrix=[], points_2d=[], pairwise_details={})

    res_data = SimilarityService.compute_full_similarity_analysis(papers)
    return SimilarityMatrixResponse(**res_data)

@router.get("/trends/{project_id}", response_model=ResearchTrendsResponse)
def get_research_trends(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).all()
    if not papers:
        return ResearchTrendsResponse(top_algorithms=[], top_topics=[], top_datasets=[], timeline=[])

    algo_counts: Dict[str, int] = {}
    dataset_counts: Dict[str, int] = {}
    timeline_map: Dict[int, List[str]] = {}

    for p in papers:
        an = p.analysis
        year = p.publication_year or 2024
        
        if year not in timeline_map:
            timeline_map[year] = []
        
        if an and an.algorithms:
            algos = [a.strip() for a in an.algorithms.split(",") if a.strip()]
            for a in algos:
                algo_counts[a] = algo_counts.get(a, 0) + 1
                timeline_map[year].append(a)

        if an and an.dataset_name:
            ds = an.dataset_name.strip()
            dataset_counts[ds] = dataset_counts.get(ds, 0) + 1

    top_algos = [{"algorithm": k, "count": v} for k, v in sorted(algo_counts.items(), key=lambda x: x[1], reverse=True)]
    top_datasets = [{"dataset": k, "count": v} for k, v in sorted(dataset_counts.items(), key=lambda x: x[1], reverse=True)]

    topics = [
        {
            "topic_id": 1,
            "name": "Natural Language Processing & Transformer Architecture",
            "keywords": ["BERT", "Transformer", "Attention", "Embeddings"],
            "paper_count": len(papers),
            "papers": [p.title for p in papers[:3]]
        },
        {
            "topic_id": 2,
            "name": "Supervised Benchmark Evaluation & Classification",
            "keywords": ["F1-Score", "Accuracy", "Metrics", "Dataset"],
            "paper_count": max(1, len(papers) - 1),
            "papers": [p.title for p in papers[-2:]]
        }
    ]

    timeline_list = [
        {
            "year": yr,
            "algorithms": list(set(algos)),
            "paper_count": len([p for p in papers if p.publication_year == yr])
        }
        for yr, algos in sorted(timeline_map.items())
    ]

    return ResearchTrendsResponse(
        top_algorithms=top_algos,
        top_topics=topics,
        top_datasets=top_datasets,
        timeline=timeline_list
    )

@router.get("/research-gaps/{project_id}", response_model=ResearchGapAnalysisResponse)
def get_research_gaps(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).all()

    papers_data = [
        {
            "id": p.id,
            "title": p.title,
            "analysis": {
                "limitations": p.analysis.limitations if p.analysis else "",
                "future_work": p.analysis.future_work if p.analysis else "",
                "dataset_name": p.analysis.dataset_name if p.analysis else ""
            }
        }
        for p in papers
    ]

    gaps_result = ResearchGapService.analyze_gaps_and_trends(papers_data)
    return ResearchGapAnalysisResponse(**gaps_result)

@router.get("/citations/{project_id}", response_model=List[CitationItem])
def get_citations(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).order_by(Paper.created_at.asc()).all()

    citations = []
    for p in papers:
        authors = p.authors or "Unknown Authors"
        title = p.title or "Untitled Research Paper"
        year = str(p.publication_year or 2024)
        journal = p.journal_conference or "Proceedings of Academic Research"

        apa = f"{authors} ({year}). {title}. {journal}."
        ieee = f'{authors}, "{title}," {journal}, {year}.'
        mla = f'{authors}. "{title}." {journal}, {year}.'

        first_author = authors.split()[0].replace(",", "") if authors else "Author"
        first_word = title.split()[0] if title else "Paper"
        bib_key = f"{first_author}{year}{first_word}".lower()
        bibtex = f"@article{{{bib_key},\n  author = {{{authors}}},\n  title = {{{title}}},\n  journal = {{{journal}}},\n  year = {{{year}}}\n}}"

        citations.append(CitationItem(
            paper_id=p.id,
            paper_title=title,
            apa=apa,
            ieee=ieee,
            mla=mla,
            bibtex=bibtex
        ))

    return citations
