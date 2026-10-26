import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Builds standard structured data object for a paper analysis report.
 */
export function getPaperReportData(paper) {
  if (!paper) return null;

  const an = paper.analysis || {};
  const title = paper.title || 'Untitled Research Paper';
  const authors = paper.authors || 'Unknown Authors';
  const year = paper.year || paper.publication_year || new Date().getFullYear();
  const venue = paper.venue || paper.journal_conference || 'Academic Journal / Conference';
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const firstAuthorLast = (authors.split(',')[0] || 'Author').trim().split(' ').pop() || 'Author';
  const bibtexKey = `${firstAuthorLast.toLowerCase()}${year}${title.split(' ')[0]?.toLowerCase() || 'paper'}`;

  const citations = {
    IEEE: `${authors}, "${title}," ${venue}, ${year}.`,
    APA: `${authors} (${year}). ${title}. ${venue}.`,
    BibTeX: `@article{${bibtexKey},\n  author    = {${authors}},\n  title     = {${title}},\n  journal   = {${venue}},\n  year      = {${year}}\n}`
  };

  const metricsList = [
    an.accuracy && { label: 'Accuracy', value: (parseFloat(an.accuracy) <= 1 ? (parseFloat(an.accuracy) * 100).toFixed(1) + '%' : an.accuracy) },
    an.f1_score && { label: 'F1 Score', value: an.f1_score },
    an.precision && { label: 'Precision', value: an.precision },
    an.recall && { label: 'Recall', value: an.recall },
    an.bleu_score && { label: 'BLEU Score', value: an.bleu_score },
    an.rouge_score && { label: 'ROUGE Score', value: an.rouge_score },
    an.auc_score && { label: 'AUC-ROC', value: an.auc_score },
    an.r2_score && { label: 'R² Score', value: an.r2_score },
    an.specificity && { label: 'Specificity', value: an.specificity },
  ].filter(Boolean);

  return {
    title,
    authors,
    year,
    venue,
    dateStr,
    summary: an.summary || paper.abstract || 'Structured synthesis of paper methodology, contributions, and experimental findings.',
    research_problem: an.research_problem || an.objectives || 'Focuses on addressing computational performance and empirical generalization.',
    methodology: an.methodology || an.proposed_solution || 'Theoretical formulation and experimental pipeline detailed in the methodology section.',
    algorithms: an.algorithms || an.models || 'Machine learning architectures, neural models, and statistical baselines.',
    dataset_name: an.dataset_name || 'Standard academic corpus',
    dataset_size: an.dataset_size || 'Refer to paper methodology section',
    results_summary: an.results_summary || an.evaluation_metrics || 'Empirically validates the proposed approach against state-of-the-art baselines.',
    strengths: an.proposed_solution || an.results_summary || 'Empirically validated performance, robust evaluation protocol, and reproducible baseline comparisons.',
    limitations: an.limitations || 'Assumptions regarding sample generalizability, computational overhead, and boundary conditions.',
    future_work: an.future_work || 'Extended evaluation on heterogeneous datasets, hyperparameter tuning, and real-time inference optimization.',
    citations,
    metricsList
  };
}

/**
 * Generates and downloads a publication-grade PDF Literature Review Report using discrete A4 page captures.
 * @param {Object} paper - Paper object with metadata and analysis.
 * @returns {Promise<void>}
 */
export async function exportPaperReportPDF(paper) {
  if (!paper) return;

  const data = getPaperReportData(paper);
  if (!data) return;

  // Build off-screen container holding exact A4 aspect ratio pages (800px x 1130px)
  const container = document.createElement('div');
  container.id = 'pdf-export-container';
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#E2E8F0';

  const styles = `
    <style>
      .pdf-a4-page {
        width: 800px;
        height: 1130px;
        max-height: 1130px;
        padding: 40px 44px;
        background-color: #FFFFFF;
        color: #1E293B;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
        margin-bottom: 20px;
        display: flex;
        flex-col;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
      }
      .pdf-header-banner {
        background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
        border-radius: 12px;
        padding: 22px 26px;
        color: #FFFFFF;
        margin-bottom: 18px;
      }
      .pdf-sub-banner {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid #E2E8F0;
        padding-bottom: 10px;
        margin-bottom: 16px;
      }
      .pdf-badge {
        display: inline-block;
        background-color: rgba(99, 102, 241, 0.2);
        color: #818CF8;
        border: 1px solid rgba(129, 140, 248, 0.35);
        font-size: 9.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 3px 8px;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      .pdf-title {
        font-size: 18px;
        font-weight: 800;
        line-height: 1.35;
        color: #FFFFFF;
        margin: 0 0 10px 0;
      }
      .pdf-meta-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 6px 16px;
        font-size: 10.5px;
        color: #94A3B8;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        padding-top: 10px;
      }
      .pdf-meta-item strong {
        color: #E2E8F0;
      }
      .pdf-section {
        margin-bottom: 14px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .pdf-heading {
        font-size: 13px;
        font-weight: 800;
        color: #0F172A;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 2px solid #E2E8F0;
        padding-bottom: 5px;
        margin: 0 0 10px 0;
      }
      .pdf-card {
        background-color: #F8FAFC;
        border: 1px solid #E2E8F0;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 10px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .pdf-card-title {
        font-size: 10.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 5px;
      }
      .pdf-body {
        font-size: 10px;
        line-height: 1.5;
        color: #334155;
        margin: 0;
      }
      .pdf-grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .pdf-metric-pill {
        display: inline-block;
        background-color: #EFF6FF;
        color: #1D4ED8;
        border: 1px solid #BFDBFE;
        font-weight: 600;
        font-size: 9.5px;
        padding: 3px 8px;
        border-radius: 6px;
        margin-right: 5px;
        margin-bottom: 5px;
      }
      .pdf-footer {
        padding-top: 10px;
        border-top: 1px solid #E2E8F0;
        font-size: 8.5px;
        color: #94A3B8;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
    </style>
  `;

  // Page 1 HTML: Banner, Executive Summary, Research Problem, Methodology, Algorithms, Datasets
  const page1HTML = `
    <div class="pdf-a4-page" id="pdf-page-1">
      <div>
        <!-- Header Banner -->
        <div class="pdf-header-banner">
          <div class="pdf-badge">Scientific Literature Review Report</div>
          <h1 class="pdf-title">${data.title}</h1>
          <div class="pdf-meta-grid">
            <div class="pdf-meta-item"><strong>Authors:</strong> ${data.authors}</div>
            <div class="pdf-meta-item"><strong>Publication Year:</strong> ${data.year}</div>
            <div class="pdf-meta-item"><strong>Venue / Source:</strong> ${data.venue}</div>
            <div class="pdf-meta-item"><strong>Date of Synthesis:</strong> ${data.dateStr}</div>
          </div>
        </div>

        <!-- Section 1: Executive Summary -->
        <div class="pdf-section">
          <h2 class="pdf-heading">1. Executive Summary & Core Contributions</h2>
          <div class="pdf-card" style="border-left: 4px solid #4F46E5;">
            <p class="pdf-body">${data.summary}</p>
          </div>
        </div>

        <!-- Section 2: Structured Literature Review -->
        <div class="pdf-section">
          <h2 class="pdf-heading">2. Structured Literature Review & Technical Breakdown</h2>
          
          <div class="pdf-grid-2">
            <div class="pdf-card">
              <div class="pdf-card-title" style="color: #4F46E5;">Research Objectives & Problem</div>
              <p class="pdf-body">${data.research_problem}</p>
            </div>

            <div class="pdf-card">
              <div class="pdf-card-title" style="color: #0284C7;">Methodology & Architecture</div>
              <p class="pdf-body">${data.methodology}</p>
            </div>
          </div>

          <div class="pdf-grid-2">
            <div class="pdf-card">
              <div class="pdf-card-title" style="color: #7C3AED;">Algorithms & Models</div>
              <p class="pdf-body">${data.algorithms}</p>
            </div>

            <div class="pdf-card">
              <div class="pdf-card-title" style="color: #D97706;">Datasets & Benchmark Scope</div>
              <p class="pdf-body">
                <strong>Corpus:</strong> ${data.dataset_name}<br/>
                <strong>Sample Size:</strong> ${data.dataset_size}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Page 1 Footer -->
      <div class="pdf-footer">
        <span>AI Research Assistant — Automated Scientific Synthesis</span>
        <span>Page 1 of 2</span>
      </div>
    </div>
  `;

  // Page 2 HTML: Experimental Results, Critical Synthesis & Novelty, Limitations & Gaps, Future Directions, Citations
  const page2HTML = `
    <div class="pdf-a4-page" id="pdf-page-2">
      <div>
        <!-- Sub Header -->
        <div class="pdf-sub-banner">
          <div>
            <span style="font-size: 11px; font-weight: 800; color: #0F172A; text-transform: uppercase; letter-spacing: 0.05em;">
              Literature Review Report (Cont.)
            </span>
            <div style="font-size: 9.5px; color: #64748B; margin-top: 2px;">Target Paper: ${data.title.slice(0, 55)}${data.title.length > 55 ? '...' : ''}</div>
          </div>
          <span style="font-size: 9px; color: #94A3B8; font-weight: 600;">Date: ${data.dateStr}</span>
        </div>

        <!-- Experimental Results & Metrics -->
        <div class="pdf-section">
          <h2 class="pdf-heading">2.1 Experimental Results & Benchmark Metrics</h2>
          <div class="pdf-card" style="border-left: 4px solid #059669;">
            ${data.metricsList.length > 0 ? `
              <div style="margin-bottom: 6px;">
                ${data.metricsList.map(m => `<span class="pdf-metric-pill">${m.label}: <strong>${m.value}</strong></span>`).join('')}
              </div>
            ` : ''}
            <p class="pdf-body">${data.results_summary}</p>
          </div>
        </div>

        <!-- Section 3: Critical Synthesis & Risk Assessment -->
        <div class="pdf-section">
          <h2 class="pdf-heading">3. Critical Synthesis & Research Assessment</h2>
          
          <div class="pdf-grid-2">
            <div class="pdf-card" style="border-left: 4px solid #10B981;">
              <div class="pdf-card-title" style="color: #059669;">Core Strengths & Novelty</div>
              <p class="pdf-body">${data.strengths}</p>
            </div>

            <div class="pdf-card" style="border-left: 4px solid #E11D48;">
              <div class="pdf-card-title" style="color: #E11D48;">Limitations & Methodological Gaps</div>
              <p class="pdf-body">${data.limitations}</p>
            </div>
          </div>

          <div class="pdf-card" style="border-left: 4px solid #6366F1;">
            <div class="pdf-card-title" style="color: #4F46E5;">Future Research Directions & Extensions</div>
            <p class="pdf-body">${data.future_work}</p>
          </div>
        </div>

        <!-- Academic Citation -->
        <div class="pdf-section">
          <h2 class="pdf-heading">4. Formatted Academic Citation</h2>
          <div class="pdf-card" style="background-color: #F1F5F9; border-left: 4px solid #0284C7;">
            <div style="font-size: 9.5px; font-weight: 700; color: #0284C7; margin-bottom: 4px;">IEEE Format:</div>
            <p class="pdf-body" style="font-family: monospace; font-size: 9px;">${data.citations.IEEE}</p>
          </div>
        </div>
      </div>

      <!-- Page 2 Footer -->
      <div class="pdf-footer">
        <span>AI Research Assistant — Automated Scientific Synthesis</span>
        <span>Page 2 of 2</span>
      </div>
    </div>
  `;

  container.innerHTML = styles + page1HTML + page2HTML;
  document.body.appendChild(container);

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const page1El = container.querySelector('#pdf-page-1');
    const page2El = container.querySelector('#pdf-page-2');

    // Render Page 1
    const canvas1 = await html2canvas(page1El, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 800
    });
    const imgData1 = canvas1.toDataURL('image/png');
    pdf.addImage(imgData1, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

    // Render Page 2
    const canvas2 = await html2canvas(page2El, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 800
    });
    const imgData2 = canvas2.toDataURL('image/png');
    pdf.addPage();
    pdf.addImage(imgData2, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

    // Clean Filename
    const cleanTitle = data.title
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .slice(0, 40)
      .replace(/\s+/g, '_');
    
    const fileName = `${cleanTitle || 'Paper'}_Literature_Review_Report.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF report:', error);
    throw error;
  } finally {
    document.body.removeChild(container);
  }
}
