import type { AgeStat, Stats } from '../schema';

const API_URL = import.meta.env.PUBLIC_API_URL || '';

/**
 * Fetches the stats from the API.
 *
 * @returns object with ages and stats about that age.
 */
export const fetchStats = async (): Promise<Stats> => {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);

	try {
		const response = await fetch(`${API_URL}api/stats`, {
			signal: controller.signal
		});

		if (!response.ok) throw new Error("API response was not ok");

		const data: Stats = await response.json();

		return data;

	} catch (error) {
		console.error("Error getting stats from API:", error);
		throw error;
	} finally {
		clearTimeout(timeoutId);
	}
};
