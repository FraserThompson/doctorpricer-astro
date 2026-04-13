import type { BackendEnv } from './env';
import { API_HEADERS } from './http';
import { handlePractices } from './endpoints/practices';
import { handleReport } from './endpoints/report';

export async function handleRequest(request: Request, env: BackendEnv): Promise<Response> {
	const url = new URL(request.url);

	if (url.pathname === '/api/report' && request.method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: API_HEADERS });
	}

	if (url.pathname === '/api/report' && request.method === 'POST') {
		return handleReport(request, env);
	}

	if (url.pathname === '/api/practices' && request.method === 'GET') {
		return handlePractices(url, env);
	}

	// For everything else there's the static assets
	return env.ASSETS.fetch(request);
}
