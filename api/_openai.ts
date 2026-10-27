import OpenAI from 'openai';

export const MODEL_ID = 'gpt-4o';
export const COMPONENT_LAYER_MODEL_ID = 'gpt-5.2';

export type LocaleOption = 'en' | 'zh';
export type JsonSchema = Record<string, any>;

export const getOpenAI = () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const languageMessages = (locale: LocaleOption) =>
  locale === 'zh'
    ? [{
        role: 'system' as const,
        content:
          '请用简体中文回答所有输出。使用符合中文习惯的短句，避免直译腔与堆砌定语。确保每条表述简洁流畅、自然可读。请使用自然、地道、符合母语者习惯的现代中文表达，句式以常见主谓结构为主，避免英文直译的长定语和悬空状语。风格偏书面但简洁；如为列表，保持语法结构一致、用词统一。'
      }]
    : [{ role: 'system' as const, content: 'Respond in English.' }];

export const languageHint = (locale: LocaleOption) =>
  locale === 'zh'
    ? '\n\n请将所有输出内容（含要点、摘要和示例）用简体中文撰写，保持自然、地道、简洁。使用主谓结构，避免直译腔和长定语，可拆成短句。列表请统一语法和用词。'
    : '\n\nPlease respond in English.';

const extractText = (content: any): string => {
  if (!content) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content))
    return content.map((p) => (typeof p === 'string' ? p : (p?.text ?? ''))).join('');
  if (typeof content === 'object' && 'text' in content) return (content as any).text;
  return '';
};

export const callJsonSchemaWithModel = async <T>(
  openai: OpenAI,
  modelId: string,
  messages: { role: 'system' | 'user'; content: string }[],
  schemaName: string,
  schema: JsonSchema,
  temperature = 0.2
): Promise<T> => {
  const response = await openai.chat.completions.create({
    model: modelId,
    messages,
    temperature,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        schema: { ...schema, additionalProperties: false },
        strict: true
      }
    }
  });
  const text = extractText(response.choices[0]?.message?.content);
  if (!text) throw new Error('No response from model');
  return JSON.parse(text) as T;
};

export const callJsonSchema = async <T>(
  openai: OpenAI,
  messages: { role: 'system' | 'user'; content: string }[],
  schemaName: string,
  schema: JsonSchema,
  temperature = 0.2
): Promise<T> =>
  callJsonSchemaWithModel<T>(openai, MODEL_ID, messages, schemaName, schema, temperature);
