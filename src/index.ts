import "./lib/env";
import { bot } from "./lib/telegram";
import { getBalancedPoolsLast3Days } from "./lib/uniswap";

bot.launch(() => {
    console.log("🚀 Bot started");
})

bot.command("start", (ctx) => {
    ctx.reply("hello, welcome to caesar's bot");
})

bot.command("ape", async (ctx) => {
    const tokens = await getBalancedPoolsLast3Days();
    const top10PoolsString = tokens.map((pool) => `${pool.pool.token0.symbol} / ${pool.pool.token1.symbol} - 🏦 ${Number(pool.feesUSD).toFixed(2)}`).join("\n");
    ctx.reply(top10PoolsString);
})
