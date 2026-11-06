import { conty } from "@conty/react-native";
import { Stack } from "expo-router";

conty.init(process.env.EXPO_PUBLIC_CONTY_KEY ?? "");

export default function RootLayout() {
  return <Stack />;
}
