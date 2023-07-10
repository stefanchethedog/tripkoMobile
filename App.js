import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import HomeScreen from "./screens/HomeScreen";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AntDesign, Feather } from "@expo/vector-icons";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import ProfileScreen from "./screens/ProfileScreen";
import MapScreen from "./screens/MapScreen";
import { decode } from "base-64";

if (typeof atob === "undefined") {
  global.atob = decode;
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabGroup() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          tabBarIcon: () => <AntDesign name="home" size={24} color="#0782f9" />,
          tabBarActiveBackgroundColor: "#eaeaea",
        }}
      />
      <Tab.Screen
        name="MapScreen"
        component={MapScreen}
        options={{
          tabBarIcon: () => (
            <Feather name="map-pin" size={24} color="#0782f9" />
          ),
          tabBarActiveBackgroundColor: "#eaeaea",
        }}
      />
      <Tab.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => <AntDesign name="user" size={24} color="#0782f9" />,
          tabBarActiveBackgroundColor: "#eaeaea",
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserLoggedIn(user ? true : false);
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      {userLoggedIn ? (
        <TabGroup />
      ) : (
        <Stack.Navigator>
          <Stack.Screen
            options={{ headerShown: false }}
            name="Login"
            component={LoginScreen}
          />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    borderRadius: 5,
    backgroundColor: "#0782f9",
    width: "100%",
  },
});
