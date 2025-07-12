import axios from "axios";
import type { UniswapPoolDayData } from "../types/uniswap";
import { env } from "./env";

const v4Subgraph =
  "https://gateway.thegraph.com/api/subgraphs/id/HNCFA9TyBqpo5qpe6QreQABAA1kV8g46mhkCcicu6v2R";

const v3Subgraph =
  "https://gateway.thegraph.com/api/subgraphs/id/HMuAwufqZ1YCRmzL2SfHTVkzZovC9VL2UAKhjvRqKiR1";

const threeDaysAgoTimestamp = Math.floor(Date.now() / 1000) - 9 * 24 * 60 * 60;

const query = `
query BalancedPoolsLast3Days {
  poolDayDatas(
    first: 1000
    orderBy: feesUSD
    orderDirection: desc
    where: {
      date_gte: ${threeDaysAgoTimestamp}
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

const getBalancedPoolsLast3Days = async () => {
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
    ...v3Response.data.data.poolDayDatas,
    ...v4Response.data.data.poolDayDatas,
  ];

  return allPools
    .sort((a, b) => Number(b.feesUSD) - Number(a.feesUSD))
    .slice(0, 10);
};

export { getBalancedPoolsLast3Days };
