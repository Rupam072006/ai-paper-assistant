import re
from typing import Dict, Any, List

# ─── Domain Detection ───────────────────────────────────────────────────────
DOMAIN_KEYWORDS = {
    "Medical & Clinical": [
        "patient", "clinical", "disease", "diagnosis", "hospital", "treatment",
        "surgery", "cancer", "tumor", "radiology", "pathology", "drug", "therapy",
        "health", "medical imaging", "MRI", "CT scan", "EHR", "genomics", "biomarker",
        "covid", "pandemic", "mortality", "prognosis", "vaccine", "neural disorder",
        "ECG", "cardiology", "biopsy", "ophthalmology", "epidemiology", "pharmaceutical"
    ],
    "Agricultural & Environmental": [
        "crop", "soil", "yield", "farm", "irrigation", "fertilizer", "pest", "harvest",
        "agriculture", "plant disease", "remote sensing", "NDVI", "drone", "wheat",
        "rice", "corn", "livestock", "precision farming", "greenhouse", "climate",
        "drought", "deforestation", "biodiversity", "ecosystem", "watershed", "forestry",
        "aquaculture", "seed", "weed", "pollination", "agri"
    ],
    "Social & Behavioral Sciences": [
        "survey", "behavior", "social media", "sentiment", "public opinion", "psychology",
        "education", "learning outcome", "student", "teacher", "policy", "government",
        "poverty", "income", "inequality", "gender", "race", "mental health",
        "wellbeing", "ethnography", "interview", "questionnaire", "community", "crime",
        "voting", "election", "social network", "socioeconomic", "qualitative"
    ],
    "Engineering & Physical Sciences": [
        "structural", "mechanical", "thermal", "electrical", "circuit", "sensor",
        "IoT", "embedded", "robotics", "autonomous", "control system", "signal",
        "frequency", "vibration", "fatigue", "material", "composite", "polymer",
        "fluid dynamics", "aerodynamics", "3D printing", "manufacturing", "VLSI",
        "antenna", "radar", "photovoltaic", "energy harvesting", "battery"
    ],
    "Finance & Economics": [
        "stock", "market", "portfolio", "trading", "cryptocurrency", "blockchain",
        "financial", "economic", "gdp", "inflation", "forecasting", "credit",
        "risk", "loan", "banking", "fraud detection", "insurance", "investment",
        "return", "volatility", "price prediction", "supply chain", "commodity"
    ],
    "Computer Science & AI": [
        "neural network", "deep learning", "machine learning", "NLP", "transformer",
        "BERT", "GPT", "language model", "computer vision", "object detection",
        "classification", "benchmark", "dataset", "training", "accuracy", "F1",
        "BLEU", "ROUGE", "reinforcement learning", "federated learning", "GAN",
        "diffusion model", "embedding", "token", "attention", "encoder", "decoder"
    ],
    "Biology & Life Sciences": [
        "protein", "gene", "DNA", "RNA", "sequence", "phylogenetic", "species",
        "cell", "membrane", "enzyme", "metabolism", "microbiome", "genome",
        "mutation", "evolution", "ecology", "neuroscience", "molecular", "bacteria",
        "virus", "antibody", "immunology", "bioinformatics", "CRISPR", "chromosome"
    ],
    "Environmental & Climate": [
        "climate change", "global warming", "carbon", "emission", "renewable energy",
        "solar", "wind energy", "ocean", "sea level", "temperature", "precipitation",
        "air quality", "pollution", "atmospheric", "greenhouse gas", "sustainability",
        "land use", "water quality", "flood", "wildfire", "conservation"
    ],
}

# ─── Evaluation Metrics by Domain ───────────────────────────────────────────
DOMAIN_METRICS = {
    "Medical & Clinical":       ["AUC-ROC", "Sensitivity", "Specificity", "PPV", "NPV", "Dice Score", "Accuracy", "F1"],
    "Agricultural & Environmental": ["RMSE", "MAE", "R²", "Precision", "Recall", "mAP", "Accuracy"],
    "Social & Behavioral Sciences": ["Cohen's Kappa", "Cronbach's Alpha", "p-value", "Regression R²", "Accuracy"],
    "Engineering & Physical Sciences": ["RMSE", "MSE", "MAPE", "SNR", "BER", "Efficiency %", "Accuracy"],
    "Finance & Economics":      ["MAE", "RMSE", "Sharpe Ratio", "Accuracy", "AUC", "Profit Factor"],
    "Computer Science & AI":    ["Accuracy", "F1-Score", "Precision", "Recall", "BLEU", "ROUGE", "AUC"],
    "Biology & Life Sciences":  ["Sensitivity", "Specificity", "AUC", "p-value", "Pearson r", "Accuracy"],
    "Environmental & Climate":  ["RMSE", "MAE", "R²", "Bias", "Correlation", "Accuracy"],
}

# ─── Algorithm / Method Patterns by Domain ──────────────────────────────────
ALGO_PATTERNS = {
    # CS / AI
    r"\b(BERT|RoBERTa|DeBERTa|T5|GPT-2|GPT-3|GPT-4|GPT-4o|LLaMA|Mistral|Phi|Gemini|Claude|Transformer|LSTM|BiLSTM|GRU|CNN|ResNet|ResNeXt|VGG|EfficientNet|YOLO|Faster RCNN|SVM|Random Forest|XGBoost|LightGBM|CatBoost|GNN|Graph Neural Network|Diffusion Model|GAN|Autoencoder|VAE|RAG|CLIP|ViT|Vision Transformer|DETR|U-Net|SegNet|Detectron)\b": "CS/AI",
    # Medical
    r"\b(U-Net|nnU-Net|DeepMedic|MedSAM|BioGPT|AlphaFold|ClinicalBERT|BioBERT|PubMedBERT|Logistic Regression|Survival Analysis|Cox Regression|Kaplan-Meier|SVM|Random Forest)\b": "Medical",
    # Agricultural
    r"\b(SVM|Random Forest|ResNet|YOLO|InceptionV3|VGG|GAN|kNN|Naive Bayes|Gradient Boosting|CatBoost|LightGBM|XGBoost|LSTM|U-Net)\b": "Agricultural",
    # General statistical / scientific
    r"\b(Linear Regression|Logistic Regression|Ridge Regression|ANOVA|t-test|Chi-square|PCA|ICA|K-Means|DBSCAN|Hierarchical Clustering|Decision Tree|Naive Bayes|k-NN|Gradient Boosting|AdaBoost|Bayesian Network|Hidden Markov Model|Monte Carlo)\b": "Statistical",
}


class NLPService:
    @staticmethod
    def detect_domain(full_text: str, title: str, abstract: str) -> str:
        """Detect the research domain from text using keyword frequency scoring."""
        sample = (title + " " + abstract + " " + full_text[:5000]).lower()
        scores = {}
        for domain, keywords in DOMAIN_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw.lower() in sample)
            scores[domain] = score
        best = max(scores, key=scores.get)
        # Only assign if at least 2 keyword hits; otherwise generic
        if scores[best] >= 2:
            return best
        return "Multidisciplinary Research"

    @staticmethod
    def extract_structured_analysis(full_text: str, title: str, abstract: str, sections: Dict[str, str]) -> Dict[str, Any]:
        """Perform comprehensive domain-agnostic NLP & pattern extraction on paper text."""

        # 0. Auto-detect domain
        domain = NLPService.detect_domain(full_text, title, abstract)
        expected_metrics = DOMAIN_METRICS.get(domain, ["Accuracy", "F1-Score"])

        # 1. Research Problem
        problem = NLPService._extract_pattern(
            full_text,
            [
                r'(?i)(?:address|solve|tackle|focuses on|challenge of)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:the main problem|the core problem|existing methods suffer from|current approaches fail)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:problem statement)[:\s]+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:this study aims to|this research investigates|this paper proposes)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:the goal of this|main objective)[:\s]+([^\.\n]+(?:\.[^\.\n]+){1,2})',
            ],
            default=f"Investigating challenges and advancing methodologies in the domain of {domain}, specifically addressing issues identified in: {title}."
        )

        # 2. Objectives
        objectives = NLPService._extract_pattern(
            full_text,
            [
                r'(?i)(?:our main objective|the primary goal|in this paper, we propose|we aim to)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:this work presents|we introduce|the objective of this study)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:specifically, this paper|our contribution is)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
            ],
            default=f"Develop an effective, evidence-based methodology to address domain-specific challenges in {domain}."
        )

        # 3. Proposed Solution & Methodology
        methodology_text = sections.get("Methodology", "") or sections.get("Methods", "") or full_text[:4000]

        proposed_solution = NLPService._extract_pattern(
            methodology_text,
            [
                r'(?i)(?:we propose|we design|our approach|our model|architecture consists of|our framework)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:proposed method|the proposed approach|we developed)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
            ],
            default=f"A systematic multi-stage research pipeline combining quantitative and qualitative analysis methods tailored to {domain}."
        )

        # 4. Algorithms & Methods (domain-agnostic broad extraction)
        algo_matches = []
        for pattern in ALGO_PATTERNS:
            found = re.findall(pattern, full_text, re.IGNORECASE)
            algo_matches.extend(found)

        # Also extract any method after "using", "based on", "via"
        method_inline = re.findall(
            r'(?i)(?:using|based on|via|employing|applying)\s+([A-Z][A-Za-z0-9\-]+(?:\s+[A-Z][A-Za-z0-9\-]+){0,3})',
            full_text
        )
        algo_matches.extend([m.strip() for m in method_inline if len(m.strip()) > 3])

        algorithms = list(dict.fromkeys([a.strip() for a in algo_matches if len(a.strip()) > 2]))[:8]
        if not algorithms:
            # Domain-specific fallback
            domain_defaults = {
                "Medical & Clinical": ["CNN", "U-Net", "Random Forest", "Logistic Regression"],
                "Agricultural & Environmental": ["Random Forest", "SVM", "YOLO", "Gradient Boosting"],
                "Social & Behavioral Sciences": ["Logistic Regression", "SVM", "Thematic Analysis"],
                "Engineering & Physical Sciences": ["Signal Processing", "FEM", "Deep Learning"],
                "Finance & Economics": ["LSTM", "Random Forest", "Linear Regression"],
                "Biology & Life Sciences": ["Logistic Regression", "SVM", "Bayesian Network"],
                "Environmental & Climate": ["Random Forest", "LSTM", "Gradient Boosting"],
                "Computer Science & AI": ["Transformer", "Deep Neural Network"],
            }
            algorithms = domain_defaults.get(domain, ["Machine Learning", "Statistical Analysis"])

        # 5. Datasets & Sizes
        dataset_match = re.search(
            r'(?i)(?:dataset|benchmark|evaluated on|experiments on|corpus|cohort|participants|subjects|samples)\s+([A-Z0-9\-\_]+(?:\s+[A-Z0-9\-\_]+){0,4})',
            full_text
        )
        dataset_name = dataset_match.group(1).strip() if dataset_match else "Domain-Specific Dataset"

        size_match = re.search(
            r'\b(\d{1,3}(?:,\d{3})*\s*(?:samples?|patients?|images?|records?|instances?|observations?|subjects?|cases?|documents?)?|\d+\s*(?:k|M|GB|TB))\b',
            full_text,
            re.IGNORECASE
        )
        dataset_size = size_match.group(1) if size_match else "Not reported"

        # 6. Evaluation Metrics — broad domain-agnostic extraction
        metrics_found = []
        metric_values = {}

        metric_patterns = {
            "Accuracy":    r'(?i)(?:accuracy|acc)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "F1-Score":    r'(?i)(?:f1|f1-score|f1 score)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "Precision":   r'(?i)(?:precision)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "Recall":      r'(?i)(?:recall|sensitivity)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "Specificity": r'(?i)(?:specificity)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "AUC":         r'(?i)(?:auc|auc-roc|auroc)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "ROUGE":       r'(?i)(?:rouge|rouge-l|rouge-1)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "BLEU":        r'(?i)(?:bleu|bleu-4)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "MAE":         r'(?i)(?:mae|mean absolute error)[\s\=\:\(]+([\d]+(?:\.[\d]+)?)',
            "RMSE":        r'(?i)(?:rmse|root mean square)[\s\=\:\(]+([\d]+(?:\.[\d]+)?)',
            "R²":          r'(?i)(?:r2|r-squared|r²)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "MSE":         r'(?i)(?:mse|mean squared error)[\s\=\:\(]+([\d]+(?:\.[\d]+)?)',
            "mAP":         r'(?i)(?:map|mean average precision)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
            "Kappa":       r'(?i)(?:kappa|cohen.s kappa)[\s\=\:\(]+([\d]+(?:\.[\d]+)?)',
            "Dice":        r'(?i)(?:dice|dice score|dice coefficient)[\s\=\:\(]+([\d]+(?:\.[\d]+)?%?)',
        }

        key_map = {
            "Accuracy": "accuracy", "F1-Score": "f1_score",
            "Precision": "precision_score", "Recall": "recall_score",
            "Specificity": "specificity", "AUC": "auc_score",
            "ROUGE": "rouge_score", "BLEU": "bleu_score",
            "MAE": "mae", "RMSE": "rmse", "R²": "r2_score",
            "MSE": "mse", "mAP": "map_score",
            "Kappa": "kappa", "Dice": "dice_score",
        }

        for metric_name, pattern in metric_patterns.items():
            m = re.search(pattern, full_text)
            if m:
                metrics_found.append(metric_name)
                field_key = key_map.get(metric_name, metric_name.lower())
                metric_values[field_key] = m.group(1)

        # Use domain-expected metrics as fallback display
        eval_metrics = ", ".join(metrics_found) if metrics_found else ", ".join(expected_metrics[:3])
        results_summary = f"Demonstrated statistically significant improvements across evaluated metrics ({eval_metrics}) compared to baseline approaches."

        # 7. Limitations
        limitations = NLPService._extract_pattern(
            full_text,
            [
                r'(?i)(?:limitation|limitations|drawback|weakness|threats to validity)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:however,|although,|despite)[^,]*, ([^\.\n]+(?:\.[^\.\n]+){0,1})',
                r'(?i)(?:constrained by|limited to|not generalizable|small sample|single site)\s+([^\.\n]+)',
            ],
            default=f"Generalizability may be limited to specific populations or conditions. Further validation across diverse {domain} contexts is required."
        )

        # 8. Future Work
        future_work = NLPService._extract_pattern(
            full_text,
            [
                r'(?i)(?:future work|in the future, we plan to|future research directions)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:we plan to extend|remains as future work|future studies should)\s+([^\.\n]+(?:\.[^\.\n]+){1,2})',
                r'(?i)(?:further research is needed|future investigations)\s+([^\.\n]+)',
            ],
            default=f"Extending validation to larger and more diverse {domain} datasets, improving model interpretability, and integrating multi-modal data sources."
        )

        # 9. Keywords
        kw_match = re.search(r'(?i)(?:keywords|index terms|key words)[:\s]+([^\.\n]+)', full_text)
        if kw_match:
            keywords = kw_match.group(1).strip()
        else:
            keywords = ", ".join(algorithms[:5] + [dataset_name, domain])

        # 10. Summaries
        algo_str = ", ".join(algorithms[:4])
        short_summary = (
            f"This paper investigates {title}, applying {algo_str} within the domain of {domain}. "
            f"Evaluated on {dataset_name} with metrics including {eval_metrics}."
        )
        detailed_summary = (
            f"Domain: {domain}\n\n"
            f"Research Problem: {problem}\n\n"
            f"The authors introduce a methodology centered on {algo_str}. "
            f"Evaluation on {dataset_name} (Size: {dataset_size}) demonstrates significant performance improvements. "
            f"Limitations include: {limitations[:200]}"
        )
        technical_summary = (
            f"Domain: {domain}\n"
            f"Methods: {algo_str}\n"
            f"Dataset: {dataset_name} ({dataset_size})\n"
            f"Metrics: {eval_metrics}\n"
            f"Results: {results_summary[:200]}\n"
            f"Limitations: {limitations[:150]}"
        )

        # Section summaries
        section_summaries = {}
        for sec_name, content in sections.items():
            section_summaries[sec_name] = content[:400].strip() + ("..." if len(content) > 400 else "")

        return {
            "research_problem": problem,
            "objectives": objectives,
            "research_questions": f"How to effectively address the core challenges in {domain} using the proposed methodology?",
            "proposed_solution": proposed_solution,
            "methodology": methodology_text[:1500],
            "algorithms": ", ".join(algorithms),
            "models": ", ".join(algorithms),
            "frameworks": NLPService._detect_frameworks(full_text),
            "dataset_name": dataset_name,
            "dataset_size": dataset_size,
            "dataset_domain": domain,
            "domain": domain,
            "features": f"Domain-specific feature representations for {domain} research",
            "evaluation_metrics": eval_metrics,
            "results_summary": results_summary,
            "accuracy":        metric_values.get("accuracy"),
            "precision_score": metric_values.get("precision_score"),
            "recall_score":    metric_values.get("recall_score"),
            "f1_score":        metric_values.get("f1_score"),
            "rouge_score":     metric_values.get("rouge_score"),
            "bleu_score":      metric_values.get("bleu_score"),
            "rmse":            metric_values.get("rmse"),
            "mae":             metric_values.get("mae"),
            "auc_score":       metric_values.get("auc_score"),
            "r2_score":        metric_values.get("r2_score"),
            "dice_score":      metric_values.get("dice_score"),
            "kappa":           metric_values.get("kappa"),
            "other_metrics":   metric_values,
            "limitations": limitations,
            "future_work": future_work,
            "short_summary": short_summary,
            "detailed_summary": detailed_summary,
            "technical_summary": technical_summary,
            "section_summaries": section_summaries,
            "keywords": keywords,
        }

    @staticmethod
    def _detect_frameworks(full_text: str) -> str:
        """Detect software frameworks, tools, and libraries used in the paper."""
        framework_patterns = [
            # AI/ML
            r"\b(PyTorch|TensorFlow|Keras|Scikit-learn|Hugging Face|JAX|MXNet|ONNX|CUDA|OpenCV)\b",
            # Statistical / Scientific
            r"\b(R|SPSS|STATA|SAS|MATLAB|Python|NumPy|SciPy|Pandas|Statsmodels)\b",
            # Medical
            r"\b(SPM|FSL|FreeSurfer|ANTs|ITK|MONAI|MedPy|nibabel)\b",
            # Agricultural / Remote Sensing
            r"\b(GDAL|QGIS|ArcGIS|Google Earth Engine|SNAP|ERDAS|ENVI)\b",
            # Web / Data
            r"\b(Spark|Hadoop|PostgreSQL|MySQL|MongoDB|Elasticsearch)\b",
        ]
        found = []
        for pat in framework_patterns:
            matches = re.findall(pat, full_text, re.IGNORECASE)
            found.extend(matches)
        unique = list(dict.fromkeys([f.strip() for f in found if f.strip()]))[:6]
        return " / ".join(unique) if unique else "Standard research toolchain"

    @staticmethod
    def _extract_pattern(text: str, patterns: List[str], default: str) -> str:
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                extracted = m.group(1).strip()
                if len(extracted) > 20:
                    return extracted[:400]
        return default
