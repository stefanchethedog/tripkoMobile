import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import MonumentContent from "./MonumentContent";

const Monument = ({ monumentInfo }) => {
  const { navigate } = useNavigation();
  return (
    <Pressable
      onPress={() => {
        navigate("MonumentDetailScreen", { monumentInfo });
      }}
    >
      <MonumentContent monumentInfo={monumentInfo} />
    </Pressable>
  );
};

export default Monument;
