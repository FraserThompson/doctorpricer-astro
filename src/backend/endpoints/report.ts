import type { BackendEnv } from '../env';
import { jsonResponse, sanitizeText } from '../http';

const REPORT_SUBMIT_COOLDOWN_MS = 10_000;
const REPORT_RATE_LIMIT_PREFIX = 'report-rate-limit';

type ReportPayload = {
	practiceName?: string;
	fields?: string[];
	correction?: string;
	practiceId?: string;
	price?: number;
	address?: string;
	phone?: string;
	url?: string;
};

function getClientIp(request: Request): string {
	const cfIp = request.headers.get('CF-Connecting-IP')?.trim();
	if (cfIp) return cfIp;

	const forwardedFor = request.headers.get('X-Forwarded-For');
	if (forwardedFor) {
		const first = forwardedFor.split(',')[0]?.trim();
		if (first) return first;
	}

	return 'unknown';
}

async function buildClientFingerprint(request: Request): Promise<string> {
	const ip = getClientIp(request);
	const userAgent = sanitizeText(request.headers.get('User-Agent') ?? '', 200);
	const raw = `${ip}|${userAgent}`;

	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
	const bytes = new Uint8Array(digest);

	return Array.from(bytes.slice(0, 12), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function enforceReportRateLimit(request: Request, env: BackendEnv): Promise<Response | null> {
	const fingerprint = await buildClientFingerprint(request);
	const key = `${REPORT_RATE_LIMIT_PREFIX}:${fingerprint}`;
	const now = Date.now();

	const nextAllowedRaw = await env.PRACTICES_DB.get(key);
	const nextAllowedAt = Number(nextAllowedRaw || 0);

	if (Number.isFinite(nextAllowedAt) && nextAllowedAt > now) {
		const retryAfterSeconds = Math.max(1, Math.ceil((nextAllowedAt - now) / 1000));

		return new Response(
			JSON.stringify({ error: `Too many reports. Please wait ${retryAfterSeconds}s and try again.` }),
			{
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(retryAfterSeconds),
				},
			},
		);
	}

	const nextAllowed = now + REPORT_SUBMIT_COOLDOWN_MS;
	await env.PRACTICES_DB.put(key, String(nextAllowed), {
		expirationTtl: Math.ceil(REPORT_SUBMIT_COOLDOWN_MS / 1000) + 60,
	});

	return null;
}

export async function handleReport(request: Request, env: BackendEnv): Promise<Response> {
	let body: ReportPayload;
	try {
		body = (await request.json()) as ReportPayload;
	} catch {
		return jsonResponse({ error: 'Invalid JSON body' }, 400);
	}

	const practiceName = sanitizeText(body.practiceName, 200);
	const correction = sanitizeText(body.correction, 2000);
	const practiceId = sanitizeText(body.practiceId, 300);
	const fields = Array.isArray(body.fields)
		? body.fields.map((field) => sanitizeText(field, 50)).filter(Boolean)
		: [];

	if (!practiceName) {
		return jsonResponse({ error: 'practiceName is required' }, 400);
	}

	if (fields.length === 0) {
		return jsonResponse({ error: 'At least one field must be selected' }, 400);
	}

	if (!correction) {
		return jsonResponse({ error: 'correction is required' }, 400);
	}

	const rateLimitResponse = await enforceReportRateLimit(request, env);
	if (rateLimitResponse) {
		return rateLimitResponse;
	}

	const details = [
		`Practice: ${practiceName}`,
		`Practice ID: ${practiceId || 'N/A'}`,
		`Fields flagged: ${fields.join(', ')}`,
		`Current address: ${sanitizeText(body.address, 300) || 'N/A'}`,
		`Current phone: ${sanitizeText(body.phone, 80) || 'N/A'}`,
		`Current website: ${sanitizeText(body.url, 300) || 'N/A'}`,
		`Current price: ${typeof body.price === 'number' ? body.price : 'N/A'}`,
		'',
		'Suggested correction:',
		correction,
	].join('\n');

	try {
		console.log('Sending email from:', env.REPORT_FROM, 'to:', env.REPORT_TO);
		await env.report.send({
			from: env.REPORT_FROM,
			to: env.REPORT_TO,
			subject: `[DoctorPricer] Practice inaccuracy report: ${practiceName}`,
			text: details,
		});
	} catch (error) {
		console.error('Failed to send report email:', {
			from: env.REPORT_FROM,
			to: env.REPORT_TO,
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});
		return jsonResponse({ error: 'Failed to send report' }, 500);
	}

	return jsonResponse({ ok: true }, 200);
}
