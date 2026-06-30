// LinkedIn (Lk) client — packages the LinkedIn flows that span several Reduck base
// scripts. Today: get_profile, the one composite a single `reduck run` can't express
// (three scripts threaded by publicId, assembled into one record). Pure composition
// over reduck.run — no persistence (that's the agent's store seam).

import { run } from "./reduck.js";

// LinkedIn's profile scripts key off publicId — the /in/<publicId> slug. Accept a
// full profile URL or a bare publicId.
const publicIdOf = (profile: string): string => profile.match(/\/in\/([^/?]+)/)?.[1] ?? profile;

// The assembled profile. Each field is a base script's documented output — we don't
// retype their inner shape.
export interface Profile {
	publicId: string;
	card: unknown;
	experience: unknown;
	education: unknown;
}

// get_profile — the three profile calls (separate runs, threaded by publicId),
// assembled into one record.
export const getProfile = async (profile: string): Promise<Profile> => {
	const publicId = publicIdOf(profile);
	const [card, experience, education] = await Promise.all([
		run("reduck/linkedin.com/get_profile", { publicId }),
		run("reduck/linkedin.com/get_profile_experience", { publicId, count: 50 }),
		run("reduck/linkedin.com/get_profile_education", { publicId })
	]);
	return { publicId, card, experience, education };
};
