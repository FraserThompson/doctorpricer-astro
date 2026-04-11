export interface Env {
	PRACTICES_DB: KVNamespace;
	ASSETS: Fetcher;
}

interface PriceObj {
	from_age: number;
	price: number;
	is_csc: boolean;
}

export interface RawPractice {
	name: string;
	url: string;
	phone: string;
	address: string;
	active: boolean;
	pho: string;
	lat: number;
	lng: number;
}

// As it is in the JSON
export interface ServerPractice extends RawPractice {
	prices: PriceObj[];
}

// Practice returned from API after processing
export interface Practice extends RawPractice {
	distance: number;
	price: number;
}

// For pre-sorting practices so the frontend does less work
export interface RadiusBucket {
	name: string; // "5km"
	distance: number; // 5000
	practices: Practice[];
}

// Math helper for distance. Uses some crazy formula I don't understand.
function getDistanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371;
	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Sort practices into radius buckets
function bucketPractices(practices: Practice[]): RadiusBucket[] {
	const supportedRadius = [2000, 5000, 10000, 30000, 60000]; // in meters

	// Initialize buckets
	const sortedBuckets = supportedRadius.map(r => ({
		name: (r / 1000) + "km",
		distance: r,
		practices: [] as any[]
	}));

	// We must sort by distance first for the index-increment logic to work
	const distanceSorted = [...practices].sort((a, b) => a.distance - b.distance);

	let bucketIndex = 0;
	for (const practice of distanceSorted) {
		// Convert practice distance (km) to meters for comparison
		const distanceMeters = practice.distance * 1000;

		// Move to next bucket if this practice exceeds current radius
		while (bucketIndex < sortedBuckets.length - 1 && distanceMeters > sortedBuckets[bucketIndex].distance) {
			bucketIndex++;
		}

		// Only add if it actually fits in the final/largest bucket
		if (distanceMeters <= sortedBuckets[bucketIndex].distance) {
			sortedBuckets[bucketIndex].practices.push(practice);
		}
	}

	return sortedBuckets;
}

/**
 * Calculates the applicable clinic fee for a patient.
 * @param prices - The array of pricing brackets from your scraped JSON.
 * @param patientAge - The integer age of the patient.
 * @param hasCsc - Boolean indicating if the patient holds a Community Services Card.
 * @returns The applicable price as a number, or null if no valid price exists.
 */
function getApplicablePrice(
	prices: PriceObj[],
	patientAge: number,
	hasCsc: boolean
): number | null {

	if (!prices || prices.length === 0) return null;

	const validBrackets = prices.filter(bracket => {
		// Patient is too young for this bracket
		if (bracket.from_age > patientAge) return false;

		// Bracket requires CSC, but patient doesn't have one
		if (bracket.is_csc && !hasCsc) return false;

		return true;
	});

	if (validBrackets.length === 0) return null;

	// Sort the valid brackets to surface the most applicable one to the top
	validBrackets.sort((a, b) => {
		// Primary Sort: If patient has a CSC, prioritize the CSC-specific price
		if (hasCsc) {
			if (a.is_csc && !b.is_csc) return -1;
			if (!a.is_csc && b.is_csc) return 1;
		}

		// Secondary Sort: Sort by age descending (closest to patient's age wins)
		return b.from_age - a.from_age;
	});

	// The most accurate price is now at the 0 index
	return validBrackets[0].price;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// API Requests
		if (url.pathname === '/api/practices') {
			const userLat = parseFloat(url.searchParams.get('lat') || '0');
			const userLng = parseFloat(url.searchParams.get('lng') || '0');
			const userAge = parseInt(url.searchParams.get('age') || '0', 10);
			const hasCSC = url.searchParams.get('csc') === '1';
			const shouldSort = url.searchParams.get('sort') === '1';
			const enrollingOnly = url.searchParams.get('active') === '1';

			const practicesStr = await env.PRACTICES_DB.get("LATEST_PRACTICES");
			if (!practicesStr) return new Response("[]", { status: 200 });
			const practices = JSON.parse(practicesStr);

			// Map all practices with distance and correct price
			let processedPractices: any[] = practices.map((p: any) => {
				const distance = getDistanceInKm(userLat, userLng, p.lat, p.lng);
				return { ...p, distance, price: getApplicablePrice(p.prices, userAge, hasCSC) };
			});

			// Filter by max radius
			processedPractices = processedPractices.filter((p) => p.distance <= 60);

			if (enrollingOnly) {
				processedPractices = processedPractices.filter((p) => p.active);
			}

			// Return bucketed or flat list
			let finalData;
			if (shouldSort) {
				finalData = bucketPractices(processedPractices);
			} else {
				// If not sorting into buckets, just sort by price ascending
				finalData = processedPractices.sort((a, b) => a.price - b.price);
			}

			return new Response(JSON.stringify(finalData), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}

		// For everything else there's the static assets
		return env.ASSETS.fetch(request);
	}
};
