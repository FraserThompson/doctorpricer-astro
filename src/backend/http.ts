export const API_HEADERS = {
	'Content-Type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
};

export function sanitizeText(value: unknown, maxLength = 500): string {
	if (typeof value !== 'string') return '';
	return value.trim().slice(0, maxLength);
}

export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: API_HEADERS,
	});
}
