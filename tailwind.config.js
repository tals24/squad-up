/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
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
  			// Brand Color System - Complete shade variants
  			'brand-blue': {
  				50: 'hsl(var(--brand-blue-50))',
  				100: 'hsl(var(--brand-blue-100))',
  				200: 'hsl(var(--brand-blue-200))',
  				300: 'hsl(var(--brand-blue-300))',
  				400: 'hsl(var(--brand-blue-400))',
  				500: 'hsl(var(--brand-blue-500))',
  				600: 'hsl(var(--brand-blue-600))',
  				700: 'hsl(var(--brand-blue-700))',
  				800: 'hsl(var(--brand-blue-800))',
  				900: 'hsl(var(--brand-blue-900))',
  				950: 'hsl(var(--brand-blue-950))',
  				DEFAULT: 'hsl(var(--brand-blue-500))',
  				foreground: 'hsl(var(--brand-blue-foreground))'
  			},
  			'brand-yellow': {
  				50: 'hsl(var(--brand-yellow-50))',
  				100: 'hsl(var(--brand-yellow-100))',
  				200: 'hsl(var(--brand-yellow-200))',
  				300: 'hsl(var(--brand-yellow-300))',
  				400: 'hsl(var(--brand-yellow-400))',
  				500: 'hsl(var(--brand-yellow-500))',
  				600: 'hsl(var(--brand-yellow-600))',
  				700: 'hsl(var(--brand-yellow-700))',
  				800: 'hsl(var(--brand-yellow-800))',
  				900: 'hsl(var(--brand-yellow-900))',
  				950: 'hsl(var(--brand-yellow-950))',
  				DEFAULT: 'hsl(var(--brand-yellow-500))',
  				foreground: 'hsl(var(--brand-yellow-foreground))'
  			},
  			'brand-green': {
  				50: 'hsl(var(--brand-green-50))',
  				100: 'hsl(var(--brand-green-100))',
  				200: 'hsl(var(--brand-green-200))',
  				300: 'hsl(var(--brand-green-300))',
  				400: 'hsl(var(--brand-green-400))',
  				500: 'hsl(var(--brand-green-500))',
  				600: 'hsl(var(--brand-green-600))',
  				700: 'hsl(var(--brand-green-700))',
  				800: 'hsl(var(--brand-green-800))',
  				900: 'hsl(var(--brand-green-900))',
  				950: 'hsl(var(--brand-green-950))',
  				DEFAULT: 'hsl(var(--brand-green-500))',
  				foreground: 'hsl(var(--brand-green-foreground))'
  			},
  			'brand-red': {
  				50: 'hsl(var(--brand-red-50))',
  				100: 'hsl(var(--brand-red-100))',
  				200: 'hsl(var(--brand-red-200))',
  				300: 'hsl(var(--brand-red-300))',
  				400: 'hsl(var(--brand-red-400))',
  				500: 'hsl(var(--brand-red-500))',
  				600: 'hsl(var(--brand-red-600))',
  				700: 'hsl(var(--brand-red-700))',
  				800: 'hsl(var(--brand-red-800))',
  				900: 'hsl(var(--brand-red-900))',
  				950: 'hsl(var(--brand-red-950))',
  				DEFAULT: 'hsl(var(--brand-red-500))',
  				foreground: 'hsl(var(--brand-red-foreground))'
  			},
  			'brand-purple': {
  				50: 'hsl(var(--brand-purple-50))',
  				100: 'hsl(var(--brand-purple-100))',
  				200: 'hsl(var(--brand-purple-200))',
  				300: 'hsl(var(--brand-purple-300))',
  				400: 'hsl(var(--brand-purple-400))',
  				500: 'hsl(var(--brand-purple-500))',
  				600: 'hsl(var(--brand-purple-600))',
  				700: 'hsl(var(--brand-purple-700))',
  				800: 'hsl(var(--brand-purple-800))',
  				900: 'hsl(var(--brand-purple-900))',
  				950: 'hsl(var(--brand-purple-950))',
  				DEFAULT: 'hsl(var(--brand-purple-500))',
  				foreground: 'hsl(var(--brand-purple-foreground))'
  			},
  			'brand-orange': {
  				50: 'hsl(var(--brand-orange-50))',
  				100: 'hsl(var(--brand-orange-100))',
  				200: 'hsl(var(--brand-orange-200))',
  				300: 'hsl(var(--brand-orange-300))',
  				400: 'hsl(var(--brand-orange-400))',
  				500: 'hsl(var(--brand-orange-500))',
  				600: 'hsl(var(--brand-orange-600))',
  				700: 'hsl(var(--brand-orange-700))',
  				800: 'hsl(var(--brand-orange-800))',
  				900: 'hsl(var(--brand-orange-900))',
  				950: 'hsl(var(--brand-orange-950))',
  				DEFAULT: 'hsl(var(--brand-orange-500))',
  				foreground: 'hsl(var(--brand-orange-foreground))'
  			}
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}