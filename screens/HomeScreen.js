import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Modal,
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
  const [filterUsername, setFilterUsername] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [filteredMonuments, setFilteredMonuments] = useState([]);

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Home",
      headerTintColor: "white",
      headerTitleAlign: "center",
      headerStyle: {
        backgroundColor: "#0782f9",
      },
      headerTitleStyle: {
        fontWeight: "bold",
        fontSize: 28,
      },
    });
  }, []);

  useEffect(() => {
    const subscriber = onSnapshot(monumentsRef, (snapshot) => {
      const monuments = [];
      snapshot.docs.forEach((snapshot) => {
        monuments.push({ ...snapshot.data(), key: snapshot.id });
      });
      setMonuments(monuments);
      setFilteredMonuments(monuments);
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

  const handleFilterButtonPress = () => {
    setShowFilterModal(true);
  };
  const handleFilterCancel = () => {
    setShowFilterModal(false);
  };
  const handleClearFilter = () => {
    setFilterUsername("");
    setFilterTitle("");
    setFilterCity("");
    setFilteredMonuments(monuments);
  };
  const handleFilterApply = () => {
    const filteredMonuments = monuments.filter((monument) => {
      const { userID, name } = monument;
      const username =
        userProfiles.find((user) => user.userID === userID)?.username || "";

      const usernameMatch = username
        .toLowerCase()
        .includes(filterUsername.toLowerCase());
      const cityMatch = monument.city
        .toLowerCase()
        .includes(filterCity.toLowerCase());
      const titleMatch = name.toLowerCase().includes(filterTitle.toLowerCase());

      return usernameMatch && cityMatch && titleMatch;
    });

    // Update the filtered monuments state
    setFilteredMonuments(filteredMonuments);

    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <View>
          <FlatList
            data={filteredMonuments}
            renderItem={({ item }) => (
              <Monument
                monumentInfo={item}
                userInfo={userProfiles.find(
                  (user) => user.userID === item.userID
                )}
              />
            )}
          />
        </View>
      )}
      <Modal visible={showFilterModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Text inputs for filtering */}
            <TextInput
              style={styles.input}
              placeholder="Filter by username"
              value={filterUsername}
              onChangeText={setFilterUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Filter by title"
              value={filterTitle}
              onChangeText={setFilterTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Filter by city"
              value={filterCity}
              onChangeText={setFilterCity}
            />

            {/* Apply and Cancel buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleFilterApply}
              >
                <Text style={styles.buttonText}>Apply</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearFilter}
              >
                <Text style={styles.buttonClearText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleFilterCancel}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleFilterButtonPress}
      >
        <Text style={styles.buttonText}>Filter</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "red",
    borderRadius: 15,
    width: 90,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "black",
    shadowOpacity: 0.3,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  clearButton: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0782f9",
    padding: 10,
    alignItems: "center",
    flex: 1,
  },

  applyButton: {
    backgroundColor: "#0782f9",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  cancelButton: {
    backgroundColor: "gray",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },

  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonClearText: {
    color: "#0782f9",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 30,
    width: "80%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
});

export default HomeScreen;
