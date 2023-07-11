import { useNavigation, useRoute } from "@react-navigation/native";
import React, { useEffect, useContext, useState } from "react";
import { updateProfile } from "firebase/auth";
import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db, useAuth } from "../firebase";

export default function EditProfileScreen() {
  const navigate = useNavigation();
  const route = useRoute();
  const storage = getStorage();

  const { params } = route;
  const { userProfile } = params;

  const [name, setName] = useState(userProfile.name);
  const [surname, setSurname] = useState(userProfile.surename);
  const [profilePicture, setProfilePicture] = useState(null);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");

  const [profilePictureChange, setProfilePictureChange] = useState(false);
  const navigation = useNavigation();

  //Slika
  const handleChooseProfilePicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
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
      setProfilePictureChange(true);
    }
  };
  const uploadImage = async () => {
    if (profilePicture) {
      try {
        const imageRef = ref(storage, `images/${auth.currentUser.uid}.jpg`);

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

  const handleSaveProfile = async () => {
    const profileDoc = doc(db, "profile", userProfile.id);
    await updateDoc(profileDoc, { name, surename: surname });
    if (profilePictureChange) uploadImage();
  };

  const handleCancelProfile = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
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
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="person"
          size={24}
          color="gray"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />
      </View>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="person"
          size={24}
          color="gray"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Surname"
          value={surname}
          onChangeText={setSurname}
        />
      </View>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="location-on"
          size={24}
          color="gray"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Country"
          value={country}
          onChangeText={setCountry}
        />
      </View>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="location-city"
          size={24}
          color="gray"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="City"
          value={city}
          onChangeText={setCity}
        />
      </View>
      <View style={styles.inputContainer}>
        <MaterialIcons
          name="phone"
          size={24}
          color="gray"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelProfile}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  profilePictureContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "gray",
    borderBottomWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    flexDirection: "row",
  },
  cancelButton: {
    backgroundColor: "#fff",
    color: "#0782f9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#0782f9",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#0782f9",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#0782f9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
  },
});

/*
cancelButton: {
    backgroundColor: "#fff",
    color: "#0782f9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#0782f9",
    marginRight: 10,
  },
  cancelButtonText: {
    color: "#0782f9",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#0782f9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "white",
    fontSize: 15,
  },
*/
