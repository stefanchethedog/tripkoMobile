import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useLayoutEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { FlatList } from "react-native-gesture-handler";
import { ActivityIndicator } from "react-native-web";
import {
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const userProfileCollectionRefs = collection(db, "profile");

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Leaderboard",
    });
  }, []);

  const [data, setData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  useEffect(() => {
    const getUserProfiles = async () => {
      try {
        const q = query(
          userProfileCollectionRefs,
          where("points", ">", 0),
          orderBy("points", "desc")
        );
        const data = await getDocs(q);
        const users = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(users);

        setDataLoaded(true);
      } catch (error) {
        console.error(error);
      }
    };

    getUserProfiles();
    const unsubscribe = onSnapshot(
      query(
        userProfileCollectionRefs,
        where("points", ">", 0),
        orderBy("points", "desc")
      ),
      (snapshot) => {
        const users = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(users);
        setDataLoaded(true);
      },
      (error) => {
        console.error("Error getting user profiles:", error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <View style={{ width: "100%", height: "100%" }}>
      {dataLoaded ? (
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Leaderboard</Text>
          </View>
          <FlatList
            data={data}
            renderItem={({ item, index }) => {
              return (
                <View style={styles.row}>
                  <Text style={styles.position}>{index + 1} </Text>
                  <Text style={styles.username}>{item.username} </Text>
                  <Text style={styles.email}>{item.email}</Text>
                  <Text style={styles.points}>{item.points}</Text>
                </View>
              );
            }}
          />
        </View>
      ) : (
        <View>
          <Text>Loading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottomColor: "black",
    borderBottomWidth: 1,
  },
  position: {
    flex: 1,
    fontSize: 25,
    fontWeight: "bold",
  },
  username: {
    flex: 5,
    fontSize: 18,
  },
  email: {
    flex: 8,
    fontSize: 18,
  },
  name: {
    flex: 2,
  },
  surname: {
    flex: 2,
  },
  points: {
    borderLeftColor: "black",
    borderLeftWidth: 1,
    flex: 1,
    fontSize: 20,
    textAlign: "right",
  },
});
