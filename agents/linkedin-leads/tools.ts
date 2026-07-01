// The one tool that earns a TS layer — it does what `reduck run` alone can't:
// compose several base-script calls and write the result straight to the CRM.
// The composition lives in the Lk client; the card → People mapping — the one
// model-specific line — lives here, then goes to notion.upsert directly.

import { getProfile as lkGetProfile } from "../../src/clients/lk.js";
import * as notion from "../../src/clients/notion.js";
import type { People } from "./schema/People.js";

// The People data source, named once. No adapter, no default: Notion is the destination.
const ds = (): string => {
	const id = process.env.NOTION_PEOPLE_DS;
	if (!id) throw new Error("set NOTION_PEOPLE_DS to the People database / data-source id");
	return id;
};

export const tools = {
	// get_profile — assemble the LinkedIn profile (Lk client), map its card to a People
	// record, and upsert it to Notion (idempotent on the unique "LinkedIn URL"). Returns
	// the deliverable: where it landed and who — not the raw profile (that's in Notion).
	getProfile: async (profile: string) => {
		const { publicId, card } = await lkGetProfile(profile);
		const c = card as Partial<Record<"name" | "headline" | "about" | "location" | "profileUrl", string>>;
		const person: People = {
			Name: c.name ?? publicId,
			Headline: c.headline,
			About: c.about,
			Location: c.location,
			"LinkedIn URL": c.profileUrl
		};
		const { url, created } = await notion.upsert(ds(), person, "LinkedIn URL");
		return { where: url, created, publicId, name: c.name, headline: c.headline };
	}
};
