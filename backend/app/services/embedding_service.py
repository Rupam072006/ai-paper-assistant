import numpy as np
import os
import faiss
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Tuple
from app.config import settings

class EmbeddingService:
    _model = None
    # Storage for project FAISS indices: { project_id: (faiss.IndexFlatIP, list_of_metadata) }
    _project_indices: Dict[str, Tuple[Any, List[Dict[str, Any]]]] = {}

    @classmethod
    def get_model(cls) -> SentenceTransformer:
        if cls._model is None:
            # Load Sentence Transformers model
            cls._model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return cls._model

    @classmethod
    def generate_embeddings(cls, texts: List[str]) -> np.ndarray:
        model = cls.get_model()
        embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings

    @classmethod
    def build_project_index(cls, project_id: str, chunks_data: List[Dict[str, Any]]):
        """Build or update a FAISS vector index for all chunks in a project."""
        if not chunks_data:
            return

        texts = [c["chunk_text"] for c in chunks_data]
        embeddings = cls.generate_embeddings(texts)
        dimension = embeddings.shape[1]

        # Inner product on L2-normalized vectors = Cosine Similarity
        index = faiss.IndexFlatIP(dimension)
        index.add(embeddings.astype(np.float32))

        cls._project_indices[project_id] = (index, chunks_data)

    @classmethod
    def search_similar_chunks(cls, project_id: str, query: str, top_k: int = 4, paper_id: str = None) -> List[Dict[str, Any]]:
        """Query FAISS index for top-k relevant chunks."""
        if project_id not in cls._project_indices:
            return []

        index, metadata = cls._project_indices[project_id]
        if index.ntotal == 0:
            return []

        query_vec = cls.generate_embeddings([query]).astype(np.float32)
        # Search extra candidates if filtering by paper_id
        k_search = min(index.ntotal, top_k * 4 if paper_id else top_k)
        scores, indices = index.search(query_vec, k_search)

        results = []
        for idx, score in zip(indices[0], scores[0]):
            if idx < 0 or idx >= len(metadata):
                continue
            chunk = metadata[idx]
            if paper_id and chunk.get("paper_id") != paper_id:
                continue
            
            item = dict(chunk)
            item["score"] = float(score)
            results.append(item)
            if len(results) >= top_k:
                break

        return results

    @classmethod
    def compute_similarity_matrix(cls, paper_texts: List[str]) -> List[List[float]]:
        """Compute NxN Cosine Similarity matrix for paper texts."""
        if not paper_texts:
            return []

        # Use first 3000 chars of each paper for full document similarity representation
        sampled_texts = [t[:3000] for t in paper_texts]
        embeddings = cls.generate_embeddings(sampled_texts)  # (N, D)
        
        # Dot product of normalized vectors yields cosine similarity
        sim_matrix = np.dot(embeddings, embeddings.T)
        
        # Convert to percentage (0 - 100) and round
        matrix_list = []
        for i in range(sim_matrix.shape[0]):
            row = []
            for j in range(sim_matrix.shape[1]):
                val = float(sim_matrix[i, j])
                val = max(0.0, min(1.0, val))  # clamp
                val_pct = round(val * 100.0, 1)
                if i == j:
                    val_pct = 100.0
                row.append(val_pct)
            matrix_list.append(row)

        return matrix_list
