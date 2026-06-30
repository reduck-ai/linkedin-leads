// The one tool that earns a TS layer — it does what `reduck run` alone can't:
// compose several base-script calls and write the result to the record store.
// The composition lives in the Lk client; here we only persist it.

import { getProfile as lkGetProfile } from "../../src/clients/lk.js";
import type { Adapter, Lead } from "./store.js";

export const tools = (store: Adapter) => ({
	// get_profile — assemble the LinkedIn profile (Lk client) and write it to state.
	getProfile: async (profile: string): Promise<Lead> => {
		const lead = await lkGetProfile(profile);
		await store.upsert(lead);
		return lead;
	}
});
