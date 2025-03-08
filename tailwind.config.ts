import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./public/**/*.html",
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
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))'
				},
				'glass': {
					DEFAULT: 'rgba(255, 255, 255, var(--glass-opacity, 0.15))',
					dark: 'rgba(17, 25, 40, var(--glass-opacity-dark, 0.18))',
					border: 'rgba(255, 255, 255, var(--glass-border-opacity, 0.2))',
					'border-dark': 'rgba(255, 255, 255, var(--glass-border-opacity-dark, 0.1))',
				},
				'arwes': {
					primary: 'var(--arwes-primary, #0ff)',
					secondary: 'var(--arwes-secondary, #ff0)',
					success: 'var(--arwes-success, #0f0)',
					error: 'var(--arwes-error, #f00)',
					info: 'var(--arwes-info, #0cf)',
					text: 'var(--arwes-text, #fff)',
					background: 'var(--arwes-background, #001)',
				},
			},
			backdropFilter: {
				'none': 'none',
				'glass-xs': 'blur(3px) saturate(var(--glass-saturation, 180%))',
				'glass-sm': 'blur(8px) saturate(var(--glass-saturation, 180%))',
				'glass': 'blur(var(--glass-blur, 12px)) saturate(var(--glass-saturation, 180%))',
				'glass-lg': 'blur(16px) saturate(var(--glass-saturation, 180%))',
				'glass-xl': 'blur(24px) saturate(var(--glass-saturation, 180%))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			boxShadow: {
				'glass-xs': '0 4px 16px rgba(31, 38, 135, 0.08)',
				'glass-sm': '0 8px 24px rgba(31, 38, 135, 0.12)',
				'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
				'glass-lg': '0 12px 40px rgba(31, 38, 135, 0.25)',
				'glass-xl': '0 16px 48px rgba(31, 38, 135, 0.35)',
				'glass-dark-xs': '0 4px 16px rgba(0, 0, 0, 0.1)',
				'glass-dark-sm': '0 8px 24px rgba(0, 0, 0, 0.15)',
				'glass-dark': '0 8px 32px rgba(0, 0, 0, 0.2)',
				'glass-dark-lg': '0 12px 40px rgba(0, 0, 0, 0.3)',
				'glass-dark-xl': '0 16px 48px rgba(0, 0, 0, 0.4)',
				'glow-sm': '0 0 10px rgba(14, 165, 233, 0.3)',
				'glow': '0 0 15px rgba(14, 165, 233, 0.5)',
				'glow-lg': '0 0 25px rgba(14, 165, 233, 0.7)',
				'neon-sm': '0 0 5px theme(colors.primary.DEFAULT)',
				'neon': '0 0 5px theme(colors.primary.DEFAULT), 0 0 20px theme(colors.primary.DEFAULT)',
				'neon-lg': '0 0 10px theme(colors.primary.DEFAULT), 0 0 30px theme(colors.primary.DEFAULT)',
				'arwes-glow-sm': '0 0 5px var(--arwes-primary)',
				'arwes-glow': '0 0 10px var(--arwes-primary)',
				'arwes-glow-lg': '0 0 20px var(--arwes-primary)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'pulse-beacon': {
					'0%': {
						transform: 'scale(0.95)',
						boxShadow: '0 0 0 0 rgba(255, 255, 255, 0.3)'
					},
					'70%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 10px rgba(255, 255, 255, 0)'
					},
					'100%': {
						transform: 'scale(0.95)',
						boxShadow: '0 0 0 0 rgba(255, 255, 255, 0)'
					}
				},
				'pulse-ring': {
					'0%': {
						transform: 'scale(0.85)',
						opacity: '0.6',
						boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.2)'
					},
					'50%': {
						opacity: '0.2'
					},
					'100%': {
						transform: 'scale(1.3)',
						opacity: '0',
						boxShadow: '0 0 0 10px rgba(14, 165, 233, 0)'
					}
				},
				'pulse-slow': {
					'0%, 100%': {
						opacity: '0.4'
					},
					'50%': {
						opacity: '0.8'
					}
				},
				'shimmer': {
					'0%': {
						backgroundPosition: '-500px 0'
					},
					'100%': {
						backgroundPosition: '500px 0'
					}
				},
				'float': {
					'0%, 100%': {
						transform: 'translateY(0)'
					},
					'50%': {
						transform: 'translateY(-10px)'
					}
				},
				'glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 5px rgba(14, 165, 233, 0.3), 0 0 10px rgba(14, 165, 233, 0.2)'
					},
					'50%': {
						boxShadow: '0 0 15px rgba(14, 165, 233, 0.6), 0 0 25px rgba(14, 165, 233, 0.4)'
					}
				},
				'glow': {
					'0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.5), 0 0 10px rgba(14, 165, 233, 0.2)' },
					'100%': { boxShadow: '0 0 10px rgba(14, 165, 233, 0.7), 0 0 20px rgba(14, 165, 233, 0.4)' },
				},
				'glass-shine': {
					'0%': { transform: 'translateX(-100%) translateY(-100%) rotate(30deg)' },
					'100%': { transform: 'translateX(100%) translateY(100%) rotate(30deg)' },
				},
				'arwes-glow-pulse': {
					'0%, 100%': {
						boxShadow: '0 0 5px var(--arwes-primary), 0 0 10px var(--arwes-primary)'
					},
					'50%': {
						boxShadow: '0 0 15px var(--arwes-primary), 0 0 25px var(--arwes-primary)'
					}
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-beacon': 'pulse-beacon 2s infinite',
				'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
				'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
				'shimmer': 'shimmer 3s linear infinite',
				'float': 'float 3s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite alternate',
				'glass-shine': 'glass-shine 8s ease-in-out infinite',
				'arwes-glow-pulse': 'arwes-glow-pulse 2s ease-in-out infinite',
			},
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
