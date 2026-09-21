import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerPushDevice, removePushDevice } from "./api";

const PUSH_TOKEN_KEY = "schichtpro.push-token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPush() {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "SchichtPro",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;
  const projectId = Constants.easConfig?.projectId
    ?? Constants.expoConfig?.extra?.eas?.projectId
    ?? Constants.expoConfig?.extra?.easProjectId;
  if (!projectId) return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await registerPushDevice(token, Platform.OS);
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

export async function unregisterPush() {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token) await removePushDevice(token).catch(() => null);
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}
