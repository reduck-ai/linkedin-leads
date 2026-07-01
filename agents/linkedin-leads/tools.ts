// The tools that earn a TS layer — they do what `reduck run` alone can't: fetch a
// LinkedIn entity and write it to the CRM, or set up a Lead by joining two records that
// are already there. Fetch + compose lives in the Lk client; the record mapping — the
// one model-specific bit — lives here, then goes to notion.upsert directly.

import { getProfile as lkGetProfile, getCompany as lkGetCompany } from "../../src/clients/lk.js";
import * as notion from "../../src/clients/notion.js";
import type { People } from "./schema/People.js";
import type { Companies } from "./schema/Companies.js";
import type { Leads } from "./schema/Leads.js";

// A data source, named once by env. Each destination is a distinct id; no default.
const ds = (name: string): string => {
	const id = process.env[name];
	if (!id) throw new Error(`set ${name} to the destination data-source id`);
	return id;
};

// A LinkedIn company's headquarters → a one-line HQ string, or undefined if it has none.
const hq = (h: { city?: string | null; geographicArea?: string | null; country?: string | null } | null | undefined) =>
	(h && [h.city, h.geographicArea, h.country].filter(Boolean).join(", ")) || undefined;

export const tools = {
	// get-profile — assemble the LinkedIn profile (three runs), map its card to a Person,
	// upsert to Notion (idempotent on the unique "LinkedIn URL"). Returns where it landed.
	getProfile: async (profile: string) => {
		const { publicId, card } = await lkGetProfile(profile);
		const person: People = {
			Name: card.name ?? publicId,
			Headline: card.headline ?? undefined,
			About: card.about ?? undefined,
			Location: card.location ?? undefined,
			"LinkedIn URL": card.profileUrl
		};
		const { id, url, created } = await notion.upsert(ds("NOTION_PEOPLE_DS"), person, "LinkedIn URL");
		return { where: url, id, created, publicId, name: card.name, headline: card.headline };
	},

	// get-company — pull the LinkedIn company (one run), map to a Company, upsert (idempotent
	// on "LinkedIn URL"). Returns the ref plus companyId — the stable join key downstream.
	getCompany: async (company: string) => {
		const c = await lkGetCompany(company);
		const row: Companies = {
			Name: c.name,
			"LinkedIn URL": c.linkedinUrl ?? undefined,
			Website: c.websiteUrl ?? undefined,
			Description: c.description ?? undefined,
			Tagline: c.tagline ?? undefined,
			Industry: c.industries?.[0],
			Headcount: c.employeeCount ?? undefined,
			Founded: c.foundedYear ?? undefined,
			HQ: hq(c.headquarters)
		};
		const { id, url, created } = await notion.upsert(ds("NOTION_COMPANIES_DS"), row, "LinkedIn URL");
		return { where: url, id, created, companyId: c.companyId, name: c.name };
	},

	// put-lead — the join: a Lead is a person, so it needs only that person; its Name is
	// derived from the Person it points at. companyId is optional (the person's company,
	// when known). Idempotent on Name. personId/companyId are the ids the get-* tools return.
	putLead: async ({ personId, companyId }: { personId: string; companyId?: string }) => {
		const lead: Leads = {
			Name: await notion.pageTitle(personId),
			Person: [personId],
			...(companyId ? { Company: [companyId] } : {}),
			Status: "Not Started"
		};
		const { id, url, created } = await notion.upsert(ds("NOTION_LEADS_DS"), lead, "Name");
		return { where: url, id, created };
	}
};
