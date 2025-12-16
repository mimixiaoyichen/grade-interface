import React from 'react';

export const translations = {
  en: {
    common: {
      appTitle: 'Founder Problem Analyst',
      guide: 'Guide',
      beta: 'BETA',
      loadJson: 'Load JSON',
      downloadJson: 'Download JSON',
      clearAll: 'Clear All & Restart',
      stepLabel: 'Step',
      back: 'Back',
      continue: 'Continue',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      add: 'Add',
      yes: 'Yes',
      no: 'No',
      viewScript: 'View Script',
      languageEn: 'English',
      languageZh: '中文'
    },
    steps: {
      publicInfo: 'Public Info',
      founderInput: 'Founder Input',
      baselineReview: 'Review Baseline',
      transcriptUpload: 'Post-interview',
      part2Comparison: 'Feedback'
    },
    errors: {
      resetConfirm: 'Are you sure you want to clear all data and start over?',
      invalidUrl: 'Please enter a valid URL.',
      publicInfoRequired: 'Public information is required.',
      fetchPublicInfoFirst: 'Please fetch public information first.',
      founderInputMissing: 'Please provide at least a Solution and Customer Segment.',
      baselineRequired: 'Baseline statement is required before analyzing the transcript.',
      transcriptRequired: 'Transcript required.',
      publicSupportInfoMissing: 'Public information is required before checking public support.',
      noSupportItems: 'No omissions or hallucinations provided to check.',
      supportCheckFailed: 'Public support check failed.',
      loadJsonFailed: 'Failed to load JSON: ',
      comparisonFailed: 'Comparison generation failed.'
    },
    statuses: {
      uploadingAudio: 'Uploading audio',
      processingDiarization: 'Processing with ElevenLabs (diarization)...',
      transcriptionDone: 'Transcription complete. Review or edit below before splitting.',
      transcriptionErrorPrefix: 'Transcription error:',
      processing: 'Processing...',
      analyzingPublicInfo: 'Analyzing Public Info...',
      regenerateBaseline: 'Regenerate Baseline',
      generateBaseline: 'Generate Baseline →'
    },
    publicInfo: {
      title: '1. Public Information',
      pitchbookLabel: 'Pitchbook Information',
      pitchbookPlaceholder: 'Copy and paste pitchbook information if available...',
      pitchbookHint: 'This will be combined with fetched public info when generating the baseline.',
      optionA: {
        title: 'Option A: Fetch from URL',
        description: 'We will use Google Search to find and summarize public info about this company. We also attempt to fetch the raw homepage HTML.',
        placeholder: 'https://example.com',
        fetch: 'Fetch'
      },
      optionB: {
        title: 'Option B: Upload File',
        description: 'Upload a pitch deck text or website copy directly.'
      },
      contentLabel: 'Public Information Content',
      contentPlaceholder: 'Content will appear here after fetch or upload...',
      buttons: {
        continue: 'Continue to Founder Input →',
        analyze: 'Analyzing Public Info...',
        regenerate: 'Regenerate Baseline',
        generate: 'Generate Baseline →'
      },
      preview: {
        title: 'LLM-generated Statement (Preview)',
        solution: 'Solution',
        customer: 'Customer',
        context: 'Context',
        goals: 'Goals',
        barriers: 'Barriers',
        noBarriers: 'No barriers available.'
      }
    },
    founder: {
      title: "2. Founder's Perspective (!!RECORD ZOOM TO COMPUTER!!)",
      subtitle: 'What does the founder think the problem is?',
      consent: 'Consent',
      labels: {
        introduction: 'Introduction',
        solution: 'Solution',
        customer: 'Customer Segment',
        context: 'Context',
        goal: 'Goal',
        barriers: 'Barriers'
      },
      placeholders: {
        solution: 'e.g. AI-powered diagnostic tool for radiologists',
        customer: 'e.g. Radiologists in high-volume trauma centers',
        context: 'e.g. When reviewing overnight CT scans with limited staff',
        goal: 'e.g. To identify critical fractures accurately and quickly',
        barrier: 'e.g. Fatigue leads to missed fractures'
      },
      addBarrier: '+ Add Barrier',
      back: 'Back',
      continue: 'Continue →',
      scripts: {
        introduction: `Overview:
“Hi [Name], thank you for joining today. I’m [Your Name], working with Professors Bernstein and Lane at Harvard Business School. We’re studying how founders define the core problem their startup solves. This interview is for research only—we are not evaluating your company. Your responses will remain confidential and only aggregate findings will be shared. With your permission, I’d like to record the conversation so that we can capture your responses accurately. Is that okay?”  
        
If yes, begin recording. If no, interviewer is expected to take detailed notes.  

Then set expectations:
“I’ll ask a series of open‑ended questions. There are no right or wrong answers—we want to understand your perspective in your own words. This will take about 20 minutes.”  

Briefly describe the problem statement framework using the following scripted introduction (read verbatim):  

“Before we dive into the specific questions, I want to quickly explain the structure we’ll use. We follow a simple framework to construct a problem statement of your company. Our goal is to understand the problem your company solves from the customer’s point of view.  

We’ll walk through five elements:  

1. Solution means what you’ve built.  

2. Customer means who is your target customer.  

3. Customers’ Aspiration means what your customers are trying to accomplish.  

4. When does the Problem occur means the specific situation or moment when your customers experience the problem.   

5. Barriers means what prevents your customers from reaching their goals without your help.  

We will only focus on your perspective as the founder. However, please respond based on the public’s understanding of your startup, and not based on private information that may not be reflected in the public knowledge domain.”  
`,
        solution: `Lead Question (read verbatim):
“Let’s begin with what you’ve built. How would you describe your product or solution? Please describe it  based on information that is publicly available on your startup.”   
      
Smooth Transition: “Thank you—that helps set the stage. Now let’s move on to the next variable. I’d like to understand who your customers are.”
 `,
        customer: `Lead Question (verbatim): “Tell me about the people or organizations that face the problem you are trying to solve. Who are they?”  

Probing (if needed):
- “Could you describe them by role or situation rather than demographics?”
- “Who is your primary customer today versus aspirational customers?”
- “What do these customers have in common?”  
      
Reflective statement before transition: “So you’re saying your core customer is ___. Did I summarize that accurately?  
[founder confirms OR offers more revisions] 
Now let’s move on to the next variable.”  `,
        context: `Lead Question (verbatim): “When does this problem occur for your customers? Can you describe the specific situation or moment when they face this challenge?”  
        
Probing:  
- “Is there a trigger event when this becomes urgent?”  
- “Can you walk me through a recent example?”  
        
Reflective statement before transition:  “So the problem typically arises when ___. Did I capture that accurately? 
[founder confirms OR offers more revisions] 
Now let’s move on to the next variable.”`,
        goal: `Lead Question (verbatim): “What are your customers ultimately trying to achieve when they come to you? To be clear, I’m asking about the progress or goals they’re seeking—not what your product does. Please describe this using only publicly available information about your startup.”  

Important framing: Ask the founder to answer as the public would understand the startup, based on public external information.  

Probing:  
- “If your product didn’t exist, what would they still be trying to achieve?”  
- “What does success look like from their perspective?”  
      
Reflective statement before transition: “What I’m hearing is that their aspiration is ___. Is that correct? 
[founder confirms OR offers more revisions] 
Now let’s move on to the next variable.”`,
        barriers: `Lead Question (verbatim): “What prevents your customers from achieving their aspirations or goals if your solution doesn’t exist? What specific obstacles stand in their way?”  

Probing:
- “Are these functional, emotional, financial, or social barriers?”
- “What have they tried that didn’t work?”

Reflective statement before transition:  “You mentioned ___ as the main barriers. Does that fully capture them?[founder confirms OR offers more revisions] 

Now let’s move on to the next variable.”  
Transitory wording between part 1 & part 2: 
“Awesome - now we have finished part 1 where you created your problem statement. Let’s proceed to the second part.”  
`
      }
    },
    baselineReview: {
      title: '3. Review LLM-Generated Statement',
      description: 'This statement was generated from Public Information. Review and edit it before comparing it to the transcript.',
      draft: 'Draft Mode',
      labels: {
        solution: 'Solution',
        customer: 'Customer Segment',
        context: 'Context',
        goal: 'Goal/ Aspiration',
        barriers: 'Specific Barriers'
      },
      addBarrier: '+ Add Barrier',
      back: 'Back',
      confirm: 'Confirm & Upload Transcript →'
    },
    transcript: {
      title: '4. Post-interview (Upload Transcript)',
      description: 'Split into "Discovery" (Part 1) and "Feedback" (Part 2). Paste text or upload audio and we will transcribe with speaker diarization (auto-splits large files).',
      uploadAudioTitle: 'Upload audio to transcribe (with diarization)',
      uploadAudioHelp: 'Drop the local meeting recording here.',
      transcribing: 'Transcribing audio…',
      transcriptTitle: 'Upload Transcript Text',
      transcriptHelp: 'Paste a transcript or upload a .txt export.',
      transcriptNote: 'Audio transcriptions will auto-fill the text area with speaker labels.',
      transcriptLabel: 'Transcript Text',
      diarizedAdded: 'Diarized transcription added',
      transcriptPlaceholder: 'Paste full transcript or upload audio to populate this area with speaker labels...',
      back: 'Back',
      split: 'Split Transcript →'
    },
    splitVerifier: {
      title: 'Verify Transcript Split',
      description: 'The AI has attempted to split the transcript into the Discovery phase and the Feedback phase. Please ensure Part 1 ends where the interviewer starts presenting their summary.',
      reasoning: 'AI Reasoning:',
      part1: 'Part 1: Discovery (Raw Statements)',
      part2: 'Part 2: Feedback (Corrections)',
      back: 'Back',
      cancel: 'Cancel / Re-upload',
      analyzing: 'Analyzing...',
      confirm: 'Confirm Split & Analyze',
      userProvidedReasoning: 'User-provided split'
    },
    part2: {
      title: 'Part 2 Results: Feedback & Comparison',
      description: "Comparing Baseline (Public Info) vs. Founder's Transcript Feedback.",
      back: 'Back',
      loadJson: 'Load JSON',
      downloadJson: 'Download JSON'
    },
    comparison: {
      groups: {
        solution: 'Solution',
        customer: 'Customer',
        context: 'Context',
        goal: 'Goal',
        barrier: 'Barrier'
      },
      types: {
        Modification: 'Modification',
        Omission: 'Omission',
        Hallucination: 'Hallucination',
        Confirmation: 'Confirmation'
      },
      labels: {
        llmGenerated: 'LLM-Generated',
        evidence: 'Evidence (Transcript)',
        noEvidence: 'No transcript evidence',
        omissionsHallucinations: 'Omissions & Hallucinations',
        captureSupport: 'Capture and check public support for this statement.',
        confirmSupport: 'Confirm & Check Public Support',
        checking: 'Checking…',
        omissions: 'Omissions',
        hallucinations: 'Hallucinations',
        add: '+ Add',
        awaiting: 'Awaiting check',
        supported: 'Supported',
        notFound: 'Not Found',
        placeholderOmission: 'Omission',
        placeholderHallucination: 'Hallucination',
        runConfirm: 'Run "Confirm" to see public support.',
        statusMessage: 'No omissions or hallucinations provided to check.',
        notAvailable: '—'
      },
      support: {
        publicSupportFailed: 'Public support check failed.',
        solutionEvidenceFallback: 'Solution evidence not provided (baseline only).'
      }
    },
    speakerModal: {
      title: 'Map speakers to names',
      description: 'If diarization labels exist, map them to real names/titles.',
      placeholder: 'e.g., Founder, Interviewer',
      sampleTitle: 'Sample transcript',
      sampleEmpty: 'No transcript preview available.',
      skip: 'Skip',
      apply: 'Apply labels'
    },
    consent: {
      title: 'Consent Form',
      subtitle: 'Please review the consent language below with the participant.',
      summary: {
        capture: 'Capture responses',
        record: 'Recording consent',
        international: 'Non-US based founder',
        dataConsent: 'Data consent (non-US)'
      },
      meta: {
        studyTitle: 'Study Title: Startup Problem Statements',
        researchers: 'Researchers: Jacqueline Lane, Shai Bernstein',
        version: 'Version Date: December 9, 2025'
      },
      sections: [
        {
          title: 'What is the purpose of this research?',
          paragraphs: [
            'This research aims to collect and analyze problem statements from startup ventures. Specifically, we are gathering structured information about customer segments, the contexts in which problems occur, customer goals, the barriers that prevent customers from achieving those goals, as well as the nature of the problem the venture addresses.'
          ]
        },
        {
          title: 'What can I expect if I take part in this research?',
          paragraphs: [
            'If you choose to participate, you will take part in a single, 25-30 minute conversation with a member of our research team. This conversation will take place remotely over Zoom at a time that is convenient for you. Your company name and website URL will be collected. While we will take measures to protect your data, there is a small risk that this information could be disclosed. De-identified insights from this interview, including the transcript, and public information about your company will be used in a secure Large Language Model (LLM) that do not use your data for training. If identifiers are removed from your identifiable private information that are collected during this research, that information could be used for future research studies or distributed to another investigator for future research studies without your additional informed consent.'
          ]
        },
        {
          title: 'What will happen during the interview',
          bullets: [
            'We will ask you a series of open-ended questions about your company and the customer problem your startup is trying to solve.',
            'These questions focus only on information about your company that is publicly available.',
            "We will also show you a short, AI-generated description of your startup's problem based on public information, and we will ask for your thoughts on how accurate it is.",
            'You may skip any questions that you prefer not to answer.'
          ]
        },
        {
          title: 'Timeline of procedures',
          bullets: [
            'At the start of the session: We will review the consent information, answer any questions you may have, and ask for your permission to record the conversation.',
            'During the session: We will conduct the interview and ask for your feedback on the AI-generated problem statement.',
            'After the session: There is no additional involvement required from you.'
          ]
        },
        {
          title: 'Length of participation',
          paragraphs: [
            "The entire session will take 25-30 minutes, and we will not contact you again after the interview unless you indicate that you wish to receive a summary of the study's findings in the future."
          ]
        },
        {
          title: 'Who you will interact with',
          paragraphs: ['You will speak with a trained member of the Harvard Business School research team.']
        },
        {
          title: 'Future contact',
          paragraphs: ['We will not contact you for future research unless you explicitly request to receive results from this study.']
        },
        {
          title: 'Use of your interview data',
          paragraphs: [
            'Your inputs will be analyzed using secure, enterprise-grade Large Language Model (LLM) tools to help identify patterns in the problems startups solve. Only de-identified text (with your name, your company name, and any other identifying details removed) will be used in these analyses. Your data will never be made public or shared outside the research team. All LLM analysis is performed using OpenAI Edu enterprise models, which operate within a secure, institution-approved environment. These models do not use your data for training, and they comply with Harvard University and Harvard Business School guidance on the responsible use of generative AI in research. Your inputs will help us with prompt optimization for our research, and we will never share these answers publicly.'
          ]
        },
        {
          title: 'Who can I talk to?',
          paragraphs: ['If you have questions, concerns, or complaints, or think the research has hurt you, talk to the research team at jnlane@hbs.edu.']
        }
      ],
      recording: {
        title: 'Recording Consent',
        description: 'With your permission, we would like to record the audio of this interview so that we can capture your responses accurately. If you do not wish to be recorded, the interviewer will take detailed notes instead.',
        checkbox: 'Checking this box indicates that you agree to be video and audio recorded during this interview.'
      },
      international: {
        label: 'Non-US based founder',
        addendumTitle: 'Addendum for data subject to non-U.S. data privacy laws',
        paragraphs: [
          'This Addendum concerns requirements for data which is subject to various non-U.S. privacy laws. If you are participating in this study in a country other than the United States ("your country"), your country may have a law with certain requirements for processing personal data relating to identified or identifiable individuals located in your country that applies to entities outside of your country, including entities in the U.S. This Addendum will refer to each of those laws as the "Law."',
          'Harvard researchers, led by PI: Jackie Lane and Shai Bernstein (the "study team") will collect information about you during the course of the study. This form calls such information your "Personal Information" and it will generally include your name, basic contact information, demographic information, and your responses to any tests, surveys or interviews described in this informed consent form.',
          'Harvard is the [co-]controller of your Personal Information collected for this study. By agreeing to this Addendum, you consent to the study team’s use and processing of your Personal Information for the purpose of this study. The study team, and those working with the study team, will process your Personal Information in compliance with applicable Law.',
          'If you withdraw your permission, you will no longer be able to participate in the study and no new information will be collected about you or from you by the study team. However, if you withdraw, the study team will retain the Personal Information collected prior to your withdrawal and may use it to guarantee the integrity of the study and for any other purpose permitted under the Law. Withdrawal will not affect the lawfulness of the data processing that occurred prior to your withdrawal.',
          'By agreeing below, you consent to the transfer of your Personal Information to countries other than your country, including the United States. The study team may process your Personal Information in countries other than your country. These countries may have established standards and practices for managing Personal Information that differ from those of your country. Regulators in your country may have determined that the data protection laws of the US and certain other countries do not protect Personal Information to the same extent as your country. Harvard, and those identified in this Addendum as working with Harvard, will take steps to maintain the confidentiality of your Personal Information.',
          'If your Personal Information is transferred from your country to other countries that have not yet been found by your local regulators to meet requirements for protection of Personal Information, the study team will utilize the appropriate standard contractual clauses to protect your Personal Information. A copy of these clauses is available by contacting EEAsubjectrequest@harvard.edu ]'
        ],
        bullets: [
          'Verify that the study is conducted correctly and that study data are accurate;',
          'Answer questions from Institutional Review Board(s) (IRB(s)), Independent Ethics Committee(s) (IEC(s)), or government or regulatory agencies;',
          'Contact you during and after the study (if necessary); and',
          'Answer your data protection requests (if any).'
        ],
        extraUse: 'The study team may also use your Personal Information to',
        extraBullets: [
          '[Publish summaries of the study results in academic journals, on the internet, or at educational meetings of other researchers. You will not be directly identified in any publication or report of the study. However, some journal representatives may need access to your Coded Information to verify the study results and ensure the research meets the journal’s quality standards. Also, journals may require that certain data from the study that does not directly identify you (i.e., de-identified survey responses) be made available to other researchers for further research projects.',
          'Improve the quality, design, and safety of this study and other research studies.',
          'Conduct additional studies with the data collected in this study to advance scientific research and public health. At this time, we do not know the specific details of these future research projects. If your Personal Information is used for additional studies, specific safeguards will be used to protect the data, which may include:',
          'Using only information from which your direct identifiers have been removed instead of information that readily identifies you.',
          'Limiting access to specific individuals who are obligated to keep the information confidential.',
          'Using security measures to avoid data loss and unauthorized access.',
          'Anonymizing the data by destroying the link between the information and your personal identifiers.',
          'When required by applicable law, ensuring that the scientific research has the approval of IECs, IRBs, or other similar review groups.]'
        ],
        retention: 'Your Personal Information will not be used for further research. Harvard will retain your Personal Information (including your "Coded Information", meaning your Personal Information that has been modified so that your identifiers, such as your name, email, personal attributes, or other identifiable responses, have been replaced by a number, letter, symbol, or combination thereof, to better secure the information) for the period necessary to fulfill the purposes described in this consent, unless a different retention period is required or permitted by law.',
        anonymize: 'The study team plans to anonymize your Personal Information no later than 1 day after completing your interview. Once your Personal Information has been anonymized, the information cannot be used to identify you personally, and such anonymized information may be used for further research. It also may not be possible for the study team to distinguish your anonymized information from that of other participants, as the identifying data will have been removed.]',
        rightsIntro: 'Under your country’s Law, you may have certain rights related to your Personal Information collected under this study. If you wish to exercise those rights, please contact EEAdatasubjectrequest@harvard.edu. Please note that under your country’s Law, you may also have the right to make a complaint to your country’s data protection authority, if you so choose.',
        gdpr: {
          intro: 'Under GDPR:',
          bullets: [
            'You have the right to see the information being collected about you in the study.',
            'You have the right to correct or update your Personal Information if it is inaccurate.',
            'You have the right to limit the collection and use of your Personal Information under certain circumstances (for example, if you think that the information is inaccurate).',
            'You have the right to receive your Personal Information in a structured, common computer format (for example, in a readable text electronic file or chart) for your own purposes or for giving it to others, as required by applicable data protection laws. You may not have the right to receive your Personal Information that has been used for public interest purposes or in the exercise of official authority vested in Harvard.',
            'You have the right to request the deletion of your Personal Information if you are no longer participating in the study. However, there are limits on your ability to request deletion of your Personal Information. Harvard may keep and use some or all of your Personal Information if deletion would seriously impair the study (for example, if deletion would affect the consistency of study results) or if your Personal Information is needed to comply with legal requirements.]'
          ],
          transfer: 'Your Personal Information needed for the research will be saved, analyzed and, if necessary, transferred from your country. The study team, and those working with the study team, may be based in countries other than your country, including the United States. Data protection and privacy laws in these countries may not offer the same level of protection as those in your country. Harvard, and those working with Harvard and your study team will take steps to maintain the confidentiality of your Personal Information.'
        },
        dataConsent: 'Your checking this box indicates that you have freely given your consent to the use of Personal Information as described in this Addendum.',
        dataConsentHint: 'Enable "Non-US based founder" to capture this consent when applicable.',
        done: 'Done'
      }
    },
    guide: {
      title: 'Interviewer Training Guidance',
      description: 'Verbatim content, grouped for quick scanning.',
      close: 'Close'
    }
  },
  zh: {
    common: {
      appTitle: '创始人问题分析',
      guide: '指南',
      beta: '测试版',
      loadJson: '导入 JSON',
      downloadJson: '下载 JSON',
      clearAll: '清空并重新开始',
      stepLabel: '步骤',
      back: '返回',
      continue: '继续',
      close: '关闭',
      confirm: '确认',
      cancel: '取消',
      add: '添加',
      yes: '是',
      no: '否',
      viewScript: '查看脚本',
      languageEn: 'English',
      languageZh: '中文'
    },
    steps: {
      publicInfo: '公开信息',
      founderInput: '创始人输入',
      baselineReview: '审核基线',
      transcriptUpload: '访谈后',
      part2Comparison: '反馈'
    },
    errors: {
      resetConfirm: '确定要清除所有数据并重新开始吗？',
      invalidUrl: '请输入有效的网址。',
      publicInfoRequired: '需要提供公开信息。',
      fetchPublicInfoFirst: '请先抓取公开信息。',
      founderInputMissing: '请至少填写解决方案和目标客户。',
      baselineRequired: '在分析访谈记录前需要基线陈述。',
      transcriptRequired: '需要访谈记录文本。',
      publicSupportInfoMissing: '在检查公开支持信息前需要公开信息。',
      noSupportItems: '没有可检查的遗漏或幻觉内容。',
      supportCheckFailed: '公开支持检查失败。',
      loadJsonFailed: '加载 JSON 失败：',
      comparisonFailed: '生成对比失败。'
    },
    statuses: {
      uploadingAudio: '正在上传音频',
      processingDiarization: '使用 ElevenLabs（说话人分离）处理...',
      transcriptionDone: '转写完成。请在分割前查看或修改。',
      transcriptionErrorPrefix: '转写错误：',
      processing: '处理中...',
      analyzingPublicInfo: '正在分析公开信息...',
      regenerateBaseline: '重新生成基线',
      generateBaseline: '生成基线 →'
    },
    publicInfo: {
      title: '1. 公开信息',
      pitchbookLabel: 'Pitchbook 信息',
      pitchbookPlaceholder: '如果有，请粘贴 Pitchbook 信息...',
      pitchbookHint: '生成基线时会将此信息与抓取的公开信息合并。',
      optionA: {
        title: '选项 A：从网址抓取',
        description: '我们会用 Google 搜索查找并总结该公司的公开信息，并尝试抓取主页 HTML。',
        placeholder: 'https://example.com',
        fetch: '抓取'
      },
      optionB: {
        title: '选项 B：上传文件',
        description: '直接上传 pitch deck 文本或网站文案。'
      },
      contentLabel: '公开信息内容',
      contentPlaceholder: '抓取或上传后内容会显示在此处...',
      buttons: {
        continue: '继续到创始人输入 →',
        analyze: '正在分析公开信息...',
        regenerate: '重新生成基线',
        generate: '生成基线 →'
      },
      preview: {
        title: 'LLM 生成的陈述（预览）',
        solution: '解决方案',
        customer: '客户',
        context: '情境',
        goals: '目标',
        barriers: '障碍',
        noBarriers: '暂无障碍。'
      }
    },
    founder: {
      title: '2. 创始人视角（请在电脑端录制 Zoom）',
      subtitle: '创始人认为问题是什么？',
      consent: '知情同意',
      labels: {
        introduction: '开场',
        solution: '解决方案',
        customer: '客户细分',
        context: '情境',
        goal: '目标',
        barriers: '障碍'
      },
      placeholders: {
        solution: '例如：为放射科医生提供的 AI 诊断工具',
        customer: '例如：高负荷创伤中心的放射科医生',
        context: '例如：在夜间人手不足时审阅 CT 影像',
        goal: '例如：快速且准确地识别关键骨折',
        barrier: '例如：疲劳导致遗漏骨折'
      },
      addBarrier: '+ 添加障碍',
      back: '返回',
      continue: '继续 →',
      scripts: {
        introduction: `概述：
“你好，[姓名]。感谢你今天参加。 我是[你的名字]，与哈佛商学院的 Bernstein 教授和 Lane 教授合作。我们在研究创始人如何定义其创业公司解决的核心问题。这次访谈仅用于研究，我们不会评估你的公司。你的回答会保密，仅会分享汇总结果。经你同意，我们希望录音以便准确记录。可以吗？”

如果同意，开始录音；如不同意，采访者需做详细笔记。

设定预期：
“我会问一系列开放式问题。没有正确或错误的答案，我们想了解你自己的看法。访谈大约 20 分钟。”

简要说明问题框架（按稿读）：
“正式开始前，先介绍下我们使用的结构。我们用一个简单框架来构建你公司的问题陈述，目的是从客户角度理解你们解决的问题。
我们将围绕五个要素展开：
1. 解决方案：你构建了什么。
2. 客户：你的目标客户是谁。
3. 客户的期望：客户想要达成什么。
4. 问题出现的情境：客户在何时、什么场景下遇到问题。
5. 障碍：在没有你们帮助的情况下，客户达成目标的阻碍是什么。
我们只关注你作为创始人的视角。但请基于公众对你创业公司的认知作答，而非尚未公开的内部信息。”`,
        solution: `主问题（逐字询问）：
“先从你们构建的产品开始。你会如何描述你的产品或解决方案？请基于公开信息进行描述。”

过渡语：“谢谢，这让我们有了背景。接下来了解你的客户是谁。”`,
        customer: `主问题（逐字询问）： “请介绍面临你要解决的问题的人或组织。他们是谁？”

追问（如需）：
- “能否用角色或场景而不是人口特征来描述？”
- “当前的核心客户是谁？未来想要覆盖的客户是谁？”
- “他们有哪些共性？”

过渡反问：“所以你认为核心客户是 ___ ，我总结得准确吗？（创始人确认或补充）然后我们进入下一部分。”`,
        context: `主问题（逐字询问）： “这个问题通常在什么时候发生？能否描述一个具体情境或时刻？”

追问：
- “是否有触发事件让问题变得紧急？”
- “能否分享一个最近的具体例子？”

过渡反问：“也就是说问题通常发生在 ___ ，我理解对吗？（创始人确认或补充）我们继续下一部分。”`,
        goal: `主问题（逐字询问）： “客户最终想实现什么？我指的是他们想要的进展或目标，而不是你产品的功能。请基于公开信息作答。”

重要提醒：让创始人基于公众对创业公司的理解作答。

追问：
- “如果没有你的产品，他们仍然会试图实现什么？”
- “从他们角度看，成功是什么样子？”

过渡反问：“听上去他们的期望是 ___ ，对吗？（创始人确认或补充）我们继续下一部分。”`,
        barriers: `主问题（逐字询问）： “如果没有你的解决方案，是什么阻碍了客户实现目标？具体障碍有哪些？”

追问：
- “这些障碍是功能、情绪、财务还是社交层面的？”
- “他们尝试过什么但没有成功？”

过渡反问：“你提到的主要障碍是 ___ ，这样完整吗？（创始人确认或补充）

第 1 部分到此结束。过渡语：
“很好，我们完成了第 1 部分的问题陈述。接下来进入第 2 部分。”`
      }
    },
    baselineReview: {
      title: '3. 审核 LLM 生成的陈述',
      description: '此陈述基于公开信息生成。在与访谈记录对比前请先查看并编辑。',
      draft: '草稿模式',
      labels: {
        solution: '解决方案',
        customer: '客户细分',
        context: '情境',
        goal: '目标/期望',
        barriers: '具体障碍'
      },
      addBarrier: '+ 添加障碍',
      back: '返回',
      confirm: '确认并上传访谈记录 →'
    },
    transcript: {
      title: '4. 访谈后（上传访谈记录）',
      description: '分成“探索”（第 1 部分）和“反馈”（第 2 部分）。粘贴文本或上传音频，我们会带说话人分离转写（大文件自动分段）。',
      uploadAudioTitle: '上传音频进行转写（含说话人分离）',
      uploadAudioHelp: '在此上传本地会议录音。',
      transcribing: '正在转写音频…',
      transcriptTitle: '上传访谈文本',
      transcriptHelp: '粘贴访谈记录或上传 .txt 导出文件。',
      transcriptNote: '音频转写会自动填入带说话人标签的文本。',
      transcriptLabel: '访谈文本',
      diarizedAdded: '已添加带说话人分离的转写',
      transcriptPlaceholder: '粘贴完整访谈记录，或上传音频自动填充并附带说话人标签...',
      back: '返回',
      split: '拆分访谈 →'
    },
    splitVerifier: {
      title: '确认访谈拆分',
      description: 'AI 已尝试将访谈拆分为「探索」和「反馈」阶段。请确保第 1 部分结束于采访者开始总结的地方。',
      reasoning: 'AI 推理：',
      part1: '第 1 部分：探索（原始陈述）',
      part2: '第 2 部分：反馈（修正）',
      back: '返回',
      cancel: '取消 / 重新上传',
      analyzing: '正在分析...',
      confirm: '确认拆分并分析',
      userProvidedReasoning: '用户提供的拆分'
    },
    part2: {
      title: '第 2 部分结果：反馈与对比',
      description: '对比基线（公开信息）与创始人访谈反馈。',
      back: '返回',
      loadJson: '导入 JSON',
      downloadJson: '下载 JSON'
    },
    comparison: {
      groups: {
        solution: '解决方案',
        customer: '客户',
        context: '情境',
        goal: '目标',
        barrier: '障碍'
      },
      types: {
        Modification: '修改',
        Omission: '遗漏',
        Hallucination: '幻觉',
        Confirmation: '确认'
      },
      labels: {
        llmGenerated: 'LLM 生成',
        evidence: '证据（访谈记录）',
        noEvidence: '没有访谈证据',
        omissionsHallucinations: '遗漏与幻觉',
        captureSupport: '记录并检查该陈述的公开支持。',
        confirmSupport: '确认并检查公开支持',
        checking: '检查中…',
        omissions: '遗漏',
        hallucinations: '幻觉',
        add: '+ 添加',
        awaiting: '等待检查',
        supported: '有公开支持',
        notFound: '未找到公开支持',
        placeholderOmission: '遗漏',
        placeholderHallucination: '幻觉',
        runConfirm: '点击“确认”以查看公开支持。',
        statusMessage: '未提供遗漏或幻觉条目可供检查。',
        notAvailable: '—'
      },
      support: {
        publicSupportFailed: '公开支持检查失败。',
        solutionEvidenceFallback: '未提供解决方案证据（仅来自基线）。'
      }
    },
    speakerModal: {
      title: '将说话人标签映射为姓名',
      description: '如果有分离标签，请将其映射为真实姓名或角色。',
      placeholder: '例如：创始人、采访者',
      sampleTitle: '访谈示例',
      sampleEmpty: '暂无访谈预览。',
      skip: '跳过',
      apply: '应用标签'
    },
    consent: {
      title: '知情同意',
      subtitle: '请与受访者一起阅读以下同意内容。',
      summary: {
        capture: '记录答复',
        record: '录音同意',
        international: '非美国创始人',
        dataConsent: '数据同意（非美国）'
      },
      meta: {
        studyTitle: '研究标题：创业公司问题陈述',
        researchers: '研究者：Jacqueline Lane, Shai Bernstein',
        version: '版本日期：2025 年 12 月 9 日'
      },
      sections: [
        {
          title: '研究目的',
          paragraphs: [
            '本研究旨在收集和分析创业公司的问题陈述，重点是客户细分、问题出现的情境、客户目标、阻碍客户达成目标的障碍，以及创业公司解决的问题本身。'
          ]
        },
        {
          title: '参与内容',
          paragraphs: [
            '如果你同意参加，将与研究团队进行一次 25-30 分钟的远程 Zoom 访谈。我们会记录公司名称和网址。尽管我们会保护你的数据，仍存在小概率泄露风险。经去标识化的访谈见解（含转录）以及公开公司信息会用于安全的 LLM 环境（不使用数据训练）。如果去除了个人标识，这些信息可能用于未来研究或分享给其他研究者，无需额外同意。'
          ]
        },
        {
          title: '访谈流程',
          bullets: [
            '我们会询问与你公司及客户问题相关的开放式问题。',
            '问题仅聚焦公开可获取的信息。',
            '我们会展示基于公开信息生成的简短 AI 描述，并征求你对准确性的看法。',
            '任何问题你都可以跳过。'
          ]
        },
        {
          title: '时间安排',
          bullets: [
            '开始：回顾同意信息、回答疑问，并征求录音许可。',
            '进行中：开展访谈并收集你对 AI 生成问题陈述的反馈。',
            '结束后：无额外参与要求。'
          ]
        },
        {
          title: '访谈时长',
          paragraphs: [
            '整个访谈需约 25-30 分钟，除非你要求获取研究结果，否则我们不会再次联系你。'
          ]
        },
        {
          title: '与你互动的人员',
          paragraphs: ['你将与哈佛商学院研究团队的成员交流。']
        },
        {
          title: '未来联系',
          paragraphs: ['除非你明确要求获取研究结果，否则我们不会因未来研究联系你。']
        },
        {
          title: '访谈数据的使用',
          paragraphs: [
            '你的输入将通过安全的企业级 LLM 工具分析，用于识别创业公司解决的问题模式。仅使用去标识的文本（去除姓名、公司名等）。数据不会公开或外传。所有 LLM 分析在经批准的 OpenAI Edu 企业模型上进行，不用你的数据训练，并符合哈佛大学与哈佛商学院对生成式 AI 的规范。你的回答将帮助我们优化提示，不会公开分享。'
          ]
        },
        {
          title: '联系方式',
          paragraphs: [
            '如有问题、疑虑或不适，请联系研究团队：jnlane@hbs.edu。'
          ]
        }
      ],
      recording: {
        title: '录音同意',
        description: '经你许可，我们希望录制本次访谈音频以准确记录。如不同意，采访者将做详细笔记。',
        checkbox: '勾选表示同意在访谈中进行视频和音频录制。'
      },
      international: {
        label: '非美国创始人',
        addendumTitle: '适用于受非美国数据隐私法约束的数据附录',
        paragraphs: [
          '本附录适用于受各类非美国隐私法约束的数据。如果你在美国以外参加，本地法律可能对处理个人数据有要求，也适用于美国等境外机构。',
          '研究团队（负责人：Jackie Lane、Shai Bernstein）将在研究过程中收集你的信息（称为“个人信息”），包括姓名、基本联系方式、人口统计信息以及本同意书描述的测试、问卷或访谈回答。',
          '哈佛是收集你个人信息的共同控制者。勾选同意即表示你同意研究团队为本研究使用和处理你的个人信息，研究团队及合作方将遵守适用法律处理信息。',
          '若你撤回许可，将无法继续参与，研究团队也不会再收集新的信息。但会保留撤回前已收集的信息，用于保证研究完整性或法律允许的用途。撤回不会影响撤回前处理的合法性。',
          '勾选同意即表示你同意将个人信息转移到美国等其他国家。研究团队可能在你的国家以外处理信息，这些国家的隐私保护水平可能不同。哈佛及合作方将采取措施保护信息的机密性。',
          '若个人信息被转移到未被认定为等效保护的国家，研究团队将采用适当的标准合同条款保护信息。可联系 EEAsubjectrequest@harvard.edu 获取副本。'
        ],
        bullets: [
          '核查研究是否正确开展、数据是否准确；',
          '回应 IRB/IEC 或监管机构的询问；',
          '在研究期间（如有必要）联系你；',
          '回应你的数据保护请求（如有）。'
        ],
        extraUse: '研究团队也可能将你的个人信息用于：',
        extraBullets: [
          '在学术期刊、互联网或学术会议上发布研究摘要（不会直接标识你的身份，但期刊可能需要访问编码信息以验证结果，或要求共享去标识数据供其他研究者使用）；',
          '改进本研究和其他研究的质量、设计与安全性；',
          '利用本研究收集的数据开展更多研究，以推动科学研究和公共健康。届时会采用保护措施，如仅使用去标识信息、限制访问、使用安全措施避免数据泄露、在需要时确保研究获得伦理审查批准等。'
        ],
        retention: '研究团队不会将你的个人信息用于进一步研究。哈佛会在实现本同意书所述目的所需期间保留信息，除非法律要求更长或更短的期限。',
        anonymize: '研究团队计划在访谈完成后 1 天内完成匿名化。一旦匿名化，数据将无法用于识别你，且可能与其他参与者数据混合，无法再区分。',
        rightsIntro: '根据你所在国家/地区的法律，你可能享有以下权利。若需行使，请联系 EEAdatasubjectrequest@harvard.edu；你也可以向当地监管机构投诉。',
        gdpr: {
          intro: '在 GDPR 下，你可能拥有：',
          bullets: [
            '查阅研究中收集到的个人信息；',
            '在信息不准确时进行更正或更新；',
            '在特定情况下限制收集和使用（例如你认为信息不准确）；',
            '以常见格式接收个人信息供个人或提供给他人（某些出于公共利益或法定职责的用途可能不适用）；',
            '在退出研究后请求删除个人信息（但若删除会严重影响研究或法律要求保留，哈佛可能继续保留并使用部分或全部信息）。'
          ],
          transfer: '为开展研究所需，你的个人信息可能被保存、分析并在你的国家之外传输。研究团队及合作方可能位于其他国家（包括美国），当地数据保护法律可能不同。哈佛及合作方会采取措施维护信息的机密性。'
        },
        dataConsent: '勾选表示你自愿同意按照本附录描述使用个人信息。',
        dataConsentHint: '如适用，请先开启“非美国创始人”再记录该同意。',
        done: '完成'
      }
    },
    guide: {
      title: '采访员培训指南',
      description: '逐字稿内容，便于快速浏览。',
      close: '关闭'
    }
  }
} as const;

export type LocaleKey = keyof typeof translations;
export type Translation = (typeof translations)[LocaleKey];
export const TranslationContext = React.createContext<Translation>(translations.zh);
export const useT = () => React.useContext(TranslationContext);
export const getTranslation = (locale: LocaleKey): Translation => translations[locale] || translations.zh;
