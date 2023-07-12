import React, { useEffect, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, upload } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { addDoc, query, where, collection, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import TripkoSlika from "../components/images/navbar-logo.png";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes, getStorage } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

const LOGO_IMAGE = Image.resolveAssetSource(TripkoSlika).uri;
const storage = getStorage();

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surename, setSurename] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  const [register, setRegister] = useState(false);

  const navigation = useNavigation();

  const handleChooseProfilePicture = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access media library denied");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.cancelled) {
        setProfilePicture(result.uri);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const uploadImage = async (userID) => {
    if (profilePicture !== null && userID) {
      try {
        const imageRef = ref(storage, `images/${userID}.jpg`);
        const response = await fetch(profilePicture);
        const blob = await response.blob();
        await uploadBytes(imageRef, blob);

        // Get the download URL of the uploaded image
        const downloadURL = await getDownloadURL(imageRef);
        // Update the user's profile with the photoURL
        await updateProfile(auth.currentUser, {
          photoURL: downloadURL,
        });

        console.log("Image uploaded and user profile updated successfully");
      } catch (error) {
        console.log("Error uploading image:", error);
      }
    }
  };

  const handleLogin = async (e) => {
    let email = "";
    let passwordLogin = "";
    const profilesRef = collection(db, "profile");
    const q = query(profilesRef, where("username", "==", `${username}`));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      email = doc.data().email;
      passwordLogin = doc.data().password;
    });
    console.log({ email, passwordLogin });
    if (password === passwordLogin) {
      signInWithEmailAndPassword(auth, email, passwordLogin)
        .then((userCredentials) => {
          const user = userCredentials.user;
          console.log("Logged in!", user.email);
        })
        .catch((error) => {
          console.log(error.message);
        });
    } else {
      alert("The password is incorrect, please try again.");
    }
  };
  const handleSignUp = async () => {
    if (!username || !password || !name || !surename || !email) {
      alert("Input all the data");
      return;
    }

    try {
      const userCredentials = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const registerObject = {
        username,
        password,
        email,
        name,
        surename,
        points: 0,
        userID: userCredentials.user.uid,
      };

      const profilesRef = collection(db, "profile");
      await addDoc(profilesRef, registerObject);

      // Call uploadImage after the user is created and the document is added
      await uploadImage(userCredentials.user.uid);

      console.log("User registered and profile updated successfully");
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.inputContainer}>
        <Image
          key={TripkoSlika}
          source={require("../components/images/navbar-logo.png")}
          style={styles.image}
        />
        {!register ? (
          <View>
            <TextInput
              placeholder="Username"
              style={styles.input}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
              }}
            />
            <TextInput
              placeholder="Password"
              style={styles.input}
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry
            />
          </View>
        ) : (
          <View>
            <TouchableOpacity onPress={handleChooseProfilePicture}>
              <View style={styles.profilePictureContainer}>
                {profilePicture ? (
                  <Image
                    source={{ uri: profilePicture }}
                    style={styles.profilePicture}
                  />
                ) : (
                  <Text style={styles.profilePictureText}>Add Picture</Text>
                )}
              </View>
            </TouchableOpacity>
            <TextInput
              placeholder="Username"
              style={styles.input}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
              }}
            />
            <TextInput
              placeholder="Password"
              style={styles.input}
              value={password}
              onChangeText={(text) => setPassword(text)}
              secureTextEntry
            />
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={email}
              onChangeText={(text) => setEmail(text)}
            />
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                width: "85%",
                justifyContent: "space-between",
              }}
            >
              <TextInput
                placeholder="Name"
                style={styles.inputRowLeft}
                value={name}
                onChangeText={(text) => setName(text)}
              />
              <TextInput
                placeholder="Surename"
                style={styles.inputRowRight}
                value={surename}
                onChangeText={(text) => setSurename(text)}
              />
            </View>
          </View>
        )}
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => {
            !register ? handleLogin() : handleSignUp();
          }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {register ? "Register" : "Login"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setRegister((prev) => !prev);
          }}
          style={[styles.button, styles.buttonOutline]}
        >
          <Text style={(styles.button, styles.buttonOutlineText)}>
            {!register ? "Register" : "Login"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#98d8fa",
  },
  image: {
    marginBottom: 10,
    marginTop: 80,
    marginRight: 40,
    paddingRight: 40,
    right: 27,
    marginLeft: 0,
  },
  inputContainer: {
    width: "80%",
  },
  input: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  profilePictureContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#fff",
    borderColor: "black",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  profilePictureText: {
    fontSize: 20,
    color: "black",
  },
  inputRowLeft: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 0,
    marginRight: 5,
    borderRadius: 10,
    marginTop: 20,
    width: "57%",
  },
  inputRowRight: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginLeft: 5,
    marginRight: 0,
    borderRadius: 10,
    marginTop: 20,
    width: "57%",
  },
  buttonContainer: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  button: {
    backgroundColor: "#0782f9",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
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
