import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import prettier from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

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
      
      // ==========================================
      // CODE QUALITY RULES (Squad Up Standards)
      // ==========================================
      
      // Enforce 300-line limit per file
      'max-lines': ['error', { 
        max: 300, 
        skipBlankLines: true, 
        skipComments: true 
      }],
      
      // Prevent cross-feature imports
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['../features/*', '../../features/*', '../../../features/*'],
            message: 'Cross-feature imports are forbidden. Features should only import from shared/. Use URL params, Context API, or events for cross-feature communication.'
          },
          {
            group: ['@/features/*/*', '!@/features/*/index', '!@/features/*/api', '!@/features/*/hooks', '!@/features/*/schemas'],
            message: 'Only import public API from features (index.js, api/, hooks/, schemas/). Internal components and utils should not be imported directly.'
          }
        ]
      }],
      
      // Enforce component naming convention
      'react/jsx-pascal-case': ['error', {
        allowAllCaps: false,
        allowNamespace: false,
      }],
      
      // Prevent multiple component definitions per file
      'react/no-multi-comp': ['warn', { 
        ignoreStateless: false 
      }],
      
      // Enforce hook dependencies
      'react-hooks/exhaustive-deps': 'warn',
      
      // Prefer const for variables that don't change
      'prefer-const': 'error',
      
      // No var declarations
      'no-var': 'error',
    },
  },
]
