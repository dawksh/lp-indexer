import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.string().default('3000').transform(Number),
  GRAPH_API_KEY: z.string(),
  TELEGRAM_BOT_TOKEN: z.string(),
  PRIVY_APP_ID: z.string(),
  PRIVY_APP_SECRET: z.string(),
  REDIS_URL: z.string(),
})

export const env = envSchema.parse(process.env)
