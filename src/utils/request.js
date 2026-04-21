export const APP_API = `${import.meta.env.VITE_API_URL || 'https://api.app.yxbug.cn'}/api`;

/**
 * 统一请求选项。
 * - 字符串参数继续兼容旧的 host 传法；
 * - 对象参数用于扩展 header、原始响应和完整 URL。
 */
const normalizeRequestOptions = (hostOrOptions) => {
  if (typeof hostOrOptions === 'string' || typeof hostOrOptions === 'undefined') {
    return {
      host: hostOrOptions,
      header: {},
      unwrapData: true,
      showErrorToast: true,
      url: '',
    };
  }

  return {
    host: hostOrOptions.host || '',
    header: hostOrOptions.header || {},
    unwrapData: hostOrOptions.unwrapData !== false,
    showErrorToast: hostOrOptions.showErrorToast !== false,
    url: hostOrOptions.url || '',
  };
};

const buildRequestUrl = (url, options) => options.url || `${options.host || ''}${url}`;
const isSuccessStatus = (statusCode) => String(statusCode).startsWith('2');

const getResponsePayload = (response, unwrapData) => {
  const result = response.data;
  return unwrapData ? result?.data : result;
};

const getErrorMessage = (result) => result?.msg || '网络请求异常!';

const requestByOptions = (url, method, param, hostOrOptions) => {
  const options = normalizeRequestOptions(hostOrOptions);

  return uni
    .request({
      url: buildRequestUrl(url, options),
      data: param,
      method,
      header: options.header,
    })
    .then((response) => {
      if (isSuccessStatus(response.statusCode)) {
        return getResponsePayload(response, options.unwrapData);
      }

      const result = response.data;
      if (options.showErrorToast) {
        uni.$u.toast(getErrorMessage(result));
      }

      return Promise.reject(result);
    })
    .catch((error) => Promise.reject(error));
};

export const Request = (url, method, param, hostOrOptions) => {
  return requestByOptions(url, method, param, hostOrOptions);
};

export const Post = (url, param, hostOrOptions) => {
  return Request(url, 'POST', param, hostOrOptions);
};

export const Get = (url, param, hostOrOptions) => {
  return Request(url, 'GET', param, hostOrOptions);
};

export const RawRequest = (url, method, param, options = {}) => {
  return Request(url, method, param, {
    ...options,
    unwrapData: false,
  });
};

export const RawPost = (url, param, options = {}) => {
  return RawRequest(url, 'POST', param, options);
};

export const RawGet = (url, param, options = {}) => {
  return RawRequest(url, 'GET', param, options);
};

export const RequestByUrl = (url, method, param, options = {}) => {
  return Request('', method, param, {
    ...options,
    url,
  });
};

export const RawPostByUrl = (url, param, options = {}) => {
  return RequestByUrl(url, 'POST', param, {
    ...options,
    unwrapData: false,
  });
};

export const RawGetByUrl = (url, param, options = {}) => {
  return RequestByUrl(url, 'GET', param, {
    ...options,
    unwrapData: false,
  });
};

export const PostByUrl = (url, param, options = {}) => {
  return RequestByUrl(url, 'POST', param, options);
};

export const GetByUrl = (url, param, options = {}) => {
  return RequestByUrl(url, 'GET', param, options);
};

export const GetByFullUrl = GetByUrl;
export const PostByFullUrl = PostByUrl;
export const RawPostByFullUrl = RawPostByUrl;
export const RawGetByFullUrl = RawGetByUrl;

export default Request;
