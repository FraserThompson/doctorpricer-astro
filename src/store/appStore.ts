// src/store/appStore.ts
import { atom, computed } from 'nanostores';
import type { RadiusBucket } from '../schema';

export interface SearchState {
	radius: string;
	lat?: number;
	lng?: number;
	age?: number;
	csc?: boolean;
	address?: string;
	displayAddress?: string;
	onlyEnrolling?: boolean;
}

export const selectedPracticeId = atom<string | null>(null);
export const searchStore = atom<SearchState>({ radius: "2000" });

export const practicesStore = atom<RadiusBucket[]>([]);

export const filteredPracticesStore = computed(
	[practicesStore, searchStore],
	(practices, search) => {
		if (!practices || practices.length === 0) return [];

		const selectedRadius = search?.radius && search.radius !== "0"
			? parseInt(search.radius, 10)
			: 2000;

		let filtered: RadiusBucket[] = practices;

		if (search?.onlyEnrolling) {
			filtered = practices
				.map(bucket => ({
					...bucket,
					practices: bucket.practices.filter(p => p.active)
				}))
				.filter(bucket => bucket.practices.length > 0);
		}

		filtered = filtered.filter(bucket => bucket.distance <= selectedRadius);

		console.log(`[STORE] Filtered to ${selectedRadius}m. Returning ${filtered.length} buckets.`);

		return filtered;
	}
);
