export enum LoginAttempt {
  SUCCESS = 'Success',
  FAILURE = 'Failure',
}
export enum PreAuthDetails {
  SUCCESS = '',
  INCORRECT_PASSWORD = 'Incorrect Password',
  MFA_EXPIRED = '2FA code expired',
  DIFFERENT_USER_NAME = 'Different Username',
}
