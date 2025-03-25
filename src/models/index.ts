export enum ExchangeSites {
  BINANCE = "Binance",
  BYBIT = "Bybit",
  OKX = "OKX"
}

export interface Instrument {
  symbol: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  change: number;
}

export interface ExchangeTimeData {
  localTime: Date | string;
  serverTime: Date | string;
}