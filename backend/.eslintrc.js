module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    'no-console': 'warn',
    'consistent-return': 'off',
    'no-else-return': 'warn',
    'no-empty-function': ['error', { allow: ['constructors'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'warn',
    'quote-props': ['warn', 'as-needed'],
    'array-callback-return': 'error',
    'no-duplicate-imports': 'error',
    'no-unneeded-ternary': 'warn',
    'prefer-object-spread': 'warn',
    'no-param-reassign': 'warn',
    'require-await': 'off',
    'no-promise-executor-return': 'error',
    'no-return-await': 'error',
    'no-throw-literal': 'error',
    'prefer-regex-literals': 'warn',
  },
  overrides: [
    {
      files: ['scripts/**/*.js'],
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
};
