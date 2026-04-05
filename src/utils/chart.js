import { GetBook, GetInfo } from '@/api/default';
import { useBookStore } from '@/store/book';
import { useDetailStore } from '@/store/detail';
import { useTendStore } from '@/store/tend';
import { setLocalStorage } from '@/utils/cache';

export const CHART_PREPARE_ERROR = {
    GET_INFO: 'GET_INFO_FAILED',
    GET_BOOK: 'GET_BOOK_FAILED'
};

export const normalizeChartPayload = payload => {
    const realname = uni.$u.test.isEmpty(payload.realname) ? '不知名网友' : payload.realname;
    return {
        realname,
        timestamp: payload.timestamp,
        gender: payload.gender,
        sect: payload.sect ?? 1,
    };
};

export const prepareChart = async payload => {
    const detailStore = useDetailStore();
    const bookStore = useBookStore();
    const tendStore = useTendStore();
    const nextPayload = normalizeChartPayload(payload);

    detailStore.set(nextPayload);
    setLocalStorage('info', JSON.stringify(nextPayload));

    try {
        const info = await GetInfo(detailStore.defaultPayload);
        detailStore.set(info);
    } catch (error) {
        throw new Error(CHART_PREPARE_ERROR.GET_INFO);
    }

    try {
        const book = await GetBook(detailStore.defaultPayload);
        bookStore.set(book);
    } catch (error) {
        throw new Error(CHART_PREPARE_ERROR.GET_BOOK);
    }

    tendStore.pull(nextPayload);
    return nextPayload;
};
