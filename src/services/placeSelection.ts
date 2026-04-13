import type { SearchState } from '../store/appStore';

export interface PlaceSelection {
	location: {
		lat: () => number;
		lng: () => number;
	};
	formattedAddress: string;
	displayName: string;
}

export interface ResolvedSearchLocation {
	lat: number;
	lng: number;
	address: string;
	displayAddress: string;
}

/**
 * The fields we want back from the google thing.
 */
export const PLACE_AUTOCOMPLETE_FIELDS = ['displayName', 'formattedAddress', 'location', 'addressComponents'];

/**
 * Turns the thing we get back from Google into a thing we can use
 *
 * @param place
 * @returns A thing we can use.
 */
export function toResolvedSearchLocation(place: PlaceSelection): ResolvedSearchLocation {
	return {
		lat: place.location.lat(),
		lng: place.location.lng(),
		address: place.formattedAddress,
		displayAddress: place.displayName,
	};
}

/**
 * Helper to abstract the logic of resolving a search location.
 *
 * @param selectedPlace
 * @param currentSearch
 * @returns
 */
export function resolveSearchLocation(
	selectedPlace: PlaceSelection | null,
	currentSearch: SearchState | undefined,
): ResolvedSearchLocation | null {
	if (selectedPlace) {
		return toResolvedSearchLocation(selectedPlace);
	}

	if (!currentSearch?.lat || !currentSearch?.lng) {
		return null;
	}

	return {
		lat: currentSearch.lat,
		lng: currentSearch.lng,
		address: currentSearch.address || '',
		displayAddress: currentSearch.displayAddress || '',
	};
}
