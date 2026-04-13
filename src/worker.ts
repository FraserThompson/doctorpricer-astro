import { handleRequest } from './backend/router';
import type { BackendEnv } from './backend/env';

export interface Env extends BackendEnv {}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		return handleRequest(request, env);
	}
};
