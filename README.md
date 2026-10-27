# GRADE: Grounded Research with AI-assisted Discovery and Expert Validation

**A structured interview protocol and web-based tool for validating LLM-generated profiles against expert judgment.**

> Live walkthrough (synthetic data, no API calls): [grade-interface.vercel.app](https://grade-interface.vercel.app)

---

## Overview

Large language models can construct structured, comparable profiles of real-world entities from public text at scale. This capability raises a validity question: when an LLM synthesizes extensive information without labeled ground truth, how can researchers assess accuracy and characterize errors?

GRADE addresses this through a human-guided research loop that combines AI-assisted retrieval with structured expert interviews. The system retrieves public information and constructs a structured profile; an expert first describes the entity without seeing the profile, then reviews it field by field. Their corrections validate the representation. After the interview, AI compares corrections with the original profile and identifies supporting transcript passages for interviewer review.

This repository contains the full source code for the GRADE web application, all LLM prompt text, and a live interactive walkthrough using synthetic examples.

---

## The Five-Stage Protocol

GRADE proceeds across three phases:

**Pre-Interview**

1. **Retrieve** — The system crawls the entity's official website and runs a web search for third-party sources (news, funding, product coverage). Both pipelines are concatenated into an evidence base retained for later verification.
2. **Construct** — An LLM converts the evidence base into a structured profile using researcher-defined fields and an automated quality-assurance pass. The profile is generated before the interview begins, held by the interviewer, and not shown to the expert.

**Interview**

3. **Blind Elicitation** — The interviewer asks about each profile field without revealing the AI-generated profile. This produces an unprompted account of what the expert considers important before exposure to the LLM's framing.
4. **Reveal and Correct** — The profile is revealed to the expert for the first time. The expert reviews each field and may confirm, modify, add omitted content, or flag incorrect information. Differences between the expert's account and the profile guide follow-up questions.

**Post-Interview**

5. **Validate** — The interviewer supplies the interview transcript. AI compares the expert's corrections with the original profile, proposes correction categories (Confirmation, Modification, Omission, Hallucination), and identifies supporting transcript passages. The interviewer checks and revises the proposed coding before export.

---

## Applied Study

We deployed GRADE to validate AI-generated problem statements for approximately 90,000 venture-backed U.S. startups and completed **331 founder interviews** with nine trained interviewers.

The validation analysis covers four core profile components (Solution, Customer Segment, Life/Business Context, Goal/Aspiration), producing 1,324 component-by-interview observations:

- **71.8%** Confirmations — the LLM extraction was accepted without change
- **22.2%** Modifications — founders revised phrasing or added detail
- **4.3%** Omissions — the field was missing content founders considered central
- **1.7%** Hallucinations — the field contained information founders identified as incorrect

For modified components, cosine similarity between LLM extraction and founder-revised text ranged from 0.866–0.903 (mean), consistent with revisions that refine rather than reject the original framing. Cohen's *d* exceeds 4.7 against a within-component random-pair null (*p* < 0.001) in every component.

Per-interview retrieval and extraction cost approximately $0.08–$0.15 at current API pricing. Pre-interview pipeline time is 30–90 seconds per company; interview sessions average 28 minutes.

This work is reported in:

> Bernstein, S., Chen, M., Lane, J. N., & Ma, Z. (2026). *Beyond a technology lens: Characterizing the problems entrepreneurs solve.* Harvard Business School Working Paper 27-016. [SSRN](https://ssrn.com/abstract=7339099)

---

## Generalizing to Other Research

GRADE is designed as reusable research infrastructure. The startup problem statement application is one instantiation; the protocol is domain-agnostic.

**To adapt GRADE to a new research context, researchers change three things:**

1. **Profile fields** — defined in `types.ts` (`BaselineStatement`) and rendered in `components/BaselineReview.tsx`. Any set of researcher-defined fields can replace the JTBD schema used in this study.
2. **LLM prompts** — all prompt text lives in `prompts/` and is versioned alongside the code. Prompts for extraction, QA, comparison, evidence identification, and barrier selection can each be modified independently without touching the application logic.
3. **Interviewer scripts** — the per-field scripts shown to interviewers during blind elicitation and reveal steps are defined in `utils/strings.ts` under `founder.scripts.*`. These can be replaced with domain-appropriate question text.

Potential applications described in the paper include: validating firm capability profiles with managers and customers; comparing job descriptions with workers' and supervisors' accounts of actual tasks; and validating service profiles from customer reviews with staff and service-user accounts.

---

## Repository Structure

```
org-science-tool/
├── api/                     # Vercel Serverless Functions
│   ├── _openai.ts           # Shared OpenAI client
│   ├── extract.ts           # Stage 2: LLM extraction (gpt-5.2)
│   ├── qa-check.ts          # Stage 2: QA pass (gpt-5.2)
│   ├── fetch.ts             # Stage 1: Official site crawl
│   ├── search.ts            # Stage 1: Web search
│   ├── split.ts             # Stage 5: Transcript splitting
│   ├── analyze.ts           # Stage 5: Part 1 transcript analysis
│   ├── compare.ts           # Stage 5: Profile vs. corrections comparison
│   ├── evidence.ts          # Stage 5: Transcript evidence extraction
│   ├── support-check.ts     # Stage 5: Public-source support check
│   ├── barriers.ts          # Barrier selection
│   ├── transcribe.ts        # Audio transcription (ElevenLabs)
│   └── blob-upload-url.ts   # Server-side Vercel Blob token exchange
│
├── prompts/                 # All LLM prompt text (versioned)
│   ├── baseline.md          # Extraction system prompt
│   ├── interviewerGuide.md  # Interviewer reference guide
│   ├── analysis.ts          # Part 1 analysis prompt
│   ├── comparison.ts        # Profile comparison prompt
│   ├── componentEvidence.ts # Evidence extraction prompt
│   ├── split.ts             # Transcript split prompt
│   ├── supportCheck.ts      # Public support verification prompt
│   └── barrierSelector.ts   # Barrier selection prompt
│
├── components/              # React UI components
│   ├── BaselineReview.tsx   # Stage 4: Field-by-field profile review
│   ├── Part2Comparison.tsx  # Stage 5: Correction table with evidence
│   ├── ComparisonTable.tsx  # Correction row rendering
│   ├── SplitVerifier.tsx    # Transcript split confirmation
│   ├── ConsentModal.tsx     # Participant consent collection
│   ├── StepIndicator.tsx    # Protocol stage navigation
│   ├── TutorialSidebar.tsx  # Interactive walkthrough overlay
│   └── CaseDashboard.tsx    # Walkthrough case selection
│
├── utils/
│   ├── strings.ts           # All UI text and interviewer scripts
│   ├── tutorialData.ts      # Synthetic walkthrough cases
│   ├── guideContent.ts      # Interviewer guide content
│   ├── buildExportJson.ts   # Session record export builder
│   ├── blobUpload.ts        # Client-side Blob upload (secure)
│   └── barriers.ts          # Barrier text normalization
│
├── services/
│   └── aiService.ts         # Client → API bridge
│
├── tests/                   # Unit tests
├── App.tsx                  # Main application and wizard state
├── types.ts                 # TypeScript types (BaselineStatement, etc.)
├── consent.docx             # Participant consent form template
└── prompts/baseline.md      # Core extraction prompt
```

---

## Setup

### Prerequisites

- Node.js 18+
- An OpenAI API key (required for extraction, comparison, and transcript analysis)
- A Vercel account (for deployment; optional for local development)

### Local Development

```bash
git clone https://github.com/mimixiaoyichen/grade-tool.git
cd org-science-tool
npm install
```

Create a `.env` file (never committed):

```
OPENAI_API_KEY=sk-...
```

Start the development server:

```bash
npm run dev
```

The app runs at `http://localhost:5173`. API functions run via the Vercel CLI dev server:

```bash
vercel dev
```

### Deployment

```bash
vercel --prod
```

Set `OPENAI_API_KEY` in your Vercel project's environment variables. Audio transcription requires an additional `ELEVENLABS_API_KEY`; Vercel Blob storage for large audio files requires `BLOB_READ_WRITE_TOKEN`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Powers extraction, QA, comparison, evidence, and split |
| `ELEVENLABS_API_KEY` | No | Audio transcription with speaker diarization |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob storage for audio files > 4 MB |

All variables are server-side only. No secrets are exposed to the browser bundle.

---

## Data Export Format

Each completed session exports as a structured JSON record containing:

- Session metadata (company URL, timestamp, consent fields)
- Public information evidence base (fetched + PitchBook)
- LLM-generated candidate profile (raw 4o output + QA-revised gpt-5.2 output)
- Founder's blind account (pre-reveal elicitation, field by field)
- Interviewer-reviewed corrections
- Full interview transcript and transcript split
- AI-generated comparison table with transcript evidence passages
- Per-component correction status (Confirmation / Modification / Omission / Hallucination)

The export format is documented in `utils/buildExportJson.ts` and the Technical Appendix of the working paper.

---

## Models

The current deployment uses proprietary OpenAI models:

- **gpt-5.2** — extraction and QA (structured output, low temperature)
- **gpt-4o** — analysis, comparison, split, evidence, support-check

Future work could explore open-source alternatives (e.g., Llama 3, Mistral) for researchers who require fully self-hosted infrastructure or need to avoid proprietary model dependency. All prompt text is model-agnostic and stored in `prompts/` for easy substitution.

---

## Ethics and Data Handling

Founder participation was voluntary. Founders provided informed consent at session initiation and were informed that their corrections would be used to evaluate AI-generated company profiles. All recruitment and session data are stored in a Level 3 approved Harvard Business School Dropbox. The participant consent form template is included as `consent.docx`.

The blind elicitation design creates an ethical asymmetry: the interviewer holds a pre-formed view of the company that the expert has not seen. Interviewers were trained, following a structured interviewer script, to ask open-ended questions without leading the founder toward the LLM framing and to disclose the extraction verbatim at the reveal step without paraphrase or editorial comment.

---

## Reproducibility

An interactive walkthrough using synthetic examples and no live API calls is available at [grade-interface.vercel.app](https://grade-interface.vercel.app). The walkthrough demonstrates the complete five-stage protocol with two contrasting cases (a well-aligned extraction and one that misses key details).

We aim to release numerical replication data permitted under participant consent and applicable data agreements, alongside reproducible analysis scripts and labeled synthetic sessions. See Section A.7 of the working paper for the planned release scope.

---

## Citation

```bibtex
@techreport{bernstein2026grade,
  title     = {Beyond a Technology Lens: Characterizing the Problems Entrepreneurs Solve},
  author    = {Bernstein, Shai and Chen, Mimi and Lane, Jacqueline N. and Ma, Zilin},
  year      = {2026},
  institution = {Harvard Business School},
  number    = {27-016},
  url       = {https://ssrn.com/abstract=7339099}
}
```

---

## License

MIT — see `LICENSE`.
