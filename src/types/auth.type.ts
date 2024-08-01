export type AccessTokenData = {
  email: string;
  displayName: string;
  iat: number;
  exp: number;
  token: string;
};

export type UserData = {
  // TODO: get type from pgEnum roleEnum
  userId: string;
  emailVerified: boolean;
  role: 'user' | 'clerk' | 'manager' | 'admin';
};

export type User = {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: 'user' | 'clerk' | 'manager' | 'admin';
  sessionId: string;
  accessToken: string;
  refreshToken: string;
};
