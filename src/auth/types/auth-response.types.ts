export interface BaseAuthResponse {
  message: string;
}

export interface AuthWithTokenResponse extends BaseAuthResponse {
  data: {
    accessToken: string;
  };
}