import { practicesStore } from '../store/appStore';
import type { RadiusBucket } from '../worker';

const API_URL = import.meta.env.PUBLIC_API_URL || '';

/**
 * Fetches the practice data from the API
 */
export const fetchPractices = async (lat: number, lng: number, age: number, csc: number, active: number): Promise<void> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(`${API_URL}api/practices?lat=${lat}&lng=${lng}&age=${age}&csc=${csc}&active=${active}&sort=1`, {
			signal: controller.signal
		});

		if (!response.ok) throw new Error("API response was not ok");

		const radiusBuckets: RadiusBucket[] = await response.json();
		console.log(`[PRACTICES] Got ${radiusBuckets.length} radius buckets from API.`);

		practicesStore.set(radiusBuckets);

	} catch (error) {
		console.error("Error getting practices from API:", error);
		// Don't leave the UI hanging on error, clear the store
		practicesStore.set([]);
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
};
