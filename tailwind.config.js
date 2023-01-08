const production = !process.env.ROLLUP_WATCH;
module.exports = {
  darkMode: false, // or 'media' or 'class'
  future: {
    purgeLayersByDefault: true,
    removeDeprecatedGapUtilities: true,
  },
  theme: {
    extend: {
      colors: {
        primary: '#0e639c',
        highlight: '#3794ff',
        screen: '#1e1e1e',
      },
    },
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
