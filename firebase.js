// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, updateProfile } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadString,
} from "firebase/storage";
import { useEffect, useState } from "react";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHL3jbhMV12n16ZkvInCGc2mhU3QP6xzg",
  authDomain: "tripkomobile.firebaseapp.com",
  projectId: "tripkomobile",
  storageBucket: "tripkomobile.appspot.com",
  messagingSenderId: "369468691906",
  appId: "1:369468691906:web:89e3eec3146e87f227725b",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage();
export { auth };

export function useAuth() {
  const [currentUser, setCurrentUser] = useState();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return unsub;
  }, []);
  return currentUser;
}
//Storage
export async function upload(file, currentUser, setLoading) {
  // const fileRef = ref(storage, "images/" + auth.currentUser.uid + ".jpeg");

  // setLoading(true);
  // //const snapshot = await uploadString(fileRef, file, "data_url");
  // const snapshot = await uploadBytes(fileRef,file)
  // const photoURL = await getDownloadURL(fileRef);

  // await updateProfile(auth.currentUser, { photoURL });

  // setLoading(false);
  // alert("File is uploaded: " + photoURL);

  const fetchResponse = await fetch(uri);
  const theBlob = await fetchResponse.blob();
  console.log(theBlob);
}

export const db = getFirestore(app);
