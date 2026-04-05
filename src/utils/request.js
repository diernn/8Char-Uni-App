export const APP_API = (import.meta.env.VITE_API_URL || "https://api.app.yxbug.cn") + "/api"

const normalizeRequestOptions = (hostOrOptions) => {
	if (typeof hostOrOptions === 'string' || typeof hostOrOptions === 'undefined') {
		return {
			host: hostOrOptions,
			header: {},
			unwrapData: true,
			showErrorToast: true,
		};
	}

	return {
		host: hostOrOptions.host,
		header: hostOrOptions.header || {},
		unwrapData: hostOrOptions.unwrapData !== false,
		showErrorToast: hostOrOptions.showErrorToast !== false,
		url: hostOrOptions.url,
	};
};

export const Post = (url, param, hostOrOptions) => {
	return Request(url, "POST", param, hostOrOptions)
}

export const Get = (url, param, hostOrOptions) => {
	return Request(url, "GET", param, hostOrOptions)
}

export const Request = (url, method, param, hostOrOptions) => {
	const options = normalizeRequestOptions(hostOrOptions);
	return new Promise(async (cback, reject) => {
		uni.request({
			url: options.url || `${options.host || ''}${url}`,
			data: param,
			method: method,
			header: options.header,
		}).then(async response => {
			const status = response.statusCode.toString();
			const result = response.data

			if (status.charAt(0) === '2') {
				cback(options.unwrapData ? result.data : result);
			} else {
				const msg = result.msg ? result.msg : '网络请求异常!'
				if (options.showErrorToast) {
					uni.$u.toast(msg)
				}
				reject(result)
			}
		}).catch(err => {
			reject(err)
		})
	})
}

export const RawRequest = (url, method, param, options = {}) => {
	return Request(url, method, param, {
		...options,
		unwrapData: false,
	});
}

export const RawPost = (url, param, options = {}) => {
	return RawRequest(url, "POST", param, options)
}

export const RawGet = (url, param, options = {}) => {
	return RawRequest(url, "GET", param, options)
}

export const RequestByUrl = (url, method, param, options = {}) => {
	return Request('', method, param, {
		...options,
		url,
	});
}

export const RawPostByUrl = (url, param, options = {}) => {
	return RequestByUrl(url, "POST", param, {
		...options,
		unwrapData: false,
	});
}

export const RawGetByUrl = (url, param, options = {}) => {
	return RequestByUrl(url, "GET", param, {
		...options,
		unwrapData: false,
	});
}

export const PostByUrl = (url, param, options = {}) => {
	return RequestByUrl(url, "POST", param, options)
}

export const GetByUrl = (url, param, options = {}) => {
	return RequestByUrl(url, "GET", param, options)
}

export const OpenAIRequest = (url, param, options = {}) => {
	return RawPostByUrl(url, param, {
		...options,
		header: {
			'Content-Type': 'application/json',
			...(options.header || {}),
		},
	});
}

export const OpenAIChatCompletion = (url, param, apiKey, options = {}) => {
	return OpenAIRequest(url, param, {
		...options,
		header: {
			Authorization: `Bearer ${apiKey}`,
			...(options.header || {}),
		},
	});
}

export const GetByFullUrl = GetByUrl
export const PostByFullUrl = PostByUrl
export const RawPostByFullUrl = RawPostByUrl
export const RawGetByFullUrl = RawGetByUrl
export const OpenAIChatByUrl = OpenAIChatCompletion

export default Request
