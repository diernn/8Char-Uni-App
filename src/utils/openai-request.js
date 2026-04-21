import { RawPostByUrl } from '@/utils/request';

/**
 * OpenAI 兼容请求统一走 JSON 请求头，并允许业务层继续附加额外 header。
 * 这里单独拆文件，避免通用 request 层继续混入特定协议适配逻辑。
 */
export const OpenAIRequest = (url, param, options = {}) => {
  return RawPostByUrl(url, param, {
    ...options,
    header: {
      'Content-Type': 'application/json',
      ...(options.header || {}),
    },
  });
};

/**
 * 组装 Bearer Token 鉴权头，维持现有 OpenAI chat/completions 调用方式兼容。
 */
export const OpenAIChatCompletion = (url, param, apiKey, options = {}) => {
  return OpenAIRequest(url, param, {
    ...options,
    header: {
      Authorization: `Bearer ${apiKey}`,
      ...(options.header || {}),
    },
  });
};

export const OpenAIChatByUrl = OpenAIChatCompletion;

export default OpenAIRequest;
