import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RefineOptions {
  originalText: string;
  context?: string;
}

export interface RefineResult {
  refinedText: string;
  suggestions: string[];
}

/**
 * AI를 사용하여 텍스트를 공적인 상황에 맞게 다듬습니다.
 */
export async function refineText(options: RefineOptions): Promise<RefineResult> {
  const { originalText, context = '일반적인 공적 상황' } = options;

  const systemPrompt = `당신은 한국어 공적 글쓰기 전문가입니다. 사용자가 입력한 문장을 더 정중하고 전문적이며 격식 있는 표현으로 다듬어 주세요.

목표:
1. 공적인 상황(이메일, 공문, 비즈니스)에 적합한 표현 사용
2. 존댓말과 경어를 적절히 사용
3. 간결하면서도 정중한 표현
4. 진심과 전문성이 느껴지는 문장

응답 형식:
- 다듬어진 문장을 3가지 버전으로 제공해주세요
- 각 버전은 뉘앙스가 조금씩 다르지만 모두 격식 있는 표현이어야 합니다`;

  const userPrompt = `상황: ${context}
원본 문장: "${originalText}"

위 문장을 공적인 상황에 맞게 3가지 버전으로 다듬어 주세요. 각 버전은 한 줄로 작성하고, 번호를 붙여주세요.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || '';

    // 응답을 파싱하여 제안사항 추출
    const suggestions = responseText
      .split('\n')
      .filter(line => line.trim().match(/^\d+[\.\)]/))
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter(line => line.length > 0);

    // 첫 번째 제안을 기본 refined text로 사용
    const refinedText = suggestions[0] || originalText;

    return {
      refinedText,
      suggestions,
    };
  } catch (error) {
    console.error('AI 텍스트 리파인 실패:', error);
    throw new Error('텍스트 다듬기에 실패했습니다. 나중에 다시 시도해주세요.');
  }
}
