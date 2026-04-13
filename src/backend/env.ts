export interface BackendEnv {
	PRACTICES_DB: KVNamespace;
	ASSETS: Fetcher;
	report: SendEmail;
	REPORT_FROM: string;
	REPORT_TO: string;
}
