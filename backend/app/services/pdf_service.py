import fitz  # PyMuPDF
import hashlib
import re
from typing import List, Dict, Any, Tuple

class PDFService:
    @staticmethod
    def compute_sha256(file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    @staticmethod
    def extract_text_and_pages(file_path: str) -> Tuple[str, List[Dict[str, Any]]]:
        """Extract full text and page-by-page structured text."""
        doc = fitz.open(file_path)
        full_text_list = []
        pages_data = []

        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text("text")
            full_text_list.append(text)
            pages_data.append({
                "page_number": page_num + 1,
                "text": text
            })

        full_text = "\n\n".join(full_text_list)
        return full_text, pages_data

    @staticmethod
    def detect_title_and_authors(full_text: str, file_name: str) -> Tuple[str, str, int, str]:
        """Detect title, authors, publication year, and abstract from raw text heuristics."""
        lines = [line.strip() for line in full_text.split("\n") if line.strip()]
        
        # Clean title heuristic
        title = file_name.replace(".pdf", "").replace("_", " ").replace("-", " ").title()
        if len(lines) > 0 and len(lines[0]) < 200:
            candidate = lines[0]
            if not candidate.lower().startswith(("arxiv", "vol.", "journal", "proceedings")):
                title = candidate

        # Authors heuristic (usually lines 2-5 before Abstract)
        authors = "Not specified"
        author_lines = []
        for line in lines[1:8]:
            if line.lower().startswith("abstract") or line.lower().startswith("introduction"):
                break
            if len(line) < 150 and not re.search(r'\b(abstract|contents|university|department|email)\b', line, re.I):
                author_lines.append(line)
        if author_lines:
            authors = ", ".join(author_lines[:2])

        # Year heuristic
        year_match = re.search(r'\b(20[0-2][0-9]|19[9-9][0-9])\b', full_text[:2000])
        year = int(year_match.group(1)) if year_match else 2024

        # Abstract heuristic
        abstract = ""
        abstract_match = re.search(r'(?i)abstract[:\s\n]+(.*?)(?=\n\s*(?:1\.?|I\.?|introduction|keywords|index terms)|\Z)', full_text, re.DOTALL)
        if abstract_match:
            abstract = abstract_match.group(1).strip()
            # Cap at reasonable length if regex over-matched
            if len(abstract) > 2500:
                abstract = abstract[:2500] + "..."
        else:
            # Fallback abstract: first 1000 characters
            abstract = full_text[:1000].strip() + "..."

        return title, authors, year, abstract

    @staticmethod
    def extract_sections(full_text: str) -> Dict[str, str]:
        """Divide text into recognized academic sections."""
        section_patterns = {
            "Abstract": r'(?i)\babstract\b',
            "Introduction": r'(?i)\b(?:1\.?\s*|I\.?\s*)?introduction\b',
            "Related Work": r'(?i)\b(?:2\.?\s*|II\.?\s*)?(?:related work|literature review|background)\b',
            "Methodology": r'(?i)\b(?:3\.?\s*|III\.?\s*)?(?:methodology|proposed method|model|architecture|approach)\b',
            "Experiments & Results": r'(?i)\b(?:4\.?\s*|IV\.?\s*)?(?:experiments|results|evaluation|experimental setup)\b',
            "Discussion & Limitations": r'(?i)\b(?:5\.?\s*|V\.?\s*)?(?:discussion|limitations|threats to validity)\b',
            "Conclusion & Future Work": r'(?i)\b(?:6\.?\s*|VI\.?\s*)?(?:conclusion|future work|concluding remarks)\b',
            "References": r'(?i)\b(?:references|bibliography)\b'
        }

        sections = {}
        # Find matches and indices
        matches = []
        for sec_name, pattern in section_patterns.items():
            for m in re.finditer(pattern, full_text):
                matches.append((m.start(), sec_name))
        
        matches.sort(key=lambda x: x[0])

        if not matches:
            sections["Body"] = full_text
            return sections

        for i in range(len(matches)):
            start_pos, sec_name = matches[i]
            end_pos = matches[i+1][0] if i + 1 < len(matches) else len(full_text)
            content = full_text[start_pos:end_pos].strip()
            sections[sec_name] = content

        return sections

    @staticmethod
    def extract_references(full_text: str) -> List[Dict[str, Any]]:
        """Extract structured list of references."""
        refs_match = re.search(r'(?i)\b(?:references|bibliography)\b[\s\S]*$', full_text)
        if not refs_match:
            return []

        ref_block = refs_match.group(0)
        # Split by typical reference brackets [1], [2] or 1., 2.
        raw_refs = re.split(r'\n(?=\[\d+\]|\d+\.\s+[A-Z])', ref_block)
        
        parsed_refs = []
        for idx, ref in enumerate(raw_refs[1:30], start=1):  # take top 30
            clean_ref = ref.strip().replace('\n', ' ')
            if len(clean_ref) > 15:
                parsed_refs.append({
                    "ref_id": f"[{idx}]",
                    "text": clean_ref[:300]
                })

        return parsed_refs

    @staticmethod
    def create_chunks(pages_data: List[Dict[str, Any]], chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, Any]]:
        """Split document into ~500 token chunks with section and page tagging."""
        chunks = []
        chunk_idx = 0

        for page in pages_data:
            page_num = page["page_number"]
            words = page["text"].split()
            
            if not words:
                continue

            i = 0
            while i < len(words):
                chunk_words = words[i : i + chunk_size]
                chunk_text = " ".join(chunk_words)
                
                # Guess section context
                section = "General"
                lower_chunk = chunk_text[:100].lower()
                if "abstract" in lower_chunk:
                    section = "Abstract"
                elif "introduction" in lower_chunk:
                    section = "Introduction"
                elif "method" in lower_chunk or "architecture" in lower_chunk:
                    section = "Methodology"
                elif "result" in lower_chunk or "experiment" in lower_chunk:
                    section = "Experiments"
                elif "conclusion" in lower_chunk or "future" in lower_chunk:
                    section = "Conclusion"

                chunks.append({
                    "chunk_index": chunk_idx,
                    "chunk_text": chunk_text,
                    "section": section,
                    "page_number": page_num
                })
                
                chunk_idx += 1
                i += (chunk_size - overlap)

        return chunks
