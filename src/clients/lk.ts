// LinkedIn (Lk) client — packages the LinkedIn flows that span several Reduck base
// scripts. Today: get_profile, the one composite a single `reduck run` can't express
// (three scripts threaded by publicId, assembled into one record). Pure composition
// over reduck.run — no persistence (the agent's tool writes to the CRM).

import { run } from "./reduck.js";
import { scripts } from "./lk.scripts.js";
import type { Card, Experience, Education } from "./lk.schema.js";

// LinkedIn's profile scripts key off publicId — the /in/<publicId> slug. Accept a
// full profile URL or a bare publicId.
const publicIdOf = (profile: string): string => profile.match(/\/in\/([^/?]+)/)?.[1] ?? profile;

// The assembled profile — each field is its script's contract output (see lk.schema.ts).
export interface Profile {
	publicId: string;
	card: Card;
	experience: Experience;
	education: Education;
}

// get_profile — the three profile calls (separate runs, threaded by publicId),
// assembled into one record.
export const getProfile = async (profile: string): Promise<Profile> => {
	const publicId = publicIdOf(profile);
	const [card, experience, education] = await Promise.all([
		run<Card>(scripts.card, { publicId }),
		run<Experience>(scripts.experience, { publicId, count: 50 }),
		run<Education>(scripts.education, { publicId })
	]);
	return { publicId, card, experience, education };
};
