import "./lib/env";
import { bot } from "./lib/telegram";
import { getBalancedPoolsDaysAgo } from "./lib/uniswap";
import { Markup } from "telegraf";
import type { UniswapPoolDayData } from "./types/uniswap";
import { abbreviateNumbers } from "./lib/utils";
import { getOrCreateWallet } from "./lib/privy";
import { formatEther, parseEther } from "viem";
let lastTokens: (UniswapPoolDayData & { apr: number })[] = [];

bot.launch(() => {
  console.log("🚀 Bot started");
});

bot.command("start", async (ctx) => {
  const userId = ctx.from?.id;
  const user = await getOrCreateWallet(
    userId.toString(),
    ctx.from?.username || ""
  );
  ctx.reply(
    `
🏦 welcome to caesar's bot\n
🚀 Your gateway to aping into LPs easily\n
💰 Your wallet address: <code>${user?.wallet?.address}</code>
🤑 Your wallet balance: ${formatEther(user?.balance)} ETH\n
🔍 /lp to see the trending pools
    `,
    {
      parse_mode: "HTML",
    }
  );
});

bot.command("lp", async (ctx) => {
  lastTokens = await getBalancedPoolsDaysAgo(1);
  let msg = "Choose a token from the below trending list:\n\n";
  const rows = lastTokens.map((pool, i) => [
    Markup.button.callback(
      `${pool.pool.token0.symbol}/${pool.pool.token1.symbol}`,
      `pool_${i}`
    ),
    Markup.button.url(
      "Dex",
      `https://app.uniswap.org/explore/pools/base/${pool.pool.id}`
    ),
  ]);
  lastTokens.forEach((pool, i) => {
    const tvl = `$${abbreviateNumbers(Number(pool.tvlUSD))}`;
    const vol = `$${abbreviateNumbers(Number(pool.volumeUSD))}`;
    msg += `${i + 1}. ${pool.pool.token0.symbol}/${
      pool.pool.token1.symbol
    } | TVL: ${tvl} | Volume 24h: ${vol} | APR: ${pool.apr.toFixed(2)}%\n\n`;
  });
  await ctx.reply(msg, Markup.inlineKeyboard(rows));
});

bot.on("callback_query", async (ctx) => {
  const data = (ctx.callbackQuery as any)?.data as string | undefined;
  if (typeof data === "string" && data.startsWith("pool_")) {
    const idx = Number(data.replace("pool_", ""));
    const pool = lastTokens[idx];
    if (pool) {
      ctx.answerCbQuery();
      ctx.reply(
        `${pool.pool.token0.symbol}/${pool.pool.token1.symbol}\n
        \nFee Tier: ${
          pool.pool.feeTier
        }\nTVL: $${Number(
          pool.pool.totalValueLockedUSD
        ).toLocaleString()}\nVolume: $${Number(
          pool.volumeUSD
        ).toLocaleString()}\nFees: $${Number(
          pool.feesUSD
        ).toLocaleString()}\nTx Count: ${pool.txCount}\nAPR: ${pool.apr.toFixed(
          2
        )}%`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Open Position", `open_position_${idx}`)],
        ])
      );
    } else {
      ctx.answerCbQuery("Pool not found");
    }
  }
  if (typeof data === "string" && data.startsWith("open_position_")) {
    const idx = Number(data.replace("open_position_", ""));
    const pool = lastTokens[idx];
    if (pool) {
      ctx.answerCbQuery();
      ctx.reply(
        `
Select Amount to add to LP\n
50% of the selected amount will be converted to ${pool.pool.token0.symbol} and 50% to ${pool.pool.token1.symbol} with concentrated liquidity range.
            `,
        Markup.inlineKeyboard([
          [Markup.button.callback("0.01 ETH", `add_lp_${idx}_0.01_ETH`)],
          [Markup.button.callback("0.05 ETH", `add_lp_${idx}_0.05_ETH`)],
          [Markup.button.callback("0.1 ETH", `add_lp_${idx}_0.1_ETH`)],
        ])
      );
    }
  }
  if (typeof data === "string" && data.startsWith("add_lp_")) {
    const [_, idx, amount, token] = data.split("_");
    const pool = lastTokens[Number(idx)];
    const user = await getOrCreateWallet(ctx.from?.id.toString() || "", ctx.from?.username || "");
    if(user.balance < parseEther(amount!)) {
      ctx.reply("Insufficient balance");
      return;
    }
    if (pool && user) {
      ctx.answerCbQuery();
      ctx.reply(`Adding LP... ${amount} ${token}`);
    }
  }
});
