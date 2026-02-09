import { prefixPluginTranslations } from "@strapi/helper-plugin";

import pluginId from "./pluginId";
import initializer from "./initializer";
import PluginIcon from "./components/PluginIcon";
import PriceCsvPage from "./pages/PriceCsvPage";

export default {
  register(app: any) {
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: "Prices CSV",
      },
      Component: PriceCsvPage,
      permissions: [],
    });

    app.registerPlugin({
      id: pluginId,
      initializer,
      isReady: false,
      name: "Prices CSV",
    });
  },

  bootstrap() {},

  async registerTrads({ locales }: any) {
    const importedTrads = await Promise.all(
      locales.map(async (locale: string) => {
        try {
          const trads = await import(`./translations/${locale}.json`);
          return {
            data: prefixPluginTranslations(trads.default, pluginId),
            locale,
          };
        } catch {
          return { data: {}, locale };
        }
      })
    );

    return importedTrads;
  },
};
