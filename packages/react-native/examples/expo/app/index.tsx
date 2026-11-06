import { conty } from "@conty/react-native";
import { Button, View } from "react-native";

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Button
        title="Comprar"
        onPress={() => conty.track("begin_checkout", { product: "camiseta-azul" })}
      />
    </View>
  );
}
