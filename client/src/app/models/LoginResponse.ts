export interface LoginResponse {
  data: {
    access_token: string;
    expiresIn: number;
    current_user: any;
  };
}
