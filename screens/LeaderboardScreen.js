import { Text, View } from "react-native";
import React, { useLayoutEffect } from "react";
import { useNavigation } from "@react-navigation/native";

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Leaderboard",
    });
  }, []);
  return (
    <View>
      <Text>Leaderboard Screen</Text>
    </View>
  );
}
