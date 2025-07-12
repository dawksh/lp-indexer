import { Telegraf } from "telegraf";
import { env } from "./env";

const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);

export { bot };