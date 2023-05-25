import { AxiosRequestConfig } from 'axios';

export const axiosConfig = () =>
  ({
    baseURL: process.env.API_BASE_URL,
    params: {
      api_token: process.env.API_TOKEN,
    },
  } as AxiosRequestConfig);
