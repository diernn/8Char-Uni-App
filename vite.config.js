import { defineConfig } from 'vite';
import uniPlugin from '@dcloudio/vite-plugin-uni';
import { resolve } from "path"
import dotenv from 'dotenv'

// https://vitejs.dev/config/

dotenv.config({
	path: resolve(__dirname, `.env.${process.env.NODE_ENV}`)
})

const uni = typeof uniPlugin === 'function' ? uniPlugin : uniPlugin.default;

export default defineConfig({
	base: process.env.VITE_APP_BASE_URL || './',
	plugins: [
		uni(),
	],
	css: {
		preprocessorOptions: {
			scss: {
				quietDeps: true,
				silenceDeprecations: ['import', 'legacy-js-api'],
			},
		},
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, './src')
		}
	},
	build:{
		// sourcemap:true
	},
	server: {
		open:true,
		port: 3000,
	}
});
