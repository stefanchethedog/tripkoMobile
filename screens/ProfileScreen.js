import React, { useState, useEffect, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../firebase";
import { useAuth, upload } from "../firebase";
import { Buffer } from "buffer";
import { toByteArray } from "base64-js";
import { getAuth, signOut } from "firebase/auth";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getDocs,
  collection,
  where,
  query,
  onSnapshot,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigation } from "@react-navigation/native";

const profileRef = collection(db, "profile");
const monumentsRef = collection(db, "monument");

export default function ProfileScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoBytes, setPhotoBytes] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPostsLikes, setUserPostsLikes] = useState({ posts: 0, likes: 0 });
  const [userDataRetrieved, setUserDataRetrieved] = useState(false);

  const profileImageURL = auth.currentUser?.photoURL;

  const currentUser = useAuth();

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Profile",
      headerTitleAlign: "center",
    });
  }, []);

  const getUserData = async () => {
    setLoading(true);
    setUserProfile(null);
    setUserPostsLikes({ posts: 0, likes: 0 });
    try {
      const q = query(
        profileRef,
        where("userID", "==", getAuth().currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        setUserProfile({ ...doc.data(), id: doc.id });
      });

      const q2 = query(
        monumentsRef,
        where("userID", "==", getAuth().currentUser.uid)
      );
      const querySnapshot2 = await getDocs(q2);
      querySnapshot2.forEach((doc) => {
        setUserPostsLikes((prev) => {
          return {
            posts: prev.posts + 1,
            likes: prev.likes + doc.data().likes ? doc.data().likes : 0,
          };
        });
      });
      console.log(userPostsLikes);

      setUserDataRetrieved(true);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(monumentsRef, async (snapshot) => {
      getUserData();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // useEffect(() => {
  //   if (userProfile && userProfile.id) {
  //     console.log("From useEffect", userProfile);
  //     const unsubscribe = db
  //       .collection("profile")
  //       .doc(userProfile.id)
  //       .onSnapshot((snapshot) => {
  //         if (snapshot.exists) {
  //           setUserProfile({ ...snapshot.data(), id: snapshot.id });
  //         }
  //       });
  //     return () => {
  //       unsubscribe();
  //     };
  //   }
  // }, [userProfile]);

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access media library denied");
      }
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {loading ? (
        <View style={styles.container}>
          <Text>Loading...</Text>
        </View>
      ) : (
        userDataRetrieved && (
          <ScrollView
            contentContainerStyle={{
              justifyContent: "center",
              alignItems: "center",
            }}
            showsVerticalScrollIndicator={false}
          >
            <Image style={styles.userImg} source={{ uri: profileImageURL }} />
            <Text style={styles.userName}> {`${userProfile.username}`}</Text>
            <Text
              style={styles.aboutUser}
            >{`${userProfile.name} ${userProfile.surename}`}</Text>
            <Text style={styles.aboutUser}>{`${userProfile.email}`}</Text>
            <View style={styles.userBtnWrapper}>
              <Pressable
                style={styles.userBtn}
                onPress={() => {
                  navigation.navigate("EditProfileScreen", {
                    userProfile,
                  });
                }}
              >
                <Text style={styles.userBtnText}>Edit</Text>
              </Pressable>
              <TouchableOpacity
                style={styles.userLogoutBtn}
                onPress={() => {
                  signOut(auth);
                }}
              >
                <Text style={styles.userLogoutBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.userInfoWrapper}>
              <View style={styles.userInfoItem}>
                <Text
                  style={styles.userInfoTitle}
                >{`${userPostsLikes.posts}`}</Text>
                <Text style={styles.userInfoSubtitle}> Posts</Text>
              </View>
              <View style={styles.userInfoItem}>
                <Text
                  style={styles.userInfoTitle}
                >{`${userPostsLikes.likes}`}</Text>
                <Text style={styles.userInfoSubtitle}> Likes</Text>
              </View>
              <View style={styles.userInfoItem}>
                <Text
                  style={styles.userInfoTitle}
                >{`${userProfile.points}`}</Text>
                <Text style={styles.userInfoSubtitle}> Points</Text>
              </View>
            </View>
          </ScrollView>
        )
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  text: {
    fontSize: 20,
    color: "#333333",
  },
  userImg: {
    height: 150,
    width: 150,
    borderRadius: 75,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
  },
  aboutUser: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  userBtnWrapper: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginBottom: 10,
  },
  userBtn: {
    borderColor: "#2e64e5",
    borderWidth: 2,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
  },
  userBtnText: {
    color: "#2e64e5",
  },
  userLogoutBtn: {
    backgroundColor: "red",
    borderWidth: 0,
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 5,
  },
  userLogoutBtnText: {
    color: "#fff",
  },
  userInfoWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    borderBottomColor: "black",
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  userInfoItem: {
    justifyContent: "center",
  },
  userInfoTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  userInfoSubtitle: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  uploadView: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#0782f9",
    borderRadius: 10,
  },
  uploadTxt: {
    color: "white",
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginTop: 20,
    borderRadius: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#0782f9",
    width: "60%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 40,
  },
  buttonOutline: {
    backgroundColor: "white",
    marginTop: 5,
    borderColor: "#0782f9",
    borderWidth: 1,
  },
  buttonOutlineText: {
    color: "#0782f9",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});
