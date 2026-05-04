type ExplorerKey = string;

const EXPLORERS: Record<ExplorerKey, (hash: string) => string> = {
  BTC: (h) => `https://www.blockchain.com/btc/tx/${h}`,
  ETH: (h) => `https://etherscan.io/tx/${h}`,
  "USDT:ETH": (h) => `https://etherscan.io/tx/${h}`,
  "USDT:TRX": (h) => `https://tronscan.org/#/transaction/${h}`,
  "USDT:SOL": (h) => `https://solscan.io/tx/${h}`,
  SOL: (h) => `https://solscan.io/tx/${h}`,
  XRP: (h) => `https://xrpscan.com/tx/${h}`,
  XLM: (h) => `https://stellar.expert/explorer/public/tx/${h}`,
  ADA: (h) => `https://cardanoscan.io/transaction/${h}`,
  HBAR: (h) => `https://hashscan.io/mainnet/transaction/${h}`,
  TRX: (h) => `https://tronscan.org/#/transaction/${h}`,
  DOGE: (h) => `https://blockchair.com/dogecoin/transaction/${h}`,
};

export function getExplorerUrl(
  asset: string,
  txHash: string,
  network?: string | null,
): string | null {
  const a = asset.trim().toUpperCase();
  const n = network?.trim().toUpperCase();
  const hash = txHash.trim();
  if (!a || !hash) return null;

  if (n) {
    const keyed = EXPLORERS[`${a}:${n}`];
    if (keyed) return keyed(hash);
  }
  const fallback = EXPLORERS[a];
  return fallback ? fallback(hash) : null;
}
