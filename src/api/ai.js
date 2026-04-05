import { LLM_API_URL, LLM_MODEL } from '@/config';
import { OpenAIChatByUrl } from '@/utils/request';

const getApiKey = () => import.meta.env.VITE_LLM_API_KEY || '';

const joinUrl = (baseUrl, path) => {
    if (!baseUrl) return '';
    return `${baseUrl.replace(/\/$/, '')}${path}`;
};

const buildMessages = payload => {
    const { profile, chart, instruction } = payload;
    return [
        {
            role: 'system',
            content: '你是一个命理学大师，请基于用户提供的结构化排盘数据给出专业、具体、可执行的中文分析。'
        },
        {
            role: 'user',
            content: [
                instruction,
                '',
                '【用户信息】',
                JSON.stringify(profile, null, 2),
                '',
                '【排盘数据】',
                JSON.stringify(chart, null, 2)
            ].join('\n')
        }
    ];
};

export const getAIConfig = () => {
    return {
        apiUrl: LLM_API_URL,
        apiKey: getApiKey(),
        model: LLM_MODEL,
    };
};

export const validateAIConfig = () => {
    const { apiUrl, apiKey, model } = getAIConfig();
    if (!apiUrl) throw new Error('LLM_API_URL_MISSING');
    if (!apiKey) throw new Error('LLM_API_KEY_MISSING');
    if (!model) throw new Error('LLM_MODEL_MISSING');
};

export const GetAIInterpretation = async payload => {
    validateAIConfig();
    const { apiUrl, apiKey, model } = getAIConfig();
    const url = joinUrl(apiUrl, '/chat/completions');
    const response = await OpenAIChatByUrl(url, {
        model,
        messages: buildMessages(payload),
        temperature: 0.7,
        stream: false,
    }, apiKey, {
        showErrorToast: false,
    });

    const content = response?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error('LLM_RESPONSE_EMPTY');
    }

    return {
        raw: response,
        content,
    };
};
