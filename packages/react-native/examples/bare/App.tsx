import { conty } from "@conty/react-native";
import { Button, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button title="Criar conta" onPress={() => conty.track("sign_up")} />
    </SafeAreaView>
  );
}
