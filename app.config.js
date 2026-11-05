const appJson = require("./app.json");

module.exports = ({ config }) => {
  const apiKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY?.trim();
  const android = {
    ...config.android,
    ...(apiKey
      ? {
          config: {
            ...config.android?.config,
            googleMaps: {
              ...config.android?.config?.googleMaps,
              apiKey,
            },
          },
        }
      : {}),
  };

  return {
    ...appJson.expo,
    ...config,
    android,
    extra: {
      ...appJson.expo.extra,
      ...config.extra,
      maps: { androidConfigured: Boolean(apiKey) },
    },
  };
};
