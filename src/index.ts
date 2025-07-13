import "./lib/env";
import { bot } from "./lib/telegram";
import { getBalancedPoolsLast3Days } from "./lib/uniswap";
import { Markup } from "telegraf";
import type { UniswapPoolDayData } from "./types/uniswap";
let lastTokens: (UniswapPoolDayData & { apr: number })[] = [];

bot.launch(() => {
    console.log("🚀 Bot started");
})

bot.command("start", (ctx) => {
    ctx.reply("hello, welcome to caesar's bot");
})

bot.command("ape", async (ctx) => {
    lastTokens = await getBalancedPoolsLast3Days();
    const rows = lastTokens.map((pool, i) => [
        Markup.button.url(
            `${pool.pool.token0.symbol}/${pool.pool.token1.symbol}`,
            `https://app.uniswap.org/explore/pools/base/${pool.pool.id}`
        ),
        Markup.button.callback(
            "Details",
            `pool_${i}`
        )
    ]);
    await ctx.reply(
        "Top 10 Uniswap Pools (last 3 days):",
        Markup.inlineKeyboard(rows)
    );
});

bot.on("callback_query", (ctx) => {
    const data = (ctx.callbackQuery as any)?.data as string | undefined;
    if (typeof data === "string" && data.startsWith("pool_")) {
        const idx = Number(data.replace("pool_", ""));
        const pool = lastTokens[idx];
        if (pool) {
            ctx.answerCbQuery();
            ctx.reply(
                `${pool.pool.token0.symbol}/${pool.pool.token1.symbol}\nFee Tier: ${pool.pool.feeTier}\nTVL: $${Number(pool.pool.totalValueLockedUSD).toLocaleString()}\nVolume: $${Number(pool.volumeUSD).toLocaleString()}\nFees: $${Number(pool.feesUSD).toLocaleString()}\nTx Count: ${pool.txCount}\nAPR: ${pool.apr.toFixed(2)}%`
            );
        } else {
            ctx.answerCbQuery("Pool not found");
        }
    }
});
