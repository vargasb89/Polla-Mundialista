import { neon } from "@neondatabase/serverless";

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
