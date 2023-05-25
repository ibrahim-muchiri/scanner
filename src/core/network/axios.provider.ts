import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export const AXIOS_TOKEN = 'AXIOS';

export const AxiosProvider: Provider<AxiosInstance> = {
  provide: AXIOS_TOKEN,
  useFactory: (config: ConfigService) => {
    const axiosConfig = {
      baseURL: config.get('API_BASE_URL'),
      params: {
        api_token: config.get('API_TOKEN'),
      },
    };
    const instance = axios.create(axiosConfig);
    Logger.log('Axios instance created. Waiting for work...', 'Config');
    return instance;
  },
  inject: [ConfigService],
};
