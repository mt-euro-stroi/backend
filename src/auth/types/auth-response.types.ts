import type {
  ServiceDataResponse,
  ServiceMessageResponse,
} from 'src/common/types/service-response.types';

export interface BaseAuthResponse extends ServiceMessageResponse {}

export interface AuthWithTokenResponse extends ServiceDataResponse<{
  accessToken: string;
}> {}
