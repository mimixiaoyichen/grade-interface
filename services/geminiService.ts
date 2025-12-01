
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { 
  GeminiAnalysisResponse, 
  GeminiSplitResponse, 
  BaselineStatement, 
  ComparisonResult 
} from '../types';
import { 
  ANALYSIS_PROMPT_TEMPLATE, 
  SPLIT_TRANSCRIPT_PROMPT, 
  BASELINE_PROMPT_GPT5,
  COMPARISON_PROMPT 
} from '../constants';

const splitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    part1: { type: Type.STRING, description: "The first part of the interview (Discovery)" },
    part2: { type: Type.STRING, description: "The second part of the interview (Feedback/Correction)" },
    reasoning: { type: Type.STRING, description: "Explanation of why the split was made here" }
  },
  required: ["part1", "part2", "reasoning"]
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    customers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          publicEvidence: { type: Type.STRING, description: "Evidence from the public doc, or 'Not found'" },
          isSupportedByPublic: { type: Type.BOOLEAN }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"]
      }
    },
    contexts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          publicEvidence: { type: Type.STRING },
          isSupportedByPublic: { type: Type.BOOLEAN }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"]
      }
    },
    goals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          publicEvidence: { type: Type.STRING },
          isSupportedByPublic: { type: Type.BOOLEAN }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"]
      }
    },
    barriers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quotes: { type: Type.ARRAY, items: { type: Type.STRING } },
          publicEvidence: { type: Type.STRING },
          isSupportedByPublic: { type: Type.BOOLEAN }
        },
        required: ["description", "quotes", "publicEvidence", "isSupportedByPublic"]
      }
    },
    finalStatement: { type: Type.STRING }
  },
  required: ["customers", "contexts", "goals", "barriers", "finalStatement"]
};

const baselineSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    SOLUTION: { type: Type.STRING },
    CUSTOMER_SEGMENT: { type: Type.STRING },
    LIFE_BUSINESS_CONTEXT: { type: Type.STRING },
    JOB_TO_BE_DONE: { type: Type.STRING },
    SPECIFIC_BARRIERS: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["SOLUTION", "CUSTOMER_SEGMENT", "LIFE_BUSINESS_CONTEXT", "JOB_TO_BE_DONE", "SPECIFIC_BARRIERS"]
};

const comparisonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    rows: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          component: { type: Type.STRING, enum: ["Customer", "Context", "Goal", "Barrier"] },
          baselineText: { type: Type.STRING },
          transcriptModification: { type: Type.STRING },
          type: { type: Type.STRING, enum: ["Modification", "Omission", "Hallucination", "Confirmation"] },
          transcriptEvidence: { type: Type.STRING },
          publicSupport: { type: Type.STRING }
        },
        required: ["component", "baselineText", "transcriptModification", "type", "transcriptEvidence", "publicSupport"]
      }
    }
  },
  required: ["rows"]
};

// --- API Functions ---

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_ID = 'gemini-3-pro-preview';

/**
 * Helper to fetch and CLEAN raw HTML using aggressive filtering.
 */
const fetchCleanTextFromUrl = async (url: string): Promise<string> => {
  try {
    // Using allorigins.win as a public CORS proxy
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) return `[Failed to fetch content: ${response.statusText}]`;
    
    const data = await response.json();
    const rawHtml = data.contents;
    
    if (!rawHtml) return "[No content returned from proxy]";

    // Parse HTML to DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    // 1. Aggressive Junk Removal
    const junkSelectors = [
      'script', 'style', 'noscript', 'iframe', 'svg', 
      'link', 'meta', 'head', 'input', 'button', 'form', 
      'textarea', 'select', 'option', 'template', 'object', 
      'embed', 'map', 'area', 'nav', 'footer', 'aside'
    ];
    junkSelectors.forEach(sel => {
      const elements = doc.querySelectorAll(sel);
      elements.forEach(el => el.remove());
    });

    // 2. Improve formatting for text extraction
    // Prepend newlines to block elements so text doesn't merge (e.g. </div><div> becomes \n)
    const blockSelectors = ['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'br', 'tr', 'article', 'section', 'blockquote'];
    blockSelectors.forEach(sel => {
      const elements = doc.querySelectorAll(sel);
      elements.forEach(el => {
        el.prepend(document.createTextNode('\n'));
      });
    });

    // 3. Extract text content
    const textContent = doc.body.textContent || "";

    // 4. Line-by-Line Filtering to strip "Code Nonsense"
    // We split by newline, trim, and then discard lines that look like JS/CSS code
    return textContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => {
        if (!line) return false;
        if (line.length < 3) return false; // Too short to be meaningful text
        
        // Code heuristics
        if (line.includes('{') && line.includes('}')) return false; // Likely CSS or JSON
        if (line.includes('function(') || line.includes('=>') || line.includes('return ')) return false; // Likely JS
        if (line.startsWith('/*') || line.startsWith('//')) return false; // Comments
        if (line.includes('var ') || line.includes('const ') || line.includes('let ')) return false;
        
        // Minified code heuristic: very long line with no spaces
        if (line.length > 500 && !line.includes(' ')) return false;

        return true;
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
      .trim();

  } catch (e: any) {
    return `[Error cleaning content: ${e.message}]`;
  }
};

export const fetchPublicInfoFromUrl = async (url: string): Promise<string> => {
  // 1. Fetch Cleaned Text (Parallel)
  const textPromise = fetchCleanTextFromUrl(url);

  // 2. Perform Gemini Search for Context/Summary (Parallel)
  const ai = getAI();
  const prompt = `
    I need to gather public information about a startup to use as a "Source of Truth" for analysis.
    
    Target Company URL: ${url}
    
    Please perform a Google Search to find information about this specific company.
    Focus on finding:
    1. What is their specific product or service?
    2. Who is their target customer?
    3. What value propositions do they claim?
    4. How do they describe the problem they solve?
    
    Provide a comprehensive, detailed summary of the public information found. 
    Do not add marketing fluff, just the facts found on their website or news coverage.
  `;

  const searchPromise = ai.models.generateContent({
    model: MODEL_ID, 
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  // Wait for both
  const [cleanedText, searchResponse] = await Promise.all([textPromise, searchPromise]);

  let text = searchResponse.text || "No summary generated.";
  
  // Extract sources if available from Search
  const chunks = searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks && chunks.length > 0) {
    const urls = chunks
      .map((c: any) => c.web?.uri)
      .filter((uri: string) => uri);
    
    if (urls.length > 0) {
      const uniqueUrls = Array.from(new Set(urls));
      text += "\n\n--- Identified Sources (Search) ---\n" + uniqueUrls.join("\n");
    }
  }

  // Combine Search Summary + Cleaned Site Text
  return `${text}\n\n==========================================\n=== VERBATIM PAGE CONTENT (Cleaned) ===\n==========================================\n\n${cleanedText}`;
};

export const splitTranscript = async (fullTranscript: string): Promise<GeminiSplitResponse> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      { role: 'user', parts: [{ text: SPLIT_TRANSCRIPT_PROMPT }] },
      { role: 'user', parts: [{ text: `FULL TRANSCRIPT:\n\n${fullTranscript}` }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: splitSchema,
      temperature: 0.1,
    }
  });

  if (!response.text) throw new Error("Failed to split transcript");
  return JSON.parse(response.text) as GeminiSplitResponse;
};

export const analyzeSegment = async (
  transcriptSegment: string, 
  publicInfo: string,
  founderInput: string
): Promise<GeminiAnalysisResponse> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      { role: 'user', parts: [{ text: ANALYSIS_PROMPT_TEMPLATE }] },
      { role: 'user', parts: [{ text: `FOUNDER'S PRIOR STATEMENT:\n${founderInput}\n\nPUBLIC CONTEXT (Truth Source):\n${publicInfo || "No public context provided."}\n\nTRANSCRIPT SEGMENT:\n${transcriptSegment}` }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: analysisSchema,
      temperature: 0.2,
    }
  });

  if (!response.text) throw new Error("Failed to analyze segment");
  return JSON.parse(response.text) as GeminiAnalysisResponse;
};

export const generateBaselineStatement = async (
  publicInfo: string
): Promise<BaselineStatement> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      { role: 'user', parts: [{ text: BASELINE_PROMPT_GPT5 }] },
      { role: 'user', parts: [{ text: `SOURCE MATERIAL:\n${publicInfo}` }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: baselineSchema,
      temperature: 0.2,
    }
  });

  if (!response.text) throw new Error("Failed to generate baseline");
  return JSON.parse(response.text) as BaselineStatement;
};

export const generateComparison = async (
  baseline: BaselineStatement,
  transcriptPart2: string,
  publicInfo: string
): Promise<ComparisonResult> => {
  const ai = getAI();

  const baselineStr = JSON.stringify(baseline, null, 2);

  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      { role: 'user', parts: [{ text: COMPARISON_PROMPT }] },
      { role: 'user', parts: [{ text: `BASELINE STATEMENT:\n${baselineStr}\n\nPUBLIC INFO:\n${publicInfo}\n\nTRANSCRIPT PART 2 (FEEDBACK):\n${transcriptPart2}` }] }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: comparisonSchema,
      temperature: 0.1,
    }
  });

  if (!response.text) throw new Error("Failed to generate comparison");
  return JSON.parse(response.text) as ComparisonResult;
};
