import postgres, { type Sql } from "postgres";

import { getConfig } from "./config.js";

let client: Sql | undefined;

export function getDatabase(): Sql {
  client ??= postgres(getConfig().DATABASE_URL, {
    max: getConfig().NODE_ENV === "production" ? 10 : 4,
    idle_timeout: 20,
    connect_timeout: 10,
    transform: postgres.camel,
  });
  return client;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.end({ timeout: 5 });
    client = undefined;
  }
}
