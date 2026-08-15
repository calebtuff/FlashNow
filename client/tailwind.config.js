/** @type {import('tailwindcss').Config} */

/* Every color resolves through the CSS variables in src/index.css so opacity
 * modifiers keep working and the dial can be retuned in one place. */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Dial grounds
        dial: token('dial'),
        raised: token('dial-raised'),
        high: token('dial-high'),
        sunken: token('dial-sunken'),

        // Lume, the only text colors
        lume: {
          DEFAULT: token('lume'),
          dim: token('lume-dim'),
          faint: token('lume-faint'),
        },

        // Engraving: hairlines and ticks. Never a control boundary.
        steel: {
          DEFAULT: token('steel'),
          bright: token('steel-bright'),
        },
        // Control boundaries, held to 3:1.
        edge: token('edge-control'),

        // The three lamps. Each has a law; see index.css.
        radium: {
          DEFAULT: token('radium'),
          track: token('radium-track'),
        },
        caution: {
          DEFAULT: token('caution'),
          track: token('caution-track'),
        },
        hand: {
          DEFAULT: token('hand'),
          track: token('hand-track'),
        },
      },

      fontFamily: {
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        narrow: ['Archivo Narrow', 'Archivo', 'system-ui', 'sans-serif'],
      },

      /* Instrument type scale. The dial numeral is enormous on purpose: the
       * price and the clock are the two things a bidder reads under pressure,
       * and in the old design the price was smaller than the page heading. */
      fontSize: {
        tick: ['0.625rem', { lineHeight: '1', letterSpacing: '0.16em' }],
        legend: ['0.6875rem', { lineHeight: '1.1', letterSpacing: '0.14em' }],
        micro: ['0.75rem', { lineHeight: '1.4' }],
        body: ['0.9375rem', { lineHeight: '1.6' }],
        /* A `lede` rung sat here with exactly one consumer. A ramp step used
         * once is not a system step, so lead sentences use `title`. */
        title: ['1.25rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        register: ['clamp(1.5rem, 3.2vw, 2.25rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        /* Named `readout`, not `dial`. `dial` is already a color, and Tailwind's
         * fontSize and textColor plugins both emit a rule for `text-dial`, so
         * every "dark legend on a lit face" control was silently also getting a
         * 4.5rem font size. Keep these two scales disjoint. */
        readout: ['clamp(2.75rem, 7vw, 4.5rem)', { lineHeight: '0.92', letterSpacing: '-0.04em' }],
      },

      /* Spacing is the tick module: every value a multiple of 4px.
       *
       * The ramp is contiguous through t8 on purpose. A gap here fails
       * silently: Tailwind emits nothing for an undefined key, so `p-t5`
       * rendered as no padding at all across twelve panels, including both
       * auth forms and every dialog, and looked like a design choice. */
      spacing: {
        tick: 'var(--tick)', // 4
        t2: 'calc(var(--tick) * 2)', // 8
        t3: 'calc(var(--tick) * 3)', // 12
        t4: 'calc(var(--tick) * 4)', // 16
        t5: 'calc(var(--tick) * 5)', // 20
        t6: 'calc(var(--tick) * 6)', // 24
        t8: 'calc(var(--tick) * 8)', // 32
        t12: 'calc(var(--tick) * 12)', // 48
        t16: 'calc(var(--tick) * 16)', // 64
      },

      /* Machined edges, not soft cards. The old system used 14px card radii;
       * an instrument panel is cut, not rounded. */
      borderRadius: {
        none: '0px',
        sm: '2px',
        DEFAULT: '3px',
        md: '3px',
        lg: '4px',
        xl: '6px',
        '2xl': '8px',
        full: '9999px',
      },

      /* No drop shadows exist in this world. Depth is engraving. */
      boxShadow: {
        none: 'none',
      },

      transitionTimingFunction: {
        sweep: 'var(--sweep)',
        jump: 'var(--jump)',
        flyback: 'var(--flyback)',
      },

      transitionDuration: {
        press: '90ms',
        jump: '140ms',
        flyback: '260ms',
      },
    },
  },
  plugins: [],
};
