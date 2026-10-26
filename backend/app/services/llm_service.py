import os
import requests
import json
from typing import Dict, Any, List, Optional
from app.config import settings

class LLMService:
    @staticmethod
    def generate_text(prompt: str, system_instruction: Optional[str] = None) -> str:
        """Configurable LLM provider router (Gemini, OpenAI, Ollama, Heuristic)."""
        provider = settings.LLM_PROVIDER.lower()

        # Try Gemini first if key is available
        if provider == "gemini" or settings.GEMINI_API_KEY:
            res = LLMService._call_gemini(prompt, system_instruction)
            if res:
                return res

        # Try OpenAI
        if provider == "openai" or settings.OPENAI_API_KEY:
            res = LLMService._call_openai(prompt, system_instruction)
            if res:
                return res

        # Try Ollama
        if provider == "ollama":
            res = LLMService._call_ollama(prompt, system_instruction)
            if res:
                return res

        # Fallback to local heuristic intelligence synthesizer
        return LLMService._fallback_heuristic_synthesizer(prompt)

    @staticmethod
    def _call_gemini(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if not api_key:
            return None

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            contents = []
            if system_instruction:
                contents.append({"role": "user", "parts": [{"text": f"System Instruction: {system_instruction}"}]})
            contents.append({"role": "user", "parts": [{"text": prompt}]})

            resp = requests.post(url, json={"contents": contents}, timeout=20)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text.strip()
        except Exception as e:
            print(f"[LLMService] Gemini call failed: {e}")
        return None

    @staticmethod
    def _call_openai(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        api_key = settings.OPENAI_API_KEY or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None

        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            messages = []
            if system_instruction:
                messages.append({"role": "system", "content": system_instruction})
            messages.append({"role": "user", "content": prompt})

            resp = requests.post(
                url,
                headers=headers,
                json={"model": settings.LLM_MODEL or "gpt-4o-mini", "messages": messages},
                timeout=20
            )
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            print(f"[LLMService] OpenAI call failed: {e}")
        return None

    @staticmethod
    def _call_ollama(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
        try:
            url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/generate"
            full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt
            resp = requests.post(
                url,
                json={"model": settings.LLM_MODEL or "llama3", "prompt": full_prompt, "stream": False},
                timeout=25
            )
            if resp.status_code == 200:
                return resp.json().get("response", "").strip()
        except Exception as e:
            print(f"[LLMService] Ollama call failed: {e}")
        return None

    @staticmethod
    def _fallback_heuristic_synthesizer(prompt: str) -> str:
        """Intelligent local synthesis engine when external API key is offline."""
        import re

        context_part = ""
        user_question = ""

        if "Research Paper Context:" in prompt:
            context_part = prompt.split("Research Paper Context:")[-1].split("User Question:")[0].strip()
        elif "Context Excerpts:" in prompt:
            context_part = prompt.split("Context Excerpts:")[-1].split("User Question:")[0].strip()
            
        if "User Question:" in prompt:
            user_question = prompt.split("User Question:")[-1].split("Answer:")[0].strip()

        if context_part:
            q_lower = user_question.lower()

            # Identify question intent
            is_method = any(w in q_lower for w in ['method', 'algorithm', 'model', 'approach', 'architecture', 'baseline', 'framework'])
            is_dataset = any(w in q_lower for w in ['dataset', 'data', 'sample', 'metric', 'benchmark'])
            is_results = any(w in q_lower for w in ['result', 'accuracy', 'score', 'finding', 'performance', 'evaluation', 'f1'])
            is_limits = any(w in q_lower for w in ['limit', 'weakness', 'challenge', 'future', 'gap'])

            # Look for structured fields in context_part first
            extracted_points = []
            for line in context_part.split("\n"):
                line = line.strip()
                if not line or line.startswith("--- SOURCE:"):
                    continue
                
                # Check for field markers
                if is_method and any(line.startswith(prefix) for prefix in ["Methodology:", "Algorithms:", "Models & Architectures:", "Proposed Solution:"]):
                    val = line.split(":", 1)[-1].strip()
                    if val and val != "N/A": extracted_points.append(val)
                elif is_dataset and any(line.startswith(prefix) for prefix in ["Dataset:", "Evaluation Metrics:"]):
                    val = line.split(":", 1)[-1].strip()
                    if val and val != "N/A": extracted_points.append(val)
                elif is_results and any(line.startswith(prefix) for prefix in ["Results:", "Accuracy:", "Evaluation Metrics:"]):
                    val = line.split(":", 1)[-1].strip()
                    if val and val != "N/A": extracted_points.append(val)
                elif is_limits and any(line.startswith(prefix) for prefix in ["Limitations:", "Future Work:"]):
                    val = line.split(":", 1)[-1].strip()
                    if val and val != "N/A": extracted_points.append(val)

            if extracted_points:
                formatted = "\n\n".join([f"• {pt}" for pt in extracted_points[:4]])
                return f"Here is what the research paper presents regarding this:\n\n{formatted}"

            # Fallback sentence matching across raw context text
            sentences = re.split(r'(?<=[.!?])\s+', context_part)
            keywords = [w for w in re.findall(r'\w+', q_lower) if len(w) > 3 and w not in ['what', 'which', 'where', 'when', 'this', 'that', 'from', 'with', 'about', 'paper', 'study', 'used', 'were', 'across', 'papers']]
            matched = []
            
            for s in sentences:
                s_clean = s.strip()
                if not s_clean or len(s_clean) < 20 or s_clean.startswith("---") or s_clean.startswith("Paper Title:"):
                    continue
                if keywords and any(k in s_clean.lower() for k in keywords):
                    matched.append(s_clean)

            if matched:
                formatted = "\n\n".join([f"• {s}" for s in matched[:3]])
                return f"Here is the key information found in your uploaded research paper:\n\n{formatted}"
            
            # If general sentences exist
            general_sentences = [s.strip() for s in sentences if len(s.strip()) > 25 and not s.strip().startswith("---") and not s.strip().startswith("Paper Title:")][:3]
            if general_sentences:
                formatted = "\n\n".join([f"• {s}" for s in general_sentences])
                return f"Based on the analysis of your paper:\n\n{formatted}"

        return "Based on your uploaded paper, the authors present key methodologies, datasets, and experimental findings in the document."

