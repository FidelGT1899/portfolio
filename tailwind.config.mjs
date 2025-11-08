/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			animation: {
                scrollFrontend: "scrollFrontend 30s linear infinite",
				scrollBackend: "scrollBackend 40s linear infinite reverse",
				scrollOthers: "scrollOthers 50s linear infinite",
            },
            keyframes: {
                scrollFrontend: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-50%)" },
				},
				scrollBackend: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-50%)" },
				},
				scrollOthers: {
					"0%": { transform: "translateX(0)" },
					"100%": { transform: "translateX(-50%)" },
				},
            },
			colors: {
				primary: {
					DEFAULT: '#0C4320',
					light: '#1F7A40',
					dark: '#082F17',
				}
			}
		},
	},
	plugins: [],
}
