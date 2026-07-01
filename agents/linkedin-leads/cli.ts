#!/usr/bin/env node
// The tools, exposed as CLI subcommands — JSON on stdout so the agent reads each
// result. Only composite tools live here; single base scripts the agent runs with
// `reduck run reduck/<host>/<slug>` directly (the contract is `reduck read`able).

import "../../src/env.js";
import { Command } from "commander";
import { tools } from "./tools.js";

const out = (v: unknown) => console.log(JSON.stringify(v, null, 2));

const program = new Command()
	.name("leads")
	.description("LinkedIn lead-gen tools that compose reduck scripts and persist to your CRM.");

program
	.command("get-profile")
	.argument("<profile>", "profile URL or bare publicId")
	.description("Profile + experience + education (three runs), assembled and written to Notion.")
	.action(async (profile) => out(await tools.getProfile(profile)));

program
	.command("get-company")
	.argument("<company>", "company LinkedIn URL or bare slug")
	.description("LinkedIn company info (one run), written to Notion (idempotent on LinkedIn URL).")
	.action(async (company) => out(await tools.getCompany(company)));

program
	.command("put-lead")
	.description("Set up a Lead (a person; Name derived from them) from ids the get-* tools returned.")
	.requiredOption("--person <id>", "the Person's Notion page id (get-profile)")
	.option("--company <id>", "the Company's Notion page id (get-company), when known")
	.action(async ({ person, company }) => out(await tools.putLead({ personId: person, companyId: company })));

program.parseAsync().catch((e: Error) => {
	console.error(`error: ${e.message}`);
	process.exit(1);
});
