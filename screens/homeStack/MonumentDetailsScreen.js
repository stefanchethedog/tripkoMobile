import { useNavigation, useRoute } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MonumentContent from "../../components/monument/MonumentContent";
import { View } from "react-native";
import { StyleSheet } from "react-native";
import { Pressable } from "react-native";

export default function MonumentDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { params } = route;
  const { monumentInfo, userInfo } = params;
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: params.monumentInfo.name,
    });
  }, []);

  return (
    <View style={styles.container}>
      <MonumentContent monumentInfo={monumentInfo} userInfo={userInfo} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
