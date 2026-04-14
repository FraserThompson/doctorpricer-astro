export const API_HEADERS = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

const PROD_ALLOWED_ORIGINS = new Set(['https://doctorpricer.co.nz']);

export function isCorsOriginAllowed(origin: string): boolean {
	let parsed: URL;

	try {
		parsed = new URL(origin);
	} catch {
		return false;
	}

	if (PROD_ALLOWED_ORIGINS.has(origin)) return true;

	return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
}

export function buildCorsHeaders(request: Request): Headers {
	const headers = new Headers(API_HEADERS);
	const origin = request.headers.get('Origin');

	if (origin && isCorsOriginAllowed(origin)) {
		headers.set('Access-Control-Allow-Origin', origin);
	}

	headers.set('Vary', 'Origin');

	return headers;
}

export function applyCorsHeaders(request: Request, response: Response): Response {
	const headers = new Headers(response.headers);
	const origin = request.headers.get('Origin');

	if (origin && isCorsOriginAllowed(origin)) {
		headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Methods', API_HEADERS['Access-Control-Allow-Methods']);
		headers.set('Access-Control-Allow-Headers', API_HEADERS['Access-Control-Allow-Headers']);
	}

	headers.set('Vary', 'Origin');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

export function sanitizeText(value: unknown, maxLength = 500): string {
	if (typeof value !== 'string') return '';
	return value.trim().slice(0, maxLength);
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': API_HEADERS['Content-Type'],
		},
	});
}
