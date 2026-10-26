import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database import get_db, SessionLocal
from app.models.schema import Paper, PaperAnalysis, PaperChunk, Project, User, JobStatus
from app.schemas.schemas import PaperResponse, JobStatusResponse
from app.api.auth import get_current_user
from app.config import settings
from app.services.pdf_service import PDFService
from app.services.nlp_service import NLPService
from app.services.embedding_service import EmbeddingService

router = APIRouter(prefix="/papers", tags=["Papers"])

def process_papers_background(job_id: str, project_id: str, user_id: str, saved_file_infos: List[dict]):
    """Background worker for PDF parsing, NLP extraction, chunking, and embedding indexing."""
    db = SessionLocal()
    try:
        job = db.query(JobStatus).filter(JobStatus.job_id == job_id).first()
        if not job:
            return

        total_files = len(saved_file_infos)
        all_chunks_for_project = []

        for idx, file_info in enumerate(saved_file_infos, 1):
            file_path = file_info["file_path"]
            file_name = file_info["file_name"]
            file_hash = file_info["file_hash"]

            # Step 1: Text extraction
            job.step = f"[{idx}/{total_files}] Extracting text from {file_name}..."
            job.progress_pct = int(((idx - 0.8) / total_files) * 80)
            db.commit()

            full_text, pages_data = PDFService.extract_text_and_pages(file_path)
            title, authors, pub_year, abstract = PDFService.detect_title_and_authors(full_text, file_name)
            sections = PDFService.extract_sections(full_text)
            references = PDFService.extract_references(full_text)

            # Step 2: NLP Analysis & Information Extraction
            job.step = f"[{idx}/{total_files}] Analyzing research methodology & metrics..."
            job.progress_pct = int(((idx - 0.5) / total_files) * 80)
            db.commit()

            analysis_data = NLPService.extract_structured_analysis(full_text, title, abstract, sections)
            analysis_data["references_data"] = references

            # Save Paper
            paper = Paper(
                project_id=project_id,
                user_id=user_id,
                title=title,
                file_name=file_name,
                file_path=file_path,
                file_hash=file_hash,
                authors=authors,
                publication_year=pub_year,
                abstract=abstract,
                raw_text=full_text
            )
            db.add(paper)
            db.flush()

            # Save Analysis
            analysis_record = PaperAnalysis(
                paper_id=paper.id,
                **analysis_data
            )
            db.add(analysis_record)

            # Step 3: Chunking
            job.step = f"[{idx}/{total_files}] Chunking text & generating Sentence Transformer embeddings..."
            job.progress_pct = int((idx / total_files) * 80)
            db.commit()

            raw_chunks = PDFService.create_chunks(pages_data)
            for c in raw_chunks:
                chunk_obj = PaperChunk(
                    paper_id=paper.id,
                    project_id=project_id,
                    chunk_text=c["chunk_text"],
                    section=c["section"],
                    page_number=c["page_number"],
                    chunk_index=c["chunk_index"]
                )
                db.add(chunk_obj)

            db.commit()

        # Step 4: Build FAISS Vector Index
        job.step = "Building FAISS vector knowledge base & similarity index..."
        job.progress_pct = 95
        db.commit()

        db_chunks = db.query(PaperChunk).filter(PaperChunk.project_id == project_id).all()
        formatted_chunks = [
            {
                "paper_id": c.paper_id,
                "project_id": c.project_id,
                "chunk_text": c.chunk_text,
                "section": c.section,
                "page_number": c.page_number
            }
            for c in db_chunks
        ]
        EmbeddingService.build_project_index(project_id, formatted_chunks)

        job.status = "complete"
        job.progress_pct = 100
        job.step = "Analysis & Literature Review Knowledge Base Complete!"
        db.commit()

    except Exception as e:
        db.rollback()
        if job:
            job.status = "failed"
            job.error_message = str(e)
            job.step = "Processing failed."
            db.commit()
    finally:
        db.close()

@router.post("/upload")
def upload_papers(
    background_tasks: BackgroundTasks,
    project_id: str = Form(...),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if len(files) < 1:
        raise HTTPException(status_code=400, detail="Please upload at least 1 PDF research paper.")

    saved_file_infos = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"File '{file.filename}' is not a valid PDF document.")

        content = file.file.read()
        file_hash = PDFService.compute_sha256(content)

        # If paper already exists, remove older duplicate record to re-process fresh
        existing = db.query(Paper).filter(Paper.project_id == project_id, Paper.file_hash == file_hash).all()
        for old_paper in existing:
            try:
                if old_paper.file_path and os.path.exists(old_paper.file_path):
                    os.remove(old_paper.file_path)
            except Exception:
                pass
            db.delete(old_paper)
        if existing:
            db.commit()

        file_id = str(uuid.uuid4())
        safe_filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
        with open(file_path, "wb") as f:
            f.write(content)

        saved_file_infos.append({
            "file_name": file.filename,
            "file_path": file_path,
            "file_hash": file_hash
        })

    if not saved_file_infos:
        raise HTTPException(status_code=400, detail="No valid PDF files could be processed.")

    job_id = str(uuid.uuid4())
    job = JobStatus(
        job_id=job_id,
        project_id=project_id,
        status="processing",
        progress_pct=5,
        step="Starting paper processing..."
    )
    db.add(job)
    db.commit()

    background_tasks.add_task(
        process_papers_background,
        job_id,
        project_id,
        current_user.id,
        saved_file_infos
    )

    return {"job_id": job_id, "message": f"Processing {len(saved_file_infos)} paper(s) in background."}

@router.get("/project/{project_id}", response_model=List[PaperResponse])
def get_papers_by_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    papers = db.query(Paper).filter(Paper.project_id == project_id, Paper.user_id == current_user.id).order_by(Paper.created_at.asc()).all()
    return [PaperResponse.model_validate(p) for p in papers]

@router.get("/{paper_id}", response_model=PaperResponse)
def get_paper_details(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return PaperResponse.model_validate(paper)

@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    if os.path.exists(paper.file_path):
        try:
            os.remove(paper.file_path)
        except Exception:
            pass

    db.delete(paper)
    db.commit()
    return None

@router.post("/seed-demo/{project_id}")
def seed_demo_papers(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    demo_papers = [
        {
            "title": "Deep Learning for Diabetic Retinopathy Detection Using Retinal Fundus Images",
            "file_name": "diabetic_retinopathy_cnn_2022.pdf",
            "authors": "Priya Sharma, Amit Kumar, Wei Zhang, Maria Santos",
            "publication_year": 2022,
            "abstract": "Diabetic retinopathy (DR) is a leading cause of blindness worldwide. We propose a CNN-based automated screening system trained on 88,702 retinal fundus images to classify DR severity into 5 grades. Our EfficientNet-B4 model achieves an AUC of 0.97 and sensitivity of 94.3%, outperforming human graders in a prospective clinical trial.",
            "raw_text": "Diabetic retinopathy detection using deep learning. Clinical dataset with 88702 fundus images. EfficientNet-B4 model. AUC: 0.97, Sensitivity: 94.3%, Specificity: 91.6%. Compared against ophthalmologist grading. Limitations: single ethnicity cohort, requires high-resolution imaging hardware.",
            "analysis": {
                "research_problem": "Manual screening for diabetic retinopathy is time-consuming and requires specialist ophthalmologists unavailable in low-income settings.",
                "objectives": "Develop an automated, cost-effective deep learning screening tool for 5-level DR grading using retinal fundus images.",
                "methodology": "Transfer learning with EfficientNet-B4 pretrained on ImageNet, fine-tuned on EyePACS+Messidor-2 merged dataset. Data augmentation with random flips, rotations, and color jitter.",
                "algorithms": "EfficientNet-B4, ResNet-50, VGG-16, Logistic Regression",
                "models": "EfficientNet-B4 (Best), ResNet-50 (Baseline)",
                "dataset_name": "EyePACS + Messidor-2",
                "dataset_size": "88,702 fundus images",
                "evaluation_metrics": "AUC-ROC, Sensitivity, Specificity, F1-Score, Kappa",
                "accuracy": "94.3%",
                "f1_score": "92.8%",
                "auc_score": "0.97",
                "limitations": "Dataset limited to single ethnicity. Requires high-resolution fundus camera hardware not available in rural clinics.",
                "future_work": "Deploying on low-cost smartphone-based fundus adapters; extending to other retinal diseases (glaucoma, AMD); federated learning for privacy-preserving multi-hospital training.",
                "keywords": "Diabetic Retinopathy, Medical Imaging, EfficientNet, CNN, Fundus Image, Clinical AI",
                "domain": "Medical & Clinical",
                "dataset_domain": "Medical & Clinical"
            }
        },
        {
            "title": "Crop Yield Prediction Using Satellite Remote Sensing and Machine Learning in Semi-Arid Regions",
            "file_name": "crop_yield_sentinel2_rf_2023.pdf",
            "authors": "Abubakar Musa, Elena Petrov, Lin Chen, Fatima Al-Rashid",
            "publication_year": 2023,
            "abstract": "Accurate crop yield prediction is critical for food security planning. We integrate Sentinel-2 multispectral imagery with climate variables and soil data to predict wheat yield across 14 districts in Sub-Saharan Africa. A Random Forest model achieves RMSE of 0.31 t/ha and R² = 0.89, outperforming NDVI-based regression baselines.",
            "raw_text": "Crop yield prediction with Sentinel-2 NDVI, EVI, SAVI indices. Random Forest regressor. Climate variables: temperature, rainfall. Soil: organic matter, pH. RMSE: 0.31 t/ha, R²: 0.89, MAE: 0.24 t/ha. Limitations: limited ground truth yield records. Future: drone multispectral integration.",
            "analysis": {
                "research_problem": "Traditional crop monitoring methods lack spatial granularity and timeliness for early yield forecasting in resource-limited agricultural regions.",
                "objectives": "Build an end-to-end crop yield prediction pipeline using satellite vegetation indices, climate data, and soil properties with machine learning.",
                "methodology": "Sentinel-2 multispectral bands processed in Google Earth Engine. Feature engineering with NDVI, EVI, SAVI time-series. Random Forest regressor trained with 5-fold cross-validation.",
                "algorithms": "Random Forest, XGBoost, Linear Regression, SVM",
                "models": "Random Forest (Best), XGBoost (Baseline)",
                "dataset_name": "Sentinel-2 + FAO Yield Statistics",
                "dataset_size": "12,847 field parcels across 14 districts",
                "evaluation_metrics": "RMSE, MAE, R², Pearson Correlation",
                "accuracy": "89%",
                "f1_score": None,
                "rmse": "0.31",
                "mae": "0.24",
                "limitations": "Limited ground truth yield records from government agencies. Model performance degrades in years with extreme weather anomalies.",
                "future_work": "Integrating UAV/drone hyperspectral imagery; temporal LSTM modeling for mid-season yield forecasting; extending to rice and maize crops.",
                "keywords": "Crop Yield, Remote Sensing, Sentinel-2, NDVI, Random Forest, Food Security, Agriculture",
                "domain": "Agricultural & Environmental",
                "dataset_domain": "Agricultural & Environmental"
            }
        },
        {
            "title": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
            "file_name": "bert_devlin_2019.pdf",
            "authors": "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
            "publication_year": 2019,
            "abstract": "We introduce BERT, which stands for Bidirectional Encoder Representations from Transformers. BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers.",
            "raw_text": "BERT Pre-training of Deep Bidirectional Transformers. Masked Language Modeling and Next Sentence Prediction. GLUE Score: 80.5, SQuAD v1.1 F1: 93.2. Limitations: high pre-training compute cost.",
            "analysis": {
                "research_problem": "Prevailing language models were unidirectional, limiting pre-trained representations for token-level downstream NLP tasks.",
                "objectives": "Pre-train deep bidirectional representations using Masked LM (MLM) and Next Sentence Prediction (NSP).",
                "methodology": "Transformer Encoder with Masked Language Modeling and Next Sentence Prediction pre-trained on large text corpora.",
                "algorithms": "Transformer, Masked LM, AdamW, BERT",
                "models": "BERT-Base (110M params), BERT-Large (340M params)",
                "dataset_name": "BookCorpus + English Wikipedia",
                "dataset_size": "3.3 Billion Words",
                "evaluation_metrics": "GLUE Score, F1-Score, Accuracy",
                "accuracy": "80.5%",
                "f1_score": "93.2%",
                "limitations": "High computational pre-training cost; mask token discrepancy during fine-tuning; English-only pretraining.",
                "future_work": "Exploring lighter architectures and domain-specific pre-training (e.g., BioBERT, SciBERT, Agribert).",
                "keywords": "BERT, Transformer, Masked Language Model, NLP, Pre-training, Natural Language Processing",
                "domain": "Computer Science & AI",
                "dataset_domain": "Computer Science & AI"
            }
        },
        {
            "title": "Machine Learning Approaches for Predicting Mental Health Outcomes from Social Media Data",
            "file_name": "mental_health_nlp_social_media_2023.pdf",
            "authors": "Sarah Johnson, Raj Patel, Ana Lima, Thomas Weber",
            "publication_year": 2023,
            "abstract": "This study examines 487,000 Reddit posts to detect early indicators of depression and anxiety using NLP-based classification. We compare BERT, LSTM, and traditional machine learning classifiers, achieving F1 = 0.87 for depression detection. Ethical considerations and bias mitigation strategies are discussed.",
            "raw_text": "Mental health prediction from Reddit social media posts. BERT-based classifier. 487000 posts from r/depression, r/anxiety. F1-score: 0.87, Accuracy: 91.2%, AUC: 0.94. Ethical review board approved. Limitations: self-reported labels, Reddit user demographics not representative.",
            "analysis": {
                "research_problem": "Early detection of mental health deterioration is hampered by underdiagnosis. Social media may serve as a passive, scalable data source for population-level screening.",
                "objectives": "Classify Reddit posts for depression and anxiety indicators using fine-tuned language models and evaluate bias across demographic groups.",
                "methodology": "BERT fine-tuned on annotated Reddit posts. Comparison with LSTM and SVM baselines. Bias audit using AIF360 fairness toolkit.",
                "algorithms": "BERT, LSTM, SVM, Logistic Regression",
                "models": "BERT (Best), LSTM (Baseline), SVM (Classical Baseline)",
                "dataset_name": "Reddit Mental Health Dataset (r/depression, r/anxiety)",
                "dataset_size": "487,000 posts",
                "evaluation_metrics": "F1-Score, Accuracy, AUC-ROC, Fairness Metrics",
                "accuracy": "91.2%",
                "f1_score": "0.87",
                "auc_score": "0.94",
                "limitations": "Self-reported diagnostic labels. Reddit demographic skew. Model not validated in clinical settings.",
                "future_work": "Multi-platform validation (Twitter, forums); integrating audio/video signals; deploying as a clinical support tool with psychiatrist oversight.",
                "keywords": "Mental Health, NLP, Depression Detection, BERT, Social Media, Behavioral Science",
                "domain": "Social & Behavioral Sciences",
                "dataset_domain": "Social & Behavioral Sciences"
            }
        },
        {
            "title": "Global Surface Temperature Anomaly Prediction Using Deep Learning on ERA5 Reanalysis Data",
            "file_name": "climate_lstm_era5_2024.pdf",
            "authors": "Carlos Mendez, Yuki Tanaka, Olga Petrova, James Osei",
            "publication_year": 2024,
            "abstract": "Accurate prediction of surface temperature anomalies is vital for climate policy planning. We develop a ConvLSTM architecture trained on 40 years of ERA5 reanalysis data (1980–2020) to predict 6-month temperature anomalies at 0.25° spatial resolution, achieving RMSE of 0.18°C and correlation coefficient of 0.96.",
            "raw_text": "Climate temperature anomaly prediction. ERA5 reanalysis data 1980-2020. ConvLSTM architecture. Spatial resolution 0.25 degrees. RMSE: 0.18°C, Pearson correlation: 0.96, MAE: 0.14°C. Limitations: computational cost, coarse spatial resolution, teleconnection patterns not fully captured.",
            "analysis": {
                "research_problem": "Existing numerical weather prediction models are computationally expensive and struggle with sub-seasonal to seasonal temperature forecasting skill.",
                "objectives": "Develop a data-driven ConvLSTM model for global surface temperature anomaly prediction at monthly timescales using ERA5 reanalysis.",
                "methodology": "ConvLSTM trained on ERA5 monthly gridded temperature, pressure, humidity, and sea surface temperature fields. Trained with MSE loss and Adam optimizer.",
                "algorithms": "ConvLSTM, LSTM, CNN, Random Forest, Gradient Boosting",
                "models": "ConvLSTM (Best), LSTM (Baseline)",
                "dataset_name": "ERA5 ECMWF Reanalysis",
                "dataset_size": "40 years (1980–2020), 0.25° global grid",
                "evaluation_metrics": "RMSE, MAE, Pearson Correlation, Skill Score",
                "accuracy": None,
                "f1_score": None,
                "rmse": "0.18",
                "mae": "0.14",
                "limitations": "High GPU memory requirements for global gridded data. Coarse 0.25° resolution may miss local extremes. Teleconnection patterns like ENSO only partially captured.",
                "future_work": "Downscaling to 0.05° resolution; incorporating ocean-atmosphere coupling; extending forecast horizon to 12 months; integrating with CMIP6 projections.",
                "keywords": "Climate Science, Temperature Anomaly, ConvLSTM, Deep Learning, ERA5, Weather Prediction",
                "domain": "Environmental & Climate",
                "dataset_domain": "Environmental & Climate"
            }
        }
    ]

    created_papers = []
    for dp in demo_papers:
        existing = db.query(Paper).filter(Paper.project_id == project_id, Paper.title == dp["title"]).first()
        if existing:
            created_papers.append(existing)
            continue

        paper_hash = str(uuid.uuid5(uuid.NAMESPACE_DNS, dp["title"]))
        paper = Paper(
            project_id=project_id,
            user_id=current_user.id,
            title=dp["title"],
            file_name=dp["file_name"],
            file_path=f"uploads/{dp['file_name']}",
            file_hash=paper_hash,
            authors=dp["authors"],
            publication_year=dp["publication_year"],
            abstract=dp["abstract"],
            raw_text=dp["raw_text"]
        )
        db.add(paper)
        db.flush()

        analysis_dict = {k: v for k, v in dp["analysis"].items()}
        analysis_rec = PaperAnalysis(
            paper_id=paper.id,
            **analysis_dict
        )
        db.add(analysis_rec)
        created_papers.append(paper)

    db.commit()
    return {"message": f"Loaded {len(created_papers)} demo research papers across multiple domains!", "count": len(created_papers)}

