export type GuideBlock = {
  subtitle?: string;
  bullets?: string[];
  paragraphs?: string[];
};

export type GuideSection = {
  title: string;
  description?: string;
  blocks: GuideBlock[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    title: 'Understanding Problem Framework Variables',
    blocks: [
      { subtitle: 'Solution — IS', bullets: [
        'The product, service, or offering the startup provides.',
        'What the startup has built and is selling/offering to customers.',
        'Examples: "AI-powered brand monitoring dashboard", "Automated expense management platform", "No-code workflow automation tool".',
      ]},
      { subtitle: 'Solution — IS NOT', bullets: [
        'Vague marketing taglines (e.g., "we help companies succeed").',
        'Benefits or outcomes (those are goals/aspirations).',
        'Customer problems or pain points (those are barriers).',
        'Aspirational products not yet built or publicly launched.',
      ]},
      { subtitle: 'Customer Segment — IS', bullets: [
        'Those whose pain points the startup is alleviating, as represented in public communication.',
        'Example: "HR managers at 50-200 person companies".',
      ]},
      { subtitle: 'Customer Segment — IS NOT', bullets: [
        'End users who differ from the public target (e.g., kids using app vs. parents as target).',
        'Aspirational customers not yet publicly targeted (violates public info requirement).',
      ]},
    ],
  },
  {
    title: 'Identifying the Real Customer (Multi-Stakeholder)',
    description: 'Determine the primary customer when multiple stakeholders are involved.',
    blocks: [
      { subtitle: 'Decision Framework: Who is the startup solving for?', bullets: [
        'Website Value Proposition Test: read homepage; whose problem is emphasized? (e.g., "Cut infrastructure costs by 40%" → Finance; "Deploy faster..." → Engineering).',
        'Case Study/Testimonial Test: whose titles are quoted most?',
        'Barriers & Goals Alignment Test: from whose perspective are goals/barriers written? (e.g., "Manual approval slows procurement" → Ops).',
        'Jobs-to-be-Done Anchor: when someone "hires" this product, whose job is being done?',
      ]},
      { subtitle: 'Rule of Thumb', paragraphs: [
        'If the website could be rewritten to appeal to a different stakeholder without changing the product, you picked the wrong customer. The customer is whoever experiences the core barriers/goals emphasized publicly.',
      ]},
      { subtitle: 'Multi-Stakeholder Examples', paragraphs: [
        'Dev tool bought by CFO: Product = CI/CD; CFO approves (cost), Engineering uses (speed). Customer = Engineering (pain points drive purchase).',
        'Financial software bought by CFO: Product = Expense mgmt; CFO approves/uses; employees submit. Customer = CFO/Finance (controls/compliance).',
        'Learning platform: HR buys/assigns; employees take courses; managers track. Customer = HR (compliance/onboarding pains).',
      ]},
    ],
  },
  {
    title: 'Context, Goals, Barriers',
    blocks: [
      { subtitle: 'Context (When) — IS', bullets: [
        'Specific triggering situation/timing when problem occurs (e.g., "when preparing quarterly business reviews").',
      ]},
      { subtitle: 'Context — IS NOT', bullets: [
        'General business operations; vague timing like "always" or "whenever working".',
      ]},
      { subtitle: 'Goal / Aspiration — IS', bullets: [
        'Desired outcome/end state the customer wants, solution-agnostic (e.g., "track brand visibility in AI search results").',
        'Future-oriented; emotional or functional progress.',
      ]},
      { subtitle: 'Goal / Aspiration — IS NOT', bullets: [
        'Features of your solution, process steps, or generic "be more efficient".',
      ]},
      { subtitle: 'Barriers — IS', bullets: [
        'Specific obstacles preventing the goal (e.g., "Hard to gather reliable, comparable data on early-stage startups").',
        'Explain why customers are stuck; map to value props.',
      ]},
      { subtitle: 'Barriers — IS NOT', bullets: [
        'Vague terms like "lack of resources", "complexity", competitive disadvantages.',
      ]},
    ],
  },
  {
    title: 'Critical Filtering: Public vs Private & Nonsense',
    blocks: [
      { subtitle: 'Interview Technique', bullets: [
        'Prompt founders: "Think about your website first" to anchor in public info.',
        'Primary focus: verify solutions/customers match public communication.',
      ]},
      { subtitle: 'Filter Problematic Responses', bullets: [
        'Private information: internal strategy, aspirational not public, sales-only details, customer specifics, pivot plans, undisclosed metrics.',
        'Nonsensical responses: unrelated to the variable, contradictory, incoherent, or wildly off-website.',
      ]},
      { subtitle: 'Red Flags (General)', bullets: [
        'Answer about wrong variable (barriers vs goals), contradictions, incomprehensible reasoning, off-website divergence.',
      ]},
      { subtitle: 'Red Flags (Customer Segment)', bullets: [
        'Customer doesn’t match any website messaging, 3+ equal segments, "everyone needs this", segments change across variables.',
      ]},
      { subtitle: 'Action', bullets: [
        'Probe: clarify how the response relates to the specific variable.',
        'Anchor: "When I look at your website, who would I think is your primary customer?"',
      ]},
      { subtitle: 'Public Information', bullets: [
        'Available to anyone: website, LinkedIn, PitchBook/Crunchbase, press, case studies, blog posts, social media.',
        'If an LLM could find it via web search, it’s PUBLIC.',
      ]},
      { subtitle: 'Private Information', bullets: [
        'Requires insider access/relationship: roadmap, future pivots, sales-call learnings, specific implementations, undisclosed metrics.',
        'If it requires being an insider/customer, it’s PRIVATE.',
      ]},
    ],
  },
  {
    title: 'Corner Cases',
    blocks: [
      { subtitle: 'Product Offering Mismatches', bullets: [
        'Features/customers not on the website → PRIVATE.',
        'Variables tied to non-public products → PRIVATE.',
        'Signals: "website is outdated", "we used to", "we’re pivoting", "we spun out".',
      ]},
      { subtitle: 'Barriers/Aspirations Not Explicit Online', bullets: [
        'Barriers/goals are rarely explicit, but should logically follow from public products/customers.',
        'If tied to non-public products/customers, treat as PRIVATE.',
      ]},
    ],
  },
];
