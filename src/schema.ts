/**
 * Defines how our objects look after they're scraped.
 */

export interface PriceObj {
	from_age: number;
	price: number;
	is_csc: boolean;
}

export interface RawPractice {
	id: string;
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

// For the stats display
export interface PracticeSummary {
	id: string;
	name: string;
	url: string;
	price: number;
}

export interface AgeStat {
	averagePrice: number;
	mostExpensive: PracticeSummary;
}

export interface Stats {
	prices:  Record<number, AgeStat>;
	enrolling: number;
	total: number;
}
