export type RegisterInput = {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterArgs = {
  input: RegisterInput;
};

export type LoginArgs = {
  input: LoginInput;
};
