import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable } from "react-native";
import MonumentContent from "./MonumentContent";

const Monument = ({ monumentInfo, userInfo }) => {
  const { navigate } = useNavigation();
  return (
    <Pressable
      onPress={() => {
        navigate("MonumentDetailsScreen", {
          monumentInfo,
          userInfo,
        });
      }}
    >
      <MonumentContent monumentInfo={monumentInfo} userInfo={userInfo} />
    </Pressable>
  );
};

export default Monument;
