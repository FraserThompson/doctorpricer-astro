import type { AgeStat, PracticeSummary, ServerPractice } from '../../schema';
import type { BackendEnv } from '../env';
import { jsonResponse } from '../http';
import { getApplicablePrice } from './practices';

const STAT_AGES = [0, 14, 18, 25, 45, 65] as const;

export async function handleStats(env: BackendEnv): Promise<Response> {
	const practicesStr = await env.PRACTICES_DB.get('LATEST_PRACTICES');
	if (!practicesStr) return jsonResponse({}, 200);
	const practices: ServerPractice[] = JSON.parse(practicesStr);

	const result: Record<number, AgeStat> = {};

	for (const age of STAT_AGES) {
		const priced: PracticeSummary[] = practices.map((p) => ({
			id: p.id,
			name: p.name,
			url: p.url,
			price: getApplicablePrice(p.prices, age, false),
		})).filter((p) => p.price < 999);

		const total = priced.reduce((sum, p) => sum + p.price, 0);
		const averagePrice = Math.round((total / priced.length) * 100) / 100;

		const sorted = [...priced].sort((a, b) => a.price - b.price);
		const mostExpensive = sorted[sorted.length - 1];

		result[age] = { averagePrice, mostExpensive };
	}

	return jsonResponse(result, 200);
}
