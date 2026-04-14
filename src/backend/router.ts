import type { BackendEnv } from './env';
import { applyCorsHeaders, buildCorsHeaders, isCorsOriginAllowed } from './http';
import { handlePractices } from './endpoints/practices';
import { handleReport } from './endpoints/report';
import { handleStats } from './endpoints/stats';

export async function handleRequest(request: Request, env: BackendEnv): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === '/api/report' && request.method === 'OPTIONS') {
		const origin = request.headers.get('Origin');

		if (!origin || !isCorsOriginAllowed(origin)) {
			return new Response(null, { status: 403 });
		}

		return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
	}

	if (url.pathname === '/api/report' && request.method === 'POST') {
		const response = await handleReport(request, env);
		return applyCorsHeaders(request, response);
	}

	if (url.pathname === '/api/practices' && request.method === 'GET') {
		const response = await handlePractices(url, env);
		return applyCorsHeaders(request, response);
	}

	if (url.pathname === '/api/stats' && request.method === 'GET') {
		const response = await handleStats(env);
		return applyCorsHeaders(request, response);
	}

	// For everything else there's the static assets
	return env.ASSETS.fetch(request);
}
