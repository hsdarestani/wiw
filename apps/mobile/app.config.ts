import type { ConfigContext, ExpoConfig } from "expo/config";
import base from "./app.json";

export default ({ config }: ConfigContext): ExpoConfig => {
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID || process.env.EAS_PROJECT_ID || "";
  return {
    ...config,
    ...base.expo,
    extra: {
      ...base.expo.extra,
      easProjectId: projectId,
      eas: projectId ? { projectId } : undefined,
    },
  } as ExpoConfig;
};
