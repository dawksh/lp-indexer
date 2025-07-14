import { createPublicClient, http } from "viem";
import { encodeFunctionData } from "viem";
import type { UniswapPoolDayData } from "../types/uniswap";

import { Token, ChainId, Ether } from "@uniswap/sdk-core";
import { base } from "viem/chains";
import { Pool } from "@uniswap/v4-sdk";
import { STATE_VIEW_ABI } from "./abis/stateView";

const ETH_NATIVE = Ether.onChain(ChainId.BASE);

const ETH_TOKEN = new Token(
  ChainId.BASE,
  "0x0000000000000000000000000000000000000000",
  18,
  "ETH",
  "Ether"
);

const STATE_VIEW_CONTRACT_ADDRESS =
  "0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71";

const client = createPublicClient({
  chain: base,
  transport: http("https://base.llamarpc.com"),
});

const addLiquidity = async (amount: string, pool: UniswapPoolDayData) => {
  const source = pool.source;

  switch (source) {
    case "v3":
      return addLiquidityV3(amount, pool);
    case "v4":
      return addLiquidityV4(amount, pool);
    default:
      throw new Error("Invalid source");
  }
};

const addLiquidityV4 = async (amount: string, pool: UniswapPoolDayData) => {
  const PAIR_TOKEN = new Token(
    ChainId.BASE,
    pool.pool.id,
    18,
    pool.pool.token0.symbol,
    pool.pool.token0.symbol
  );
  const poolId = Pool.getPoolId(
    ETH_TOKEN,
    PAIR_TOKEN,
    Number(pool.pool.feeTier),
    Number(pool.pool.tickSpacing),
    pool.pool.hooks || "0x0000000000000000000000000000000000000000"
  );

  const [slot0, liquidity] = await Promise.all([
    client.readContract({
      address: STATE_VIEW_CONTRACT_ADDRESS,
      abi: STATE_VIEW_ABI,
      functionName: "getSlot0",
      args: [poolId as `0x${string}`],
    }),
    client.readContract({
      address: STATE_VIEW_CONTRACT_ADDRESS,
      abi: STATE_VIEW_ABI,
      functionName: "getLiquidity",
      args: [poolId as `0x${string}`],
    }),
  ]) as unknown as [[bigint, number], bigint];

  const sqrtPriceX96Current = slot0[0];
  const currentTick = slot0[1];
  const currentLiquidity = liquidity;

  const tickSpacing = Number(pool.pool.tickSpacing);
  const tickLower = Math.floor((currentTick - tickSpacing * 10) / tickSpacing) * tickSpacing;
  const tickUpper = Math.ceil((currentTick + tickSpacing * 10) / tickSpacing) * tickSpacing;
  const liquidityDelta = BigInt(amount);
  const recipient = "0x0000000000000000000000000000000000000000";
  const hooksData = "0x";

  const POOL_MANAGER_ADDRESS = "0x4200000000000000000000000000000000000002";
  const POOL_MANAGER_ABI = [
    {
      "inputs": [
        { "internalType": "bytes32", "name": "poolId", "type": "bytes32" },
        { "internalType": "int24", "name": "tickLower", "type": "int24" },
        { "internalType": "int24", "name": "tickUpper", "type": "int24" },
        { "internalType": "int256", "name": "liquidityDelta", "type": "int256" },
        { "internalType": "address", "name": "recipient", "type": "address" },
        { "internalType": "bytes", "name": "hookData", "type": "bytes" }
      ],
      "name": "modifyPosition",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  const calldata = encodeFunctionData({
    abi: POOL_MANAGER_ABI,
    functionName: "modifyPosition",
    args: [
      poolId,
      tickLower,
      tickUpper,
      liquidityDelta,
      recipient,
      hooksData
    ]
  });

  return { calldata, poolId, tickLower, tickUpper, liquidityDelta, recipient, hooksData };
};

const addLiquidityV3 = async (amount: string, pool: UniswapPoolDayData) => {};

export { addLiquidity };
