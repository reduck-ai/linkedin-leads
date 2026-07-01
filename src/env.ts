// The single point where local env enters the process. Both binaries import this first,
// so a `.env` in the working directory is loaded (Node's built-in loader — no dependency)
// before any process.env read. A missing `.env` is fine: values can still come from the
// shell, and auth comes from each tool's own CLI session. The contract — every var the
// tool reads — is documented in .env.example.

import { existsSync } from "node:fs";

if (existsSync(".env")) process.loadEnvFile(".env");
