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

const syncResultUrlFromState = (state: SearchState): void => {
	if (typeof window === 'undefined') return;
	if (window.location.pathname !== '/result') return;
	if (typeof state.lat !== 'number' || typeof state.lng !== 'number' || typeof state.age !== 'number') return;

	const queryParams = new URLSearchParams({
		lat: state.lat.toString(),
		lng: state.lng.toString(),
		age: state.age.toString(),
		csc: state.csc ? '1' : '0',
		address: state.address || '',
		displayAddress: state.displayAddress || '',
		active: state.onlyEnrolling ? '1' : '0',
	});

	window.history.replaceState({}, '', `/result?${queryParams.toString()}`);
};

export const setSearchState = (state: SearchState): void => {
	searchStore.set(state);
	syncResultUrlFromState(state);
};

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
