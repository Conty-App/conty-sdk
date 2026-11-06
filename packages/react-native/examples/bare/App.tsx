import { conty } from "@conty/react-native";
import { Button, View } from "react-native";

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Criar conta" onPress={() => conty.track("sign_up")} />
    </View>
  );
}
