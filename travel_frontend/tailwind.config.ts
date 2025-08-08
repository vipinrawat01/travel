
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: {
					DEFAULT: 'hsl(var(--background))',
					secondary: 'hsl(var(--background-secondary))',
					tertiary: 'hsl(var(--background-tertiary))',
				},
				foreground: {
					DEFAULT: 'hsl(var(--foreground))',
					secondary: 'hsl(var(--foreground-secondary))',
					muted: 'hsl(var(--foreground-muted))',
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					secondary: 'hsl(var(--card-secondary))',
					foreground: 'hsl(var(--card-foreground))',
				},
				ai: {
					primary: 'hsl(var(--ai-primary))',
					secondary: 'hsl(var(--ai-secondary))',
					tertiary: 'hsl(var(--ai-tertiary))',
					success: 'hsl(var(--ai-success))',
					warning: 'hsl(var(--ai-warning))',
					danger: 'hsl(var(--ai-danger))',
				},
				hover: 'hsl(var(--hover))',
				active: 'hsl(var(--active))',
			},
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				xl: 'var(--radius-xl)',
			},
			keyframes: {
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'glow-pulse': {
					'0%, 100%': { boxShadow: '0 0 20px hsl(245 83% 67% / 0.3)' },
					'50%': { boxShadow: '0 0 30px hsl(245 83% 67% / 0.6)' }
				},
				'pulse-flow': {
					'0%, 100%': { opacity: '0.3', transform: 'scaleY(1)' },
					'50%': { opacity: '0.8', transform: 'scaleY(1.1)' }
				},
				'slide-in-up': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'fade-in': {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				}
			},
			animation: {
				'float': 'float 6s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'pulse-flow': 'pulse-flow 2s ease-in-out infinite',
				'slide-in-up': 'slide-in-up 0.6s ease-out',
				'fade-in': 'fade-in 0.4s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
