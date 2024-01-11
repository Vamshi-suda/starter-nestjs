export interface IOtpVerifyResponse {
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}

export interface IMfaStatus extends IOtpVerifyResponse {
  didUserOptMail: boolean;
  didUserOptMobile: boolean;
  isFlowCompleted: boolean;
  isExpired: boolean;
  expiryDateTime: Date;
}

export interface IGenerateOtpResponse {
  emailOtp: string;
  mobileOtp: string;
  mfaId: string;
}
