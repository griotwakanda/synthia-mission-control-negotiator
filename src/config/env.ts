import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(8080),
  SIMULATION_MODE: z
    .string()
    .default('true')
    .transform((v) => ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WEBHOOK_BASE_URL: z.string().url().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_REALTIME_MODEL: z.string().default('gpt-4o-realtime-preview'),
  MISSION_CONTROL_API_TOKEN: z.string().optional()
});

export const env = EnvSchema.parse(process.env);
