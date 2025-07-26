import useSWR from 'swr';
import api from './axios';

export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export const useSWRHook = (url: string) => useSWR(url, fetcher);
