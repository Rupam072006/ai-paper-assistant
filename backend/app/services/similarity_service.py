import numpy as np
from typing import List, Dict, Any
from app.services.embedding_service import EmbeddingService

class SimilarityService:

    @classmethod
    def compute_full_similarity_analysis(cls, papers: List[Any]) -> Dict[str, Any]:
        if not papers:
            return {
                "paper_ids": [],
                "paper_titles": [],
                "matrix": [],
                "points_2d": [],
                "pairwise_details": {}
            }

        paper_ids = [p.id for p in papers]
        paper_titles = [p.title for p in papers]
        paper_texts = [(p.abstract or "") + "\n" + (p.raw_text or "")[:3000] for p in papers]

        # 1. Compute cosine similarity matrix
        sim_matrix = EmbeddingService.compute_similarity_matrix(paper_texts)

        # 2. Compute 2D PCA projections from embeddings
        embeddings = EmbeddingService.generate_embeddings([t[:3000] for t in paper_texts])
        points_2d = cls._compute_2d_pca(embeddings, paper_ids, paper_titles)

        # 3. Build Pairwise Semantic Details
        pairwise_details = {}
        n = len(papers)
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                p1, p2 = papers[i], papers[j]
                key = f"{i}_{j}"
                alt_key = f"{p1.id}_{p2.id}"

                an1 = p1.analysis
                an2 = p2.analysis

                # Extract keywords & algorithms
                kw1 = cls._extract_tags(p1)
                kw2 = cls._extract_tags(p2)
                shared_kw = [k for k in kw1 if k in kw2]
                if not shared_kw:
                    shared_kw = list(set(kw1[:3] + kw2[:3]))

                score = sim_matrix[i][j]
                
                # Formulate 2-sentence rationale
                rationale = cls._generate_rationale(p1, p2, score, shared_kw)

                obj1 = (an1.research_problem or an1.objectives or p1.abstract or "Objective not explicitly stated.") if an1 else (p1.abstract or "No abstract provided.")
                obj2 = (an2.research_problem or an2.objectives or p2.abstract or "Objective not explicitly stated.") if an2 else (p2.abstract or "No abstract provided.")

                detail = {
                    "paper1_id": p1.id,
                    "paper2_id": p2.id,
                    "paper1_title": p1.title,
                    "paper2_title": p2.title,
                    "similarity_score": score,
                    "rationale": rationale,
                    "shared_keywords": shared_kw[:6],
                    "paper1_objective": obj1[:300],
                    "paper2_objective": obj2[:300]
                }
                pairwise_details[key] = detail
                pairwise_details[alt_key] = detail

        return {
            "paper_ids": paper_ids,
            "paper_titles": paper_titles,
            "matrix": sim_matrix,
            "points_2d": points_2d,
            "pairwise_details": pairwise_details
        }

    @classmethod
    def _compute_2d_pca(cls, embeddings: np.ndarray, paper_ids: List[str], paper_titles: List[str]) -> List[Dict[str, Any]]:
        n = len(embeddings)
        if n == 0:
            return []
        if n == 1:
            return [{"id": paper_ids[0], "title": paper_titles[0], "x": 50.0, "y": 50.0}]

        # Center embeddings
        mean_vec = np.mean(embeddings, axis=0)
        X_centered = embeddings - mean_vec

        try:
            U, S, Vt = np.linalg.svd(X_centered, full_matrices=False)
            coords = np.dot(U[:, :2], np.diag(S[:2]))

            # Scale to range [15, 85] for graph canvas
            x_vals = coords[:, 0]
            y_vals = coords[:, 1] if coords.shape[1] > 1 else np.zeros(n)

            x_min, x_max = x_vals.min(), x_vals.max()
            y_min, y_max = y_vals.min(), y_vals.max()

            norm_x = (x_vals - x_min) / (x_max - x_min + 1e-6) * 70.0 + 15.0
            norm_y = (y_vals - y_min) / (y_max - y_min + 1e-6) * 70.0 + 15.0

            result = []
            for idx in range(n):
                result.append({
                    "id": paper_ids[idx],
                    "title": paper_titles[idx],
                    "x": round(float(norm_x[idx]), 2),
                    "y": round(float(norm_y[idx]), 2)
                })
            return result
        except Exception:
            # Fallback circle projection
            result = []
            for idx in range(n):
                angle = (2 * np.pi * idx) / n
                result.append({
                    "id": paper_ids[idx],
                    "title": paper_titles[idx],
                    "x": round(50.0 + 35.0 * np.cos(angle), 2),
                    "y": round(50.0 + 35.0 * np.sin(angle), 2)
                })
            return result

    @classmethod
    def _extract_tags(cls, paper: Any) -> List[str]:
        tags = []
        an = paper.analysis
        if an:
            if an.algorithms:
                tags.extend([a.strip() for a in an.algorithms.split(",") if a.strip()])
            if an.dataset_name:
                tags.append(an.dataset_name.strip())
            if an.methodology:
                tags.extend([m.strip() for m in an.methodology.split(",") if m.strip()])
            if an.keywords:
                tags.extend([k.strip() for k in an.keywords.split(",") if k.strip()])
        if not tags:
            tags = ["Transformer", "NLP", "Machine Learning", "Neural Network"]
        return list(dict.fromkeys(tags))

    @classmethod
    def _generate_rationale(cls, p1: Any, p2: Any, score: float, shared_kw: List[str]) -> str:
        kw_str = ", ".join(shared_kw[:3]) if shared_kw else "shared methodology"
        if score >= 75.0:
            return f"Paper 1 ('{p1.title[:40]}...') and Paper 2 ('{p2.title[:40]}...') display high semantic correlation ({score}%). Both studies align around {kw_str} and investigate complementary model architectures."
        elif score >= 50.0:
            return f"Paper 1 ('{p1.title[:40]}...') and Paper 2 ('{p2.title[:40]}...') share moderate domain overlap ({score}%). They utilize related evaluation paradigms and intersecting concepts in {kw_str}."
        else:
            return f"Paper 1 ('{p1.title[:40]}...') and Paper 2 ('{p2.title[:40]}...') have distinct research focuses ({score}% similarity). While both operate within computer science, they tackle different problems with limited methodology overlap."
