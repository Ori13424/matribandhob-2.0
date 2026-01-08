/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {}, // This MUST match the package you installed
    autoprefixer: {},
  },
};

export default config;