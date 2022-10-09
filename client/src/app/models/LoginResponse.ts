export interface LoginResponse {
  data: {
    access_token: string;
    expiresIn: string;
    current_user: any;
  };
}
