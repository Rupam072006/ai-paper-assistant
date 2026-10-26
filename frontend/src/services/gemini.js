import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `You are an expert AI Literature & Synthesis Research Assistant specializing in deep scientific paper analysis.
Your goal is to answer research questions clearly, thoroughly, accurately, and with deep grounded insights from the provided paper context.
- When explaining methodology, models, algorithms, datasets, findings, or limitations, reference exact section titles, quotes, and page numbers whenever available (e.g., "From Section 3.2 (Page 5): ...").
- Present responses in clear, well-structured, easy-to-understand formatting with bullet points and bold highlights.
- If the user uses a slash shortcut like /summarize, /critique, or /data, provide an extensive, structured breakdown accordingly.

At the very end of your response, provide exactly 3 concise, highly relevant follow-up questions for the user to ask next, formatted with the exact separator below:
---FOLLOW_UP_QUESTIONS---
1. [Follow up question 1]
2. [Follow up question 2]
3. [Follow up question 3]`;

/**
 * Parses raw text from Gemini to separate main answer from follow-up questions.
 * @param {string} rawText 
 * @returns {{ answer: string, followUpQuestions: string[] }}
 */
export function parseGeminiResponse(rawText) {
  if (!rawText) return { answer: '', followUpQuestions: [] };

  const delimiter = '---FOLLOW_UP_QUESTIONS---';
  if (rawText.includes(delimiter)) {
    const parts = rawText.split(delimiter);
    const answerPart = parts[0].trim();
    const questionsPart = parts[1] || '';
    
    const questions = questionsPart
      .split('\n')
      .map((line) => line.replace(/^\d+[\.\)]\s*|\*\s*|-\s*/g, '').trim())
      .filter((line) => line.length > 5 && (line.endsWith('?') || line.length > 10))
      .slice(0, 3);

    return {
      answer: answerPart,
      followUpQuestions: questions
    };
  }

  return {
    answer: rawText.trim(),
    followUpQuestions: []
  };
}

/**
 * Generate smart contextual follow-up questions based on query and paper domain.
 * @param {string} queryText 
 * @param {Object|null} paper 
 * @returns {string[]}
 */
export function getContextualFollowUps(queryText, paper = null) {
  const q = (queryText || '').toLowerCase();
  
  if (q.includes('dataset') || q.includes('data') || q.includes('sample') || q.includes('cohort')) {
    return [
      'What evaluation metrics were used to assess the models on this dataset?',
      'What were the key dataset limitations or sampling constraints identified?',
      'How does the sample size impact the generalizability of the findings?'
    ];
  }
  
  if (q.includes('method') || q.includes('algorithm') || q.includes('model') || q.includes('approach') || q.includes('framework')) {
    return [
      'What baseline algorithms or models was this approach compared against?',
      'What specific architectural or hyperparameter decisions were made?',
      'What are the practical computational requirements or limitations of this method?'
    ];
  }
  
  if (q.includes('result') || q.includes('accuracy') || q.includes('metric') || q.includes('score') || q.includes('performance') || q.includes('f1')) {
    return [
      'What were the primary failure cases or anomalies reported in the results?',
      'How statistically significant were these performance improvements over baselines?',
      'What future research directions did the authors propose based on these outcomes?'
    ];
  }

  if (q.includes('limit') || q.includes('gap') || q.includes('weakness') || q.includes('threat')) {
    return [
      'How do the authors suggest addressing these limitations in future work?',
      'What alternative methodologies could overcome these constraints?',
      'How do these limitations affect practical deployment in real-world environments?'
    ];
  }

  return [
    'What specific methodology and model architecture was used?',
    'What datasets, sample sizes, and evaluation metrics were reported?',
    'What are the primary limitations and future research directions?'
  ];
}

/**
 * Ask Gemini with contextual research paper data.
 * @param {string} query - User question.
 * @param {Array} papers - List of uploaded paper objects with analysis.
 * @param {string|null} selectedPaperId - Specific paper ID or null for all.
 * @returns {Promise<{ answer: string, followUpQuestions: string[] }|null>}
 */
export async function askGemini(query, papers = [], selectedPaperId = null) {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem('llm_api_key') ||
    'AQ.Ab8RN6IcQyc96cJHlClB-WdrHhJLSiCGOmLKZL1ogReJKzcxtg';

  if (!apiKey) {
    return null;
  }

  // Filter papers if a specific paper is selected
  const activePapers = selectedPaperId
    ? papers.filter((p) => p.id === selectedPaperId)
    : papers;

  // Build context from active papers
  let papersContext = '';
  if (activePapers.length > 0) {
    papersContext = activePapers
      .map((p, idx) => {
        const an = p.analysis || {};
        let textExcerpt = '';
        if (p.raw_text) {
          textExcerpt = `\nFull Paper Excerpts & Sections:\n${p.raw_text.slice(0, 12000)}`;
        }
        return `
[Paper #${idx + 1}]
Title: ${p.title || 'Untitled'}
Authors: ${p.authors || 'Unknown'}
Year: ${p.year || p.publication_year || 'N/A'}
Abstract: ${p.abstract || 'N/A'}
Research Problem: ${an.research_problem || 'N/A'}
Methodology: ${an.methodology || 'N/A'}
Algorithms / Models: ${an.algorithms || 'N/A'}
Dataset: ${an.dataset_name || 'N/A'} (Size: ${an.dataset_size || 'N/A'})
Evaluation Results: ${an.results_summary || an.evaluation_metrics || 'N/A'}
Accuracy: ${an.accuracy || 'N/A'}, F1 Score: ${an.f1_score || 'N/A'}, Precision: ${an.precision || 'N/A'}, Recall: ${an.recall || 'N/A'}
Limitations: ${an.limitations || 'N/A'}
Future Work: ${an.future_work || 'N/A'}
Summary: ${an.summary || 'N/A'}${textExcerpt}
`;
      })
      .join('\n---\n');
  }

  const prompt = `Research Papers Context:
${papersContext || 'No specific papers context provided.'}

User Question:
${query}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2
      }
    });

    return parseGeminiResponse(response.text);
  } catch (error) {
    console.warn('Gemini 2.5 flash call failed, trying fallback model:', error);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.2
        }
      });
      return parseGeminiResponse(response.text);
    } catch (err2) {
      console.error('Direct Gemini call error:', err2);
      return null;
    }
  }
}
