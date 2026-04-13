/// <reference types="google.maps" />

import { searchStore } from '../store/appStore';

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void;
	}
}


/**
 * Initializes the search model, handling geocoding if necessary.
 */
export const initializeSearch = async (
	lat: number | string,
	lng: number | string,
	age: number,
	csc: boolean,
	address?: string,
	displayAddress?: string,
	onlyEnrolling?: boolean
): Promise<void> => {

	const parsedLat = typeof lat === "string" ? parseFloat(lat) : lat;
	const parsedLng = typeof lng === "string" ? parseFloat(lng) : lng;

	// If we already have the address, update the store immediately
	if (address && displayAddress) {
		searchStore.set({
			lat: parsedLat,
			lng: parsedLng,
			age,
			csc,
			address,
			displayAddress,
			onlyEnrolling,
			radius: "0", // Defaulting to first radius bucket
		});
		return;
	}

	console.log("[SEARCH] No address provided, geocoding...");

	// Safety check to ensure Google Maps is loaded before we try to use it
	if (typeof google === 'undefined' || !google.maps) {
		return Promise.reject(new Error("Google Maps API is not loaded yet."));
	}

	const geocoder = new google.maps.Geocoder();
	const coordsObj = new google.maps.LatLng(parsedLat, parsedLng);

	return new Promise((resolve, reject) => {
		geocoder.geocode(
			{ location: coordsObj, region: 'NZ' },
			(
				results: google.maps.GeocoderResult[] | null,
				status: google.maps.GeocoderStatus
			) => {
				if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
					const formattedAddress = results[0].formatted_address;

					// Safely check if address components exist before accessing array indexes
					let shortAddress = formattedAddress;
					if (results[0].address_components && results[0].address_components.length >= 2) {
						shortAddress = `${results[0].address_components[0].short_name} ${results[0].address_components[1].short_name}`;
					}

					searchStore.set({
						lat: parsedLat,
						lng: parsedLng,
						age,
						csc,
						address: formattedAddress,
						displayAddress: shortAddress,
						radius: "0"
					});

					resolve();
				} else {
					reject(new Error(`Error geocoding input address: ${status}`));
				}
			});
	});
};
