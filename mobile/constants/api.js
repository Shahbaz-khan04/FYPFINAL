import { NativeModules, Platform } from "react-native";

const getDevApiUrl = () => {
  const scriptURL = NativeModules.SourceCode?.scriptURL || "";
  const match = scriptURL.match(/https?:\/\/([^/:]+)/);
  const host = match?.[1];

  if (!host) return null;

  if (Platform.OS === "android" && (host === "localhost" || host === "127.0.0.1")) {
    return "http://10.0.2.2:5001/api";
  }

  return `http://${host}:5001/api`;
};

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || getDevApiUrl() || "http://localhost:5001/api";
