from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.schema import PaperChunk, Paper
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService

class RAGService:
    @staticmethod
    def answer_question(
        project_id: str,
        question: str,
        paper_id: str = None,
        paper_title_map: Dict[str, str] = None,
        papers: List[Paper] = None,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """Perform semantic retrieval and generate grounded RAG answer in simple terms."""
        if paper_title_map is None:
            paper_title_map = {}

        # 1. If project index not in memory and db is provided, auto-rebuild from PaperChunk table
        if project_id not in EmbeddingService._project_indices and db:
            try:
                db_chunks = db.query(PaperChunk).join(Paper).filter(Paper.project_id == project_id).all()
                if db_chunks:
                    chunks_data = [
                        {
                            "chunk_id": c.id,
                            "paper_id": c.paper_id,
                            "chunk_text": c.chunk_text,
                            "section": c.section or "General",
                            "page_number": c.page_number or 1
                        }
                        for c in db_chunks
                    ]
                    EmbeddingService.build_project_index(project_id, chunks_data)
            except Exception as e:
                print(f"[RAGService] Error auto-rebuilding vector index: {e}")

        # 2. Retrieve top relevant chunks from FAISS
        relevant_chunks = EmbeddingService.search_similar_chunks(
            project_id=project_id,
            query=question,
            top_k=5,
            paper_id=paper_id
        )

        context_parts = []
        sources = []

        if relevant_chunks:
            for c in relevant_chunks:
                p_id = c.get("paper_id", "")
                title = paper_title_map.get(p_id, "Uploaded Paper")
                section = c.get("section", "General")
                page_num = c.get("page_number", 1)
                snippet = c.get("chunk_text", "")

                context_parts.append(
                    f"--- SOURCE: {title} (Section: {section}, Page: {page_num}) ---\n{snippet}\n"
                )
                sources.append({
                    "paper_id": p_id,
                    "paper_title": title,
                    "section": section,
                    "page_number": page_num,
                    "snippet": snippet[:250] + ("..." if len(snippet) > 250 else "")
                })

        # 3. If chunks are insufficient, supplement with structured Paper and PaperAnalysis data
        if papers and (not context_parts or len(context_parts) < 2):
            active_papers = [p for p in papers if not paper_id or p.id == paper_id]
            for p in active_papers:
                an = p.analysis
                meta_parts = [
                    f"Paper Title: {p.title}",
                    f"Abstract: {p.abstract or 'N/A'}"
                ]
                if p.raw_text:
                    meta_parts.append(f"Content Excerpt: {p.raw_text[:2500]}")
                if an:
                    if an.research_problem: meta_parts.append(f"Research Problem: {an.research_problem}")
                    if an.objectives: meta_parts.append(f"Objectives: {an.objectives}")
                    if an.methodology: meta_parts.append(f"Methodology: {an.methodology}")
                    if an.algorithms: meta_parts.append(f"Algorithms: {an.algorithms}")
                    if an.models: meta_parts.append(f"Models & Architectures: {an.models}")
                    if an.dataset_name: meta_parts.append(f"Dataset: {an.dataset_name} (Size: {an.dataset_size or 'N/A'})")
                    if an.evaluation_metrics: meta_parts.append(f"Evaluation Metrics: {an.evaluation_metrics}")
                    if an.results_summary: meta_parts.append(f"Results: {an.results_summary}")
                    if an.accuracy: meta_parts.append(f"Accuracy: {an.accuracy}")
                    if an.limitations: meta_parts.append(f"Limitations: {an.limitations}")
                    if an.proposed_solution: meta_parts.append(f"Proposed Solution: {an.proposed_solution}")
                
                context_parts.append("\n".join(meta_parts))

        context_str = "\n\n".join(context_parts)

        # 4. Formulate Prompt
        prompt = f"""
You are a helpful AI Research Assistant.
Answer the user's question clearly, thoroughly, and accurately using the research paper information below.
Explain your answer in SIMPLE, CLEAR, and EASILY UNDERSTANDABLE language with clean formatting (bullet points where appropriate).
Avoid unnecessary complex jargon.
Do not include citation headers or section tags in your answer.

Research Paper Context:
{context_str if context_str.strip() else "No detailed excerpts available."}

User Question: {question}

Answer:
"""
        system_instruction = "You are a friendly, knowledgeable AI research assistant who explains scientific paper concepts, methods, results, and limitations in simple, clear, and easy-to-understand terms."
        answer = LLMService.generate_text(prompt, system_instruction)

        return {
            "question": question,
            "answer": answer,
            "sources": sources
        }
