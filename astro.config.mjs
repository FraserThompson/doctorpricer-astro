// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://doctorpricer.co.nz',
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ['leaflet'],
		}
	}
});
