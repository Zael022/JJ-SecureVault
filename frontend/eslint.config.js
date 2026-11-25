// Establece reglas básicas para el código del navegador.
import hooks from 'eslint-plugin-react-hooks';
export default [{ ignores: ['dist/**','node_modules/**'] }, { files: ['**/*.{js,jsx}'], languageOptions: { ecmaVersion: 2022, sourceType: 'module', parserOptions: { ecmaFeatures: { jsx: true } }, globals: { document: 'readonly', window: 'readonly', fetch: 'readonly', URLSearchParams: 'readonly', console: 'readonly' } }, plugins: { 'react-hooks': hooks }, rules: { 'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }], 'no-undef': 'error', 'react-hooks/rules-of-hooks': 'error' } }];
