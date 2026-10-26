import os
import csv
import io
from typing import List, Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

from app.services.embedding_service import EmbeddingService
from app.services.research_gap_service import ResearchGapService

class ReportService:

    @classmethod
    def build_full_pdf_bytes(
        cls,
        project: Any,
        papers: List[Any],
        include_summary: bool = True,
        include_matrix: bool = True,
        include_gaps: bool = True,
        include_citations: bool = True
    ) -> bytes:
        """Generate full publication-ready PDF literature review report in bytes with customizable section flags."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=8
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            spaceAfter=14
        )
        heading_style = ParagraphStyle(
            'SectionHeading',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#1E293B'),
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyTextCustom',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155'),
            spaceAfter=6
        )

        elements = []

        # Title & Subtitle Header
        elements.append(Paragraph(f"Literature Review Report: {project.name}", title_style))
        elements.append(Paragraph("AI Research Paper Assistant • Literature Review & Research Intelligence Platform", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#CBD5E1'), spaceAfter=12))

        sec_idx = 1

        # 1. Project Executive Summary
        if include_summary:
            elements.append(Paragraph(f"{sec_idx}. Executive Summary", heading_style))
            sec_idx += 1
            desc = project.description or "No description provided."
            summary_text = (
                f"This automated literature review synthesizes <b>{len(papers)} research papers</b> under the workspace project <i>'{project.name}'</i>.<br/>"
                f"<b>Project Focus:</b> {desc}<br/>"
                f"Using NLP extraction and high-dimensional sentence transformer embeddings, key methodologies, empirical performance metrics, semantic similarity heatmap matrices, and potential research gaps were evaluated."
            )
            elements.append(Paragraph(summary_text, body_style))
            elements.append(Spacer(1, 10))

        # 2. Methodology Comparison Matrix Table
        if include_matrix:
            elements.append(Paragraph(f"{sec_idx}. Methodology Comparison Matrix", heading_style))
            sec_idx += 1
            matrix_table_data = [["#", "Paper Title", "Authors", "Year", "Methodology / Algo", "Dataset", "Metrics & Results"]]
            for idx, p in enumerate(papers, 1):
                an = p.analysis
                title = p.title[:35] + ("..." if len(p.title) > 35 else "")
                authors = (p.authors or "N/A")[:20]
                year = str(p.publication_year or "N/A")
                algo = (an.algorithms or "N/A")[:22] if an else "N/A"
                dataset = (an.dataset_name or "N/A")[:18] if an else "N/A"
                res = (an.f1_score or an.accuracy or an.evaluation_metrics or "Reported")[:22] if an else "N/A"

                matrix_table_data.append([
                    str(idx),
                    title,
                    authors,
                    year,
                    algo,
                    dataset,
                    res
                ])

            t_matrix = Table(matrix_table_data, colWidths=[18, 140, 85, 35, 95, 80, 87])
            t_matrix.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
            ]))
            elements.append(t_matrix)
            elements.append(Spacer(1, 12))

        # 3. Research Gaps & Future Directions
        if include_gaps:
            elements.append(Paragraph(f"{sec_idx}. Research Gap Analysis & Future Directions", heading_style))
            sec_idx += 1
            papers_dict_list = [
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
            gaps_result = ResearchGapService.analyze_gaps_and_trends(papers_dict_list)
            directions = gaps_result.get("potential_research_directions", [])

            if directions:
                for d in directions:
                    d_text = f"• <b>{d.get('title')}</b> (Confidence: {d.get('confidence_level')}): {d.get('description')}"
                    elements.append(Paragraph(d_text, body_style))
            else:
                elements.append(Paragraph("• No major research gap bottlenecks detected across uploaded papers.", body_style))
            elements.append(Spacer(1, 12))

        # 4. Consolidated Bibliographic Citations
        if include_citations:
            elements.append(Paragraph(f"{sec_idx}. Consolidated Bibliographic Citations", heading_style))
            sec_idx += 1
            for idx, p in enumerate(papers, 1):
                authors = p.authors or "Unknown Authors"
                year = str(p.publication_year or 2024)
                title = p.title or "Untitled Paper"
                journal = p.journal_conference or "Academic Proceedings"
                ieee_cite = f'[{idx}] {authors}, "{title}," <i>{journal}</i>, {year}.'
                elements.append(Paragraph(ieee_cite, body_style))
            elements.append(Spacer(1, 12))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @classmethod
    def build_extracted_parameters_csv(cls, papers: List[Any]) -> str:
        """Generate structured CSV of extracted paper parameters."""
        output = io.StringIO()
        writer = csv.writer(output)

        headers = [
            "Paper ID", "Title", "Authors", "Publication Year", "Journal / Conference", "DOI",
            "Research Problem", "Objectives", "Methodology", "Algorithms", "Dataset Name",
            "Dataset Size", "Evaluation Metrics", "Results Summary", "Accuracy", "Precision",
            "Recall", "F1 Score", "Limitations", "Future Work"
        ]
        writer.writerow(headers)

        for p in papers:
            an = p.analysis
            writer.writerow([
                p.id,
                p.title,
                p.authors or "",
                p.publication_year or "",
                p.journal_conference or "",
                p.doi or "",
                an.research_problem if an else "",
                an.objectives if an else "",
                an.methodology if an else "",
                an.algorithms if an else "",
                an.dataset_name if an else "",
                an.dataset_size if an else "",
                an.evaluation_metrics if an else "",
                an.results_summary if an else "",
                an.accuracy if an else "",
                an.precision_score if an else "",
                an.recall_score if an else "",
                an.f1_score if an else "",
                an.limitations if an else "",
                an.future_work if an else ""
            ])

        return output.getvalue()
