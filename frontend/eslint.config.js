import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...prettierConfig.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'prettier/prettier': 'error',
      'react/prop-types': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      
      // Task 5.1: File size enforcement (warning stage)
      // Encourages keeping files focused and maintainable
      // Skips blank lines and comments for accurate code-only count
      'max-lines': ['warn', {
        max: 400,              // Maximum 400 lines of actual code
        skipBlankLines: true,  // Don't count blank lines
        skipComments: true     // Don't count comment-only lines
      }],

      // Task 5.2: Import boundary enforcement
      // Prevents cross-feature imports (Feature-Sliced Design principle)
      // Features can only import from:
      //   - Same feature (internal imports)
      //   - @/shared/* (shared utilities)
      //   - @/app/* (app-level providers)
      // This is enforced via import/no-restricted-paths below
      'import/no-restricted-paths': ['error', {
        zones: [
          // game-execution cannot import from other features
          {
            target: './src/features/game-execution',
            from: './src/features',
            except: ['./game-execution'],
            message: 'game-execution feature cannot import from other features. Use @/shared/ instead.'
          },
          // game-scheduling cannot import from other features
          {
            target: './src/features/game-scheduling',
            from: './src/features',
            except: ['./game-scheduling'],
            message: 'game-scheduling feature cannot import from other features. Use @/shared/ instead.'
          },
          // analytics cannot import from other features
          {
            target: './src/features/analytics',
            from: './src/features',
            except: ['./analytics'],
            message: 'analytics feature cannot import from other features. Use @/shared/ instead.'
          },
          // training cannot import from other features
          {
            target: './src/features/training',
            from: './src/features',
            except: ['./training'],
            message: 'training feature cannot import from other features. Use @/shared/ instead.'
          },
          // player-management cannot import from other features
          {
            target: './src/features/player-management',
            from: './src/features',
            except: ['./player-management'],
            message: 'player-management feature cannot import from other features. Use @/shared/ instead.'
          },
          // user-management cannot import from other features
          {
            target: './src/features/user-management',
            from: './src/features',
            except: ['./user-management'],
            message: 'user-management feature cannot import from other features. Use @/shared/ instead.'
          },
          // drill-system cannot import from other features
          {
            target: './src/features/drill-system',
            from: './src/features',
            except: ['./drill-system'],
            message: 'drill-system feature cannot import from other features. Use @/shared/ instead.'
          },
          // reporting cannot import from other features
          {
            target: './src/features/reporting',
            from: './src/features',
            except: ['./reporting'],
            message: 'reporting feature cannot import from other features. Use @/shared/ instead.'
          },
          // settings cannot import from other features
          {
            target: './src/features/settings',
            from: './src/features',
            except: ['./settings'],
            message: 'settings feature cannot import from other features. Use @/shared/ instead.'
          },
          // team-management cannot import from other features
          {
            target: './src/features/team-management',
            from: './src/features',
            except: ['./team-management'],
            message: 'team-management feature cannot import from other features. Use @/shared/ instead.'
          },
          // training-management cannot import from other features
          {
            target: './src/features/training-management',
            from: './src/features',
            except: ['./training-management'],
            message: 'training-management feature cannot import from other features. Use @/shared/ instead.'
          },
        ]
      }],
    },
  },
  // Node.js config files (Vite, Tailwind, Jest, etc.)
  {
    files: ['*.config.js', '*.config.cjs', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
      'no-undef': 'off', // Allow Node.js globals
    },
  },
]
