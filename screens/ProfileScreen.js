import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth } from "../firebase";
import { useAuth, upload } from "../firebase";
import { Buffer } from "buffer";
import { toByteArray } from "base64-js";

export default function ProfileScreen() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoBytes, setPhotoBytes] = useState(null);
  const currentUser = useAuth();

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access media library denied");
      }
    })();
  }, []);

  useEffect(() => {
    if (auth.currentUser && auth.currentUser.photoURL !== null) {
      setPhotoURL(`data:image/jpeg;base64,${auth.currentUser.photoURL}`);
      console.log(photoURL);
    }
  }, [currentUser]);

  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        // let my_bytes = Buffer.from(result.assets[0].base64, "base64");
        // const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`; // Get the base64 image string
        // const response = await upload(my_bytes, auth.currentUser, setLoading);
        // // const photoURL = await response.ref.getDownloadURL();
        // setPhotoURL(base64Image);
        upload(result.assets[0].uri);
      }
    } catch (error) {
      console.log("Error while uploading image:", error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Hello, profile screen?</Text>
      <TouchableOpacity
        disabled={loading}
        onPress={handleImageUpload}
        style={styles.uploadView}
      >
        <Text style={styles.uploadTxt}>Upload Image</Text>
      </TouchableOpacity>
      {photoURL !== null && (
        <Image key={photoURL} source={{ uri: photoURL }} style={styles.image} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
});
