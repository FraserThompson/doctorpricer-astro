import type { RawPractice } from '../schema';

// These are treated the same currently
const NO_PRICE_SENTINEL = 1000;
const INELIGIBLE_SENTINEL = 999;

/**
 * If a price is 0 and they're over 14 it might have some restrictions.
 *
 * @param price
 * @param age
 *
 * @returns
 */
export function probablyRestricted(price: number, age: number) {
	return price === 0 && age > 13
}

/**
 * Returns the display price for a practice in the sidebar.
 *
 * @param price
 * @returns string and style boolean.
 */
export function getSidebarPriceDisplay(price: number): { text: string; muted: boolean } {
	if (price === NO_PRICE_SENTINEL || price === INELIGIBLE_SENTINEL) {
		return { text: 'No price info', muted: true };
	}

	return { text: `$${price.toFixed(2)}`, muted: false };
}

/**
 * Returns the display price for a practice on the marker.
 *
 * @param price
 * @returns price to put on page.
 */
export function getMarkerPriceDisplay(price: number): string {
	if (price === NO_PRICE_SENTINEL || price === INELIGIBLE_SENTINEL) {
		return '-';
	}

	return `$${Math.round(price)}`;
}
