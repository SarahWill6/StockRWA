export interface Stock {
  name: string;
  symbol: string;
  price: string;
  tokenAddress: string;
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  encryptedBalance: string;
}