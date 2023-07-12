import "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
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
import MonumentDetailsScreen from "./screens/homeStack/MonumentDetailsScreen";
import { createDrawerNavigator } from "@react-navigation/drawer";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import EditProfileScreen from "./screens/EditProfileScreen";

if (typeof atob === "undefined") {
  global.atob = decode;
}
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const TopTabs = createMaterialTopTabNavigator();

function TopTabsGroup() {
  return (
    <TopTabs.Navigator
      screenOptions={{
        tabBarLabelStyle: {
          textTransform: "capitalize",
          fontWeight: "bold",
        },
        tabBarIndicatorStyle: {
          height: 5,
          borderRadius: 5,
        },
      }}
    >
      <TopTabs.Screen name="MapScreen" component={MapScreen} />
      <TopTabs.Screen name="LeaderboardScreen" component={LeaderboardScreen} />
    </TopTabs.Navigator>
  );
}

function HomeStackGroup() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeScreen"
        component={HomeScreen}
      ></HomeStack.Screen>
      <HomeStack.Screen
        name="MonumentDetailsScreen"
        component={MonumentDetailsScreen}
        options={{ presentation: "modal" }}
      ></HomeStack.Screen>
    </HomeStack.Navigator>
  );
}
function ProfileStackGroup() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
      ></ProfileStack.Screen>
      <ProfileStack.Screen
        name="EditProfileScreen"
        component={EditProfileScreen}
      />
    </ProfileStack.Navigator>
  );
}
function DrawerGroup() {
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }}>
      <Drawer.Screen name="TabGroup" component={TabGroup} />
      <Drawer.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ headerShown: true }}
      />
    </Drawer.Navigator>
  );
}

function TabGroup() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        tabBarIcon: ({ color, focused, size }) => {
          let iconName;
          if (route.name === "HomeStackGroup") {
            iconName = "home";
            return <AntDesign name={iconName} size={size} color={color} />;
          } else if (route.name === "TopTabsGroup") {
            iconName = "map-pin";
            return <Feather name={iconName} size={size} color={color} />;
          } else if (route.name === "ProfileStackGroup") {
            iconName = "user";
            return <AntDesign name={iconName} size={size} color={color} />;
          }
        },
        tabBarActiveTintColor: "#0782f9",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tab.Screen
        name="HomeStackGroup"
        component={HomeStackGroup}
        options={{ headerShown: false, tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="TopTabsGroup"
        component={TopTabsGroup}
        options={{
          title: "Maps/Leaderboard",
          headerTintColor: "white",
          headerTitleAlign: "center",
          headerStyle: {
            backgroundColor: "#0782f9",
          },
          headerTitleStyle: {
            fontWeight: "bold",
            fontSize: 28,
          },
        }}
      />
      <Tab.Screen
        name="ProfileStackGroup"
        component={ProfileStackGroup}
        options={{ headerShown: false, title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [initializing, setInitializing] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserLoggedIn(user ? true : false);
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer theme={DefaultTheme}>
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
