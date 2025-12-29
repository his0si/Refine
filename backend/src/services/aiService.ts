import OpenAI from 'openai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Ollama 서버 URL (Docker Compose에서 실행됨)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama:11434';

export interface RefineOptions {
  originalText: string;
  context?: string;
  userApiKey?: string; // 사용자가 제공한 OpenAI API 키 (선택)
}

export interface RefineResult {
  refinedText: string;
  suggestions: string[];
  provider: 'ollama' | 'openai'; // 어떤 AI를 사용했는지 표시
}

/**
 * AI를 사용하여 텍스트를 공적인 상황에 맞게 다듬습니다.
 * 기본: Ollama 사용
 * 사용자가 OpenAI API 키를 제공하면: OpenAI 사용
 */
export async function refineText(options: RefineOptions): Promise<RefineResult> {
  const { originalText, context = '일반적인 공적 상황', userApiKey } = options;

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

  // 사용자가 OpenAI API 키를 제공했으면 OpenAI 사용, 아니면 Ollama 사용
  if (userApiKey && userApiKey.trim().length > 0) {
    return await refineWithOpenAI(systemPrompt, userPrompt, originalText, userApiKey);
  } else {
    return await refineWithOllama(systemPrompt, userPrompt, originalText);
  }
}

/**
 * OpenAI를 사용하여 텍스트 다듬기
 */
async function refineWithOpenAI(
  systemPrompt: string,
  userPrompt: string,
  originalText: string,
  apiKey: string
): Promise<RefineResult> {
  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 더 저렴한 모델 사용
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
      provider: 'openai',
    };
  } catch (error: any) {
    console.error('OpenAI 텍스트 리파인 실패:', error);

    // API 키 오류인 경우 구체적인 메시지 제공
    if (error.status === 401) {
      throw new Error('OpenAI API 키가 유효하지 않습니다. 설정에서 API 키를 확인해주세요.');
    }

    throw new Error('OpenAI로 텍스트 다듬기에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}

/**
 * Ollama를 사용하여 텍스트 다듬기 (기본값)
 */
async function refineWithOllama(
  systemPrompt: string,
  userPrompt: string,
  originalText: string
): Promise<RefineResult> {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: 'llama3.2:3b', // 한국어 지원이 좋은 모델
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500,
        },
      },
      {
        timeout: 60000, // 60초 타임아웃
      }
    );

    const responseText = response.data.message?.content || '';

    // 응답을 파싱하여 제안사항 추출
    const suggestions = responseText
      .split('\n')
      .filter((line: string) => line.trim().match(/^\d+[\.\)]/))
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, '').trim())
      .filter((line: string) => line.length > 0);

    // 제안이 없으면 전체 응답을 사용
    const refinedText = suggestions.length > 0 ? suggestions[0] : responseText.trim() || originalText;

    return {
      refinedText,
      suggestions: suggestions.length > 0 ? suggestions : [refinedText],
      provider: 'ollama',
    };
  } catch (error: any) {
    console.error('Ollama 텍스트 리파인 실패:', error);

    // Ollama 서버 연결 실패
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error(
        'Ollama 서버에 연결할 수 없습니다. 서버 관리자에게 문의하거나 OpenAI API 키를 설정해서 사용해주세요.'
      );
    }

    throw new Error('텍스트 다듬기에 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}
