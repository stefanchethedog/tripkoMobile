import { useNavigation, useRoute } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MonumentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { params } = route;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: params.monumentInfo.title,
    });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Monument Details</Text>
      {/* Treba umesto text-a da ubacim recimo MonumentContent */}
    </SafeAreaView>
  );
}
