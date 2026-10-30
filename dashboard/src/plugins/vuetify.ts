import { createVuetify } from 'vuetify';
import { en, ja, ru, zhHans } from 'vuetify/locale';
import '@/assets/mdi-subset/materialdesignicons-subset.css';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { PurpleTheme } from '@/theme/LightTheme';
import { PurpleThemeDark } from "@/theme/DarkTheme";

export default createVuetify({
  components,
  directives,

  // Vuetify ships its own strings for data-table pagination, date pickers and
  // a11y labels. Without them an otherwise translated page still falls back to
  // English ("Items per page", "of") inside tables.
  locale: {
    locale: 'zhHans',
    fallback: 'en',
    messages: { en, ja, ru, zhHans },
  },

  theme: {
    defaultTheme: 'PurpleTheme',
    themes: {
      PurpleTheme,
      PurpleThemeDark
    }
  },
  defaults: {
    VBtn: {},
    VCard: {
      rounded: 'lg'
    },
    VSnackbar: {
      elevation: 6,
      rounded: 'lg'
    },
    VTextField: {
      rounded: 'lg'
    },
    VTooltip: {
      // set v-tooltip default location to top
      location: 'top'
    }
  }
});
