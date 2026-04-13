import type { BackendEnv } from '../env';
import { jsonResponse, sanitizeText } from '../http';

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
