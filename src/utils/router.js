const { route } = uni.$u;

export const toHome = () => {
    route({
        type: 'redirect',
        url: '/pages/home/home'
    });
}

export const toDetail = () => {
    route({
        type: 'redirect',
        url: '/pages/detail/index'
    });
}

export const toAI = () => {
    route({
        type: 'navigateTo',
        url: '/pages/ai/index'
    });
}

export const toHomeWithTime = params => {
    route({
        type: 'redirect',
        url: `/pages/home/home?time=${params.time}&gender=${params.gender}`
    });
}

export const toAIWithTime = params => {
    route({
        type: 'navigateTo',
        url: `/pages/ai/index?time=${params.time}&gender=${params.gender}`
    });
}

export const back = () => {
    uni.navigateBack()
}

export const redirectTo = url => {
    route({
        type: 'redirect',
        url,
    });
}

export const navigateTo = url => {
    route({
        type: 'navigateTo',
        url,
    });
}

export const replaceTo = redirectTo

export default {
    toHome,
    toDetail,
    toAI,
    toHomeWithTime,
    toAIWithTime,
    back,
    redirectTo,
    navigateTo,
    replaceTo,
}

export { route }
