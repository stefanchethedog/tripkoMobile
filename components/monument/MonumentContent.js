import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native";
import { Text } from "react-native";
import { View } from "react-native";
import { Image } from "react-native";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { StyleSheet } from "react-native";
import { auth, db } from "../../firebase";
import { Pressable } from "react-native";
import { collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";

const storage = getStorage();
const monumentRef = collection(db, "monument");

export default function MonumentContent({ monumentInfo, userInfo }) {
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureSet, setProfilePictureSet] = useState(false);

  useEffect(() => {
    async function getPhoto() {
      const imageRef = ref(storage, `images/${userInfo.userID}.jpg`);
      const downloadURL = await getDownloadURL(imageRef);
      setProfilePicture(downloadURL);
      setProfilePictureSet(true);
    }
    getPhoto();
  }, []);

  const [liked, setLiked] = useState(false);

  const toggleLike = () => {
    setLiked(!liked);
  };

  async function handleDeletePost() {
    try {
      const idDelete = monumentInfo.key;
      const monumentDoc = doc(db, "monument", idDelete);
      await deleteDoc(monumentDoc);
      alert("Document deleted");

      const profileToUpdate = await doc(db, "profile", userInfo.id);
      await updateDoc(profileToUpdate, { points: (userInfo.points -= 10) });
    } catch (error) {
      console.error(error);
    }
  }
  return (
    <View>
      {profilePictureSet && (
        <View style={styles.postContainer}>
          <View style={styles.usernameContainer}>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Image style={styles.userImg} source={{ uri: profilePicture }} />
              <Text style={styles.usernameText}>
                {" "}
                @{`${userInfo?.username}`}
              </Text>
            </View>
            {userInfo.userID === auth.currentUser.uid && (
              <Pressable style={styles.userBtn} onPress={handleDeletePost}>
                <Text style={styles.userBtnText}>Delete</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.bodyContainer}>
            <Text style={styles.bodyText}>
              <Text style={styles.bodyTextTitle}>Title:</Text>{" "}
              {`${monumentInfo.name}`}
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.bodyTextTitle}>City:</Text>{" "}
              {`${monumentInfo.city}`}
            </Text>
            <Text style={styles.bodyText}>
              <Text style={styles.bodyTextTitle}>Description:</Text>{" "}
              {`${monumentInfo.description}`}
            </Text>
          </View>
          {userInfo.userID !== auth.currentUser.uid && (
            <View style={{ alignSelf: "center", width: 50, height: 50 }}>
              <TouchableOpacity onPress={toggleLike}>
                <Ionicons
                  name={liked ? "heart" : "heart-outline"}
                  size={30}
                  color={liked ? "red" : "gray"}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  postContainer: {
    borderColor: "black",
    borderWidth: 2,
    marginVertical: 8,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  usernameContainer: {
    padding: 1,
    borderTopEndRadius: 7,
    borderTopLeftRadius: 7,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: "#0782f9",
  },
  userImg: {
    height: 60,
    width: 60,
    borderRadius: 30,
    padding: 1,
  },
  usernameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  bodyContainer: {
    paddingHorizontal: 8,
    paddingBottom: 5,
  },
  bodyTextTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  bodyText: {
    fontSize: 20,
  },
  userBtn: {
    backgroundColor: "red",
    borderWidth: 0,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
  },
  userBtnText: {
    color: "#fff",
  },
});
