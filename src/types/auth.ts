export interface ResetToken {
  userId: number;
  email: string;
  expiry: Date;
}

export interface ResetTokensGlobal {
  resetTokens: Map<string, ResetToken>;
}

// Extend global interface
declare global {
  var resetTokens: Map<string, ResetToken> | undefined;
}