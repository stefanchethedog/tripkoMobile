import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../firebase";
import { signOut } from "firebase/auth";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import Monument from "../components/monument/Monument";

const profilesRef = collection(db, "profile");
const monumentsRef = collection(db, "monument");

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [monuments, setMonuments] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);

  useEffect(() => {
    const subscriber = onSnapshot(monumentsRef, (snapshot) => {
      const monuments = [];
      snapshot.docs.forEach((snapshot) => {
        monuments.push({ ...snapshot.data(), key: snapshot.id });
      });
      setMonuments(monuments);
    });
    return () => subscriber();
  }, []);

  useEffect(() => {
    const getUserProfiles = async () => {
      try {
        const data = await getDocs(profilesRef);
        const users = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setUserProfiles(users);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    getUserProfiles();
  }, [monuments]);

  return (
    <View>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={monuments}
          renderItem={({ item }) => (
            <Monument
              monumentInfo={item}
              userInfo={userProfiles.find(
                (user) => user.userID === item.userID
              )}
            />
          )}
        />
      )}
    </View>
  );
};

export default HomeScreen;
