import { LocaleKey } from './strings';

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

export const GUIDE_SECTIONS_EN: GuideSection[] = [
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

export const GUIDE_SECTIONS_ZH: GuideSection[] = [
  {
    title: '理解问题框架变量',
    blocks: [
      { subtitle: '解决方案 — 是', bullets: [
        '创业公司提供的产品、服务或方案。',
        '已经构建并向客户提供/销售的内容。',
        '示例："AI 驱动的品牌监测看板"、"自动化费用管理平台"、"无代码流程自动化工具"。',
      ]},
      { subtitle: '解决方案 — 不是', bullets: [
        '模糊的市场标语（例如：“我们帮助企业成功”）。',
        '好处或结果（那属于目标/期望）。',
        '客户问题或痛点（那属于障碍）。',
        '尚未构建或未公开上线的愿景产品。',
      ]},
      { subtitle: '客户细分 — 是', bullets: [
        '公开沟通中强调的痛点人群。',
        '示例：“50-200 人公司的 HR 经理”。',
      ]},
      { subtitle: '客户细分 — 不是', bullets: [
        '与公开目标不同的终端用户（如儿童使用、父母是目标客户）。',
        '尚未公开的理想客户（违反公开信息要求）。',
      ]},
    ],
  },
  {
    title: '识别真正的客户（多方角色）',
    description: '在多方角色场景下确定主要客户。',
    blocks: [
      { subtitle: '决策框架：创业公司在为谁解决问题？', bullets: [
        '官网价值主张检验：阅读首页；突出谁的痛点？（如“将基础设施成本降低 40%”→ 财务；“部署更快...”→ 工程）。',
        '案例/推荐语检验：最多被引用的职位是谁？',
        '障碍与目标匹配检验：目标/障碍从谁的视角书写？（如“手工审批拖慢采购”→ 运营）。',
        '待办工作锚点：客户“雇佣”产品时，究竟为谁完成工作？',
      ]},
      { subtitle: '经验法则', paragraphs: [
        '如果稍改官网文案就能吸引另一类角色，你可能选错客户。客户就是体验核心障碍/目标的那个人。',
      ]},
      { subtitle: '多方角色示例', paragraphs: [
        '由 CFO 购买的开发者工具：产品 = CI/CD；CFO 关注成本，工程团队关注速度。客户 = 工程团队（痛点驱动购买）。',
        '由 CFO 购买的金融软件：产品 = 费用管理；CFO 批准/使用，员工提交。客户 = CFO/财务团队（关心合规/控制）。',
        '学习平台：HR 采购/分配，员工学习，管理者跟踪。客户 = HR（入职/合规痛点）。',
      ]},
    ],
  },
  {
    title: '情境、目标、障碍',
    blocks: [
      { subtitle: '情境（何时） — 是', bullets: [
        '问题发生的具体触发场景/时间（如“在准备季度业务回顾时”）。',
      ]},
      { subtitle: '情境 — 不是', bullets: [
        '泛泛的业务运营；模糊时间如“总是”或“工作时”。',
      ]},
      { subtitle: '目标/期望 — 是', bullets: [
        '客户想要的结果/终态，与解决方案无关（如“跟踪 AI 搜索结果中的品牌曝光”）。',
        '面向未来；可能是情绪或功能进步。',
      ]},
      { subtitle: '目标/期望 — 不是', bullets: [
        '产品功能、流程步骤，或笼统的“更高效”。',
      ]},
      { subtitle: '障碍 — 是', bullets: [
        '阻碍目标的具体障碍（如“难以获得可靠、可比的早期创业公司数据”）。',
        '解释客户为何受阻；可映射到价值主张。',
      ]},
      { subtitle: '障碍 — 不是', bullets: [
        '“资源不足”“复杂性”等模糊词，或竞争劣势。',
      ]},
    ],
  },
  {
    title: '关键筛选：公开 vs 私密 & 无效回答',
    blocks: [
      { subtitle: '访谈技巧', bullets: [
        '提示创始人：“先想想你们官网”，将讨论锚定公开信息。',
        '主要聚焦：验证解决方案/客户与公开沟通一致。',
      ]},
      { subtitle: '过滤问题回答', bullets: [
        '私密信息：内部战略、愿景、销售细节、具体客户、转型计划、未公开指标。',
        '无效回答：与变量无关、矛盾、不连贯，或与官网严重偏离。',
      ]},
      { subtitle: '红旗（通用）', bullets: [
        '回答的变量搞错（如障碍/目标混淆）、矛盾、难以理解、与官网脱节。',
      ]},
      { subtitle: '红旗（客户细分）', bullets: [
        '客户与官网不符、同时列出 3+ 类等量客户、“人人都是客户”、不同变量间客户群不一致。',
      ]},
      { subtitle: '行动', bullets: [
        '追问：澄清回答如何对应当前变量。',
        '锚定：“如果看你们官网，我会认为主要客户是谁？”',
      ]},
      { subtitle: '公开信息', bullets: [
        '任何人都能获取：官网、LinkedIn、PitchBook/Crunchbase、媒体、案例、博客、社交媒体。',
        '如果 LLM 能通过网页搜索找到，它就是“公开”的。',
      ]},
      { subtitle: '私密信息', bullets: [
        '需要内部访问/关系：路线图、转型计划、销售获知的细节、具体实现、未公开指标。',
        '需要内部身份或客户身份才能知道的，都是“私密”的。',
      ]},
    ],
  },
  {
    title: '边缘情况',
    blocks: [
      { subtitle: '产品提供不匹配', bullets: [
        '与官网不符的功能/客户 → 私密信息。',
        '与未公开产品相关的变量 → 私密信息。',
        '信号：如“官网过时”“我们曾经…”“正在转型/拆分”。',
      ]},
      { subtitle: '障碍/期望未在网上明确写出', bullets: [
        '障碍/目标通常不会直接写出，但应与公开的产品/客户逻辑对应。',
        '若关联未公开的产品/客户，则视为私密。',
      ]},
    ],
  },
];

export const getGuideSections = (locale: LocaleKey = 'zh'): GuideSection[] =>
  locale === 'en' ? GUIDE_SECTIONS_EN : GUIDE_SECTIONS_ZH;
