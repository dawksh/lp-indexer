type UniswapPoolToken = {
  symbol: string
}

type UniswapPool = {
  id: string
  hooks?: string
  tickSpacing?: string
  feeTier: string
  token0: UniswapPoolToken
  token1: UniswapPoolToken
  totalValueLockedUSD: string
}

type UniswapPoolDayData = {
  date: number
  feesUSD: string
  pool: UniswapPool
  tvlUSD: string
  txCount: string
  volumeUSD: string
  source: "v3" | "v4"
}

export type { UniswapPoolDayData };