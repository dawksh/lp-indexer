import axios from "axios";
import type { UniswapPoolDayData } from "../types/uniswap";
import { env } from "./env";
import redis from "./redis";

const v4Subgraph =
  "https://gateway.thegraph.com/api/subgraphs/id/HNCFA9TyBqpo5qpe6QreQABAA1kV8g46mhkCcicu6v2R";

const v3Subgraph =
  "https://gateway.thegraph.com/api/subgraphs/id/HMuAwufqZ1YCRmzL2SfHTVkzZovC9VL2UAKhjvRqKiR1";

const getBalancedPoolsDaysAgo = async (days: number) => {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - days);
  const timestamp = Math.floor(now.getTime() / 1000);

  const query = `
      query BalancedPoolsDaysAgo {
        poolDayDatas(
          first: 1000
          orderBy: feesUSD
          orderDirection: desc
          where: {
            date_gte: ${timestamp}
            tvlUSD_gte: 100000
          }
        ) {
          pool {
            id
            token0 {
              symbol
            }
            token1 {
              symbol
            }
            feeTier
            totalValueLockedUSD
          }
          date
          volumeUSD
          feesUSD
          tvlUSD
          txCount
        }
      }
      `;
  const [v3Response, v4Response] = await Promise.all([
    axios.post<{ data: { poolDayDatas: UniswapPoolDayData[] } }>(
      v4Subgraph,
      {
        query: query,
      },
      {
        headers: {
          Authorization: `Bearer ${env.GRAPH_API_KEY}`,
        },
      }
    ),
    axios.post<{ data: { poolDayDatas: UniswapPoolDayData[] } }>(
      v3Subgraph,
      {
        query: query,
      },
      {
        headers: {
          Authorization: `Bearer ${env.GRAPH_API_KEY}`,
        },
      }
    ),
  ]);

  const allPools = [
    ...v3Response.data.data.poolDayDatas.map((pool) => ({ ...pool, source: "v3" as const })),
    ...v4Response.data.data.poolDayDatas.map((pool) => ({ ...pool, source: "v4" as const })),
  ];

  const poolMap = new Map<string, UniswapPoolDayData>();
  for (const pool of allPools) {
    const key = [pool.pool.token0.symbol, pool.pool.token1.symbol]
      .sort()
      .join(":");
    if (
      !poolMap.has(key) ||
      Number(pool.feesUSD) > Number(poolMap.get(key)?.feesUSD ?? 0)
    ) {
      poolMap.set(key, pool);
    }
  }
  return Array.from(poolMap.values())
    .sort((a, b) => Number(b.feesUSD) - Number(a.feesUSD))
    .slice(0, 10)
    .map((pool) => ({
      ...pool,
      apr: (Number(pool.feesUSD) / Number(pool.tvlUSD)) * 365 * 100,
    }));
};

const getBalancedPoolsDaysAgoCache = async (days: number) => {
  const redisKey = `lastTokensGlobal::${days}`;
  const cached = await redis.get(redisKey);
  if (cached) {
    console.log("🔍 Using cached lastTokensGlobal");
    return JSON.parse(cached);
  }
  const lastTokens = await getBalancedPoolsDaysAgo(days);
  await redis.set(redisKey, JSON.stringify(lastTokens), { EX: 600 });
  console.log("🔍 Using fresh lastTokensGlobal");
  return lastTokens;
};

export { getBalancedPoolsDaysAgoCache };
