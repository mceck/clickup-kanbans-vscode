const production = !process.env.ROLLUP_WATCH;
module.exports = {
  darkMode: false, // or 'media' or 'class'
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
  purge: {
    content: ['./web/**/*.svelte'],
    enabled: production, // disable purge in dev
  },
};
