import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import MapView, { Callout, Marker } from "react-native-maps";
import { auth, db } from "../firebase";
import { AntDesign } from "@expo/vector-icons";
import {
  getDocs,
  collection,
  addDoc,
  GeoPoint,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { FontAwesome } from "@expo/vector-icons";
import * as Location from "expo-location";
import {
  TextInput,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";

// AIzaSyAoYI_EL7WP1mPL-ZQ_iboCGZocxaGNjOA google maps API
//koordinate markera: coordinate= {{latitude: lat, longitude: long}}
const markersCollectionRefs = collection(db, "monument");
const userProfileCollectionRefs = collection(db, "profile");

export default function MapScreen() {
  const [markers, setMarkers] = useState([]);
  const [userProfiles, setUserProfiles] = useState([]);
  const [loadingMarkers, setLoadingMarkers] = useState(false);
  const [userProfilesLoaded, setUserProfilesLoaded] = useState(false);
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [rerenderMarker, setRerenderMarker] = useState(true);
  const [markerIdChange, setMarkerIdChange] = useState(null);
  const [changeMarker, setChangeMarker] = useState(false);
  const [changing, setChanging] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [currentLocationLoaded, setCurrentLocationLoaded] = useState(false);
  const [windowVisible, setWindowVisible] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  const mapRef = useRef(0);
  const bottomWindowHeight = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Map",
    });
  }, []);
  const handleButtonClick = () => {
    if (!windowVisible) {
      setWindowVisible(true);
    }
    if (changing) {
      setChangeMarker(true);
    }
    const targetHeight = windowVisible ? 0 : -40;

    Animated.spring(bottomWindowHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && targetHeight === 0 && windowVisible) {
        setWindowVisible(false);
      }
    });
  };
  const handleCloseWindow = () => {
    setWindowVisible(false);
    setChangeMarker(false);
    setChanging(false);
    setMarkerIdChange(null);
    Animated.spring(bottomWindowHeight, {
      toValue: 0,
      useNativeDriver: false,
    }).start(() => {});
  };
  useEffect(() => {
    // Start the interval when the component mounts
    const intervalId = setInterval(getUserLocation, 1000);
    // Clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);

  const handleCurrentLocationPress = () => {
    if (currentUserLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: currentUserLocation.latitude,
        longitude: currentUserLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Permission to location not granted");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setCurrentUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    setRerenderMarker(false);
    setRerenderMarker(true);
    setCurrentLocationLoaded(true);
  };
  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    const getMarkers = async () => {
      try {
        setLoadingMarkers(true);
        const data = await getDocs(markersCollectionRefs);
        const filteredData = data.docs.map((doc) => {
          return {
            ...doc.data(),
            id: doc.id,
          };
        });
        setMarkers(filteredData);
        setLoadingMarkers(false);
        setMarkersLoaded(true);
      } catch (error) {
        setLoadingMarkers(false);
        console.error(error);
      }
    };
    getMarkers();

    const getUserProfiles = async () => {
      try {
        const data = await getDocs(userProfileCollectionRefs);
        const users = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));
        setUserProfiles(users);

        setUserProfilesLoaded(true);
      } catch (error) {
        console.error(error);
      }
    };

    const unsubscribe = onSnapshot(markersCollectionRefs, (snapshot) => {
      getUserProfiles();
      const updatedMarkers = snapshot.docs.map((doc) => {
        return {
          ...doc.data(),
          id: doc.id,
        };
      });
      setMarkers(updatedMarkers);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // useEffect(() => {
  //   const getUserProfiles = async () => {
  //     try {
  //       const data = await getDocs(userProfileCollectionRefs);
  //       const users = data.docs.map((doc) => ({
  //         ...doc.data(),
  //         id: doc.id,
  //       }));
  //       setUserProfiles(users);
  //       setMarkers((prevMarkers) =>
  //         prevMarkers.map((marker) => {
  //           const userProfile = users.find(
  //             (user) => user.userID === marker.userID
  //           );
  //           return {
  //             ...marker,
  //             user: userProfile,
  //           };
  //         })
  //       );
  //       setUserProfilesLoaded(true);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   };
  //   getUserProfiles();
  // }, [markersLoaded, markers]);

  const handleFormSubmit = async () => {
    const name = nameInput;
    const city = cityInput;
    const description = descriptionInput;
    const currUser = auth.currentUser.uid;
    const obj = {
      city,
      creationDate: new Date().toDateString(),
      description,
      location: new GeoPoint(
        currentUserLocation.latitude,
        currentUserLocation.longitude
      ),
      name,
      userID: currUser,
    };
    //da dodamo obj u monument kolekciju
    await addDoc(markersCollectionRefs, obj);

    //da dodamo 10 poena useru
    const prevProfile = userProfiles.find((user) => {
      return user.userID === currUser;
    });

    const profileToUpdate = await doc(db, "profile", prevProfile.id);
    await updateDoc(profileToUpdate, { points: (prevProfile.points += 10) });
  };

  async function deleteMonument(id) {
    const monumentDoc = doc(db, "monument", id);
    await deleteDoc(monumentDoc);

    const prevProfile = userProfiles.find((user) => {
      return user.userID === auth.currentUser.uid;
    });

    const profileToUpdate = await doc(db, "profile", prevProfile.id);
    await updateDoc(profileToUpdate, { points: (prevProfile.points -= 10) });
  }
  function handleChangeForm() {
    console.log("this guy");
  }

  return (
    <View style={{ flex: 1 }}>
      {currentLocationLoaded ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: currentUserLocation.latitude,
            longitude: currentUserLocation.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          {rerenderMarker && (
            <Marker
              coordinate={{
                latitude: currentUserLocation.latitude,
                longitude: currentUserLocation.longitude,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={-45}
            >
              <FontAwesome name="location-arrow" size={24} color="black" />
            </Marker>
          )}
          {markersLoaded && userProfilesLoaded
            ? markers.map((marker) => {
                const coordinateMarker = {
                  latitude: marker.location.latitude,
                  longitude: marker.location.longitude,
                };
                const user = marker.user;
                return (
                  <Marker
                    key={marker.id} // Add a unique key prop
                    coordinate={coordinateMarker}
                    title={marker.name}
                    onPress={() => {
                      if (
                        userProfiles.find(
                          (user) => user.userID === marker.userID
                        ).userID == auth.currentUser.uid
                      ) {
                        setChanging(true);
                        setMarkerIdChange(marker.id);
                      }
                    }}
                  >
                    <Callout style={styles.callout} accessible={false}>
                      <Text style={styles.calloutText}>
                        Title: {marker.name}
                      </Text>
                      <Text style={styles.calloutText}>
                        City: {marker.city}
                      </Text>
                      <Text style={styles.calloutText}>
                        Description: {marker.description}
                      </Text>
                      {marker.userID && (
                        <View>
                          <Text style={styles.calloutText}>
                            name:
                            {`${
                              userProfiles.find(
                                (user) => user.userID === marker.userID
                              ).name
                            } ${
                              userProfiles.find(
                                (user) => user.userID === marker.userID
                              ).surename
                            }`}
                          </Text>
                        </View>
                      )}
                    </Callout>
                  </Marker>
                );
              })
            : null}
        </MapView>
      ) : (
        <View
          style={{ flex: 1, position: "absolute", top: "50%", left: "40%" }}
        >
          <Text>The map is loading.</Text>
        </View>
      )}
      {!windowVisible && (
        <View>
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={handleButtonClick}
          >
            {!changing ? (
              <FontAwesome name="plus" size={24} color="white" />
            ) : (
              <AntDesign name="setting" size={24} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonCurrentLocation}
            onPress={handleCurrentLocationPress}
          >
            <View>
              <MaterialIcons name="my-location" size={24} color="white" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {windowVisible && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCloseWindow}
        >
          <FontAwesome name="times" size={24} color="black" />
        </TouchableOpacity>
      )}
      {windowVisible && (
        <View>
          <Animated.View
            style={[
              {
                height: bottomWindowHeight.interpolate({
                  inputRange: [-40, 0],
                  outputRange: ["40%", "0%"],
                  extrapolate: "clamp",
                }),
              },
            ]}
          >
            {!changeMarker ? (
              <View style={styles.windowContent} pointerEvents="box-none">
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  onChangeText={(text) => setNameInput(text)}
                  value={nameInput}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  onChangeText={(text) => setDescriptionInput(text)}
                  value={descriptionInput}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  onChangeText={(text) => setCityInput(text)}
                  value={cityInput}
                />
              </View>
            ) : (
              <View style={styles.windowContent} pointerEvents="box-none">
                <Text style={styles.centerText}> Changing marker</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  onChangeText={(text) => setNameInput(text)}
                  value={nameInput}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Description"
                  onChangeText={(text) => setDescriptionInput(text)}
                  value={descriptionInput}
                />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  onChangeText={(text) => setCityInput(text)}
                  value={cityInput}
                />
              </View>
            )}
          </Animated.View>
          {windowVisible && !changeMarker ? (
            <View style={styles.buttonContain}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleFormSubmit}
              >
                <Text style={styles.buttonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            changeMarker && (
              <View style={styles.buttonContain}>
                <TouchableOpacity
                  style={styles.buttonCancel}
                  onPress={() => {
                    handleCloseWindow();
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonDelete}
                  onPress={() => {
                    deleteMonument(markerIdChange);
                    handleCloseWindow();
                  }}
                >
                  <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonChange}
                  onPress={() => {
                    handleChangeForm();
                  }}
                >
                  <Text style={styles.buttonText}>Change</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  text: {
    fontSize: 20,
    marginBottom: 20,
  },
  centerText: {
    fontSize: 25,
    alignSelf: "center",
  },
  floatingButton: {
    position: "absolute",
    bottom: 63,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: "#0571ff",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonCurrentLocation: {
    position: "absolute",
    bottom: 135,
    right: 26,
    backgroundColor: "#aaaaaa",
    borderRadius: 50,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  hoverWindow: {
    position: "absolute",
    bottom: 100,
    right: 20,
    width: 200,
    height: 100,
    backgroundColor: "white",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  hoverWindowText: {
    fontSize: 16,
  },
  callout: {
    width: 300,
    position: "relative",
    zIndex: 0,
  },
  calloutText: {
    fontSize: 16,
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  closeButton: {
    position: "absolute",
    top: 530,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    zIndex: 100,
  },
  windowContent: {
    flex: 1,
  },
  input: {
    height: 40,
    borderColor: "gray",
    backgroundColor: "white",
    borderWidth: 1,
    marginTop: 5,
    marginBottom: 2,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  buttonContain: {
    position: "absolute",
    width: "100%",
    height: "25%",
    display: "flex",
    bottom: 10,
    right: 5,
    alignItems: "center",
    flexDirection: "row-reverse",
  },
  button: {
    backgroundColor: "blue",
    height: "100%",
    width: "100%",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonCancel: {
    backgroundColor: "gray",
    borderRadius: 8,
    paddingHorizontal: 37,
    marginHorizontal: 23,
    paddingVertical: 10,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonDelete: {
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 37,
    marginHorizontal: 23,
    paddingVertical: 10,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonChange: {
    backgroundColor: "blue",
    borderRadius: 8,
    paddingHorizontal: 37,
    paddingVertical: 10,
    marginHorizontal: 23,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  deleteButton: {
    backgroundColor: "red",
    position: "relative",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: "center",
    zIndex: 1,
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
  },
  changeButton: {
    backgroundColor: "#0782f9",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: "center",
    position: "relative",
    zIndex: 1,
  },
  changeButtonText: { color: "white", fontSize: 16 },
});
