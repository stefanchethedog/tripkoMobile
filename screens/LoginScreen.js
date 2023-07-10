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
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { addDoc, query, where, collection, getDocs } from "firebase/firestore";
import { useNavigation } from "@react-navigation/native";
import TripkoSlika from "../components/images/navbar-logo.png";
const LOGO_IMAGE = Image.resolveAssetSource(TripkoSlika).uri;

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [surename, setSurename] = useState("");

  const [register, setRegister] = useState(false);

  const navigation = useNavigation();
  //   useEffect(() => {
  //     const unsubscribe = onAuthStateChanged(auth, (user) => {
  //       if (user) {
  //         navigation.replace("Home");
  //       }
  //     });
  //     return unsubscribe;
  //   }, []);
  const handleLogin = async (e) => {
    let email = "";
    let password = "";
    const profilesRef = collection(db, "profile");
    const q = query(profilesRef, where("username", "==", `${username}`));

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      email = doc.data().email;
      password = doc.data().password;
    });
    console.log({ email, password });
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log("Logged in!", user.email);
      })
      .catch((error) => {
        console.log(error.message);
      });
  };
  const handleSignUp = () => {
    if (!username || !password || !name || !surename || !email) {
      alert("Input all the data");
      return;
    }
    const profilesRef = collection(db, "profile");

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const registerObject = {
          username,
          password,
          email,
          name,
          surename,
          points: 0,
          userID: userCredentials.user.uid,
        };
        await addDoc(profilesRef, registerObject);
      })
      .catch((error) => {
        console.log(error.message);
      });
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
          <>
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
          </>
        ) : (
          <>
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
          </>
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
    marginBottom: 40,
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
