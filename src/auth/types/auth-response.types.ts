import type { ServiceDataResponse } from 'src/common/types/service-response.types';

type AuthToken = { accessToken: string };

export interface AuthWithTokenResponse extends ServiceDataResponse<AuthToken> {}