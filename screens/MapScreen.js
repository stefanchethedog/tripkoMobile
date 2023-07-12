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
import { Modal } from "react-native";

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
  const [counter, setCounter] = useState(3);
  const [filteredMarkers, setFilteredMarkers] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterUsername, setFilterUsername] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [showAddMarkerModal, setShowAddMarkerModal] = useState(false);
  const [addMarkerName, setAddMarkerName] = useState("");
  const [addMarkerDescription, setAddMarkerDescription] = useState("");
  const [addMarkerCity, setAddMarkerCity] = useState("");
  const [updateMarkerId, setUpdateMarkerId] = useState("");
  const [updateMarkerName, setUpdateMarkerName] = useState("");
  const [updateMarkerDescription, setUpdateMarkerDescription] = useState("");
  const [updateMarkerCity, setUpdateMarkerCity] = useState("");
  const [showUpdateMarkerModal, setShowUpdateMarkerModal] = useState(false);

  const incrementCounter = () => {
    const markersAfterFiltering = markers.filter((marker) => {
      if (counter === 0) {
        return (
          calculateDistance(
            marker.location.latitude,
            marker.location.longitude,
            currentUserLocation.latitude,
            currentUserLocation.longitude
          ) < 150
        );
      } else if (counter === 1) {
        return (
          calculateDistance(
            marker.location.latitude,
            marker.location.longitude,
            currentUserLocation.latitude,
            currentUserLocation.longitude
          ) < 300
        );
      } else if (counter === 2) {
        return true;
      } else if (counter === 3) {
        return (
          calculateDistance(
            marker.location.latitude,
            marker.location.longitude,
            currentUserLocation.latitude,
            currentUserLocation.longitude
          ) < 50
        );
      }
    });
    setFilteredMarkers(markersAfterFiltering);
    if (counter === 3) {
      setCounter(0);
    } else {
      setCounter((prev) => prev + 1);
    }
  };
  const mapRef = useRef(0);
  const bottomWindowHeight = useRef(new Animated.Value(0)).current;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance * 1000; // Convert to meters
  };

  // Helper function to convert degrees to radians
  const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
  };

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Map",
    });
  }, []);
  const handleButtonClick = () => {
    if (changing) {
      setChangeMarker(true);
      const marker = markers.find((marker) => marker.id === markerIdChange);
      setUpdateMarkerName(marker.name);
      setUpdateMarkerCity(marker.city);
      setUpdateMarkerDescription(marker.description);
    } else {
      setShowAddMarkerModal(true);
    }
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
    setTimeout(() => getUserLocation(), 100);
    const intervalId = setInterval(getUserLocation, 5000);
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
        setFilteredMarkers(filteredData);
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
      setFilteredMarkers(updatedMarkers);
      setCounter(3);
    });

    return () => {
      unsubscribe();
    };
  }, []);
  const handleFilterButtonPress = () => {
    setShowFilterModal(true);
  };

  const handleFilterApply = () => {
    const filteredMonuments = filteredMarkers.filter((monument) => {
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
    setFilteredMarkers(filteredMonuments);
    setShowFilterModal(false);
  };

  const handleClearFilter = () => {
    setFilterUsername("");
    setFilterTitle("");
    setFilterCity("");
    setFilteredMarkers(markers);
  };

  const handleFilterCancel = () => {
    setShowFilterModal(false);
  };

  const getTextForState = () => {
    switch (counter) {
      case 0:
        return "50";
      case 1:
        return "150";
      case 2:
        return "300";
      case 3:
        return "∞";
      default:
        return "";
    }
  };
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
    console.log(prevProfile);
    const profileToUpdate = await doc(db, "profile", prevProfile.id);
    await updateDoc(profileToUpdate, { points: (prevProfile.points += 10) });
  };
  const handleAddMarkerButtonPress = () => {
    setShowAddMarkerModal(true);
  };

  const handleCloseAddMarkerModal = () => {
    setShowAddMarkerModal(false);
  };

  const handleUpdateMarker = async () => {
    try {
      const updatedMarker = {
        name: updateMarkerName,
        description: updateMarkerDescription,
        city: updateMarkerCity,
      };
      if (!updateMarkerName || !updateMarkerDescription || !updateMarkerCity) {
        alert("Input all the data");
      }

      const markerDocRef = doc(db, "monument", markerIdChange);
      await updateDoc(markerDocRef, updatedMarker);
      alert("Marker has been changed");
    } catch (error) {
      alert(error);
    }
    setChangeMarker(false);
    setChanging(false);
    setShowUpdateMarkerModal(false);
    setUpdateMarkerId("");
    setUpdateMarkerName("");
    setUpdateMarkerDescription("");
    setUpdateMarkerCity("");
  };

  const handleAddMarker = async () => {
    if (!addMarkerName || !addMarkerDescription || !addMarkerCity) {
      return;
    }
    const name = addMarkerName;
    const city = addMarkerCity;
    const description = addMarkerDescription;
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
    console.log(prevProfile);
    const profileToUpdate = await doc(db, "profile", prevProfile.id);
    await updateDoc(profileToUpdate, { points: (prevProfile.points += 10) });

    setAddMarkerName("");
    setAddMarkerDescription("");
    setAddMarkerCity("");
    setShowAddMarkerModal(false);
  };

  async function deleteMonument(id) {
    const monumentDoc = doc(db, "monument", id);
    await deleteDoc(monumentDoc);

    const prevProfile = userProfiles.find((user) => {
      return user.userID === auth.currentUser.uid;
    });

    const profileToUpdate = await doc(db, "profile", prevProfile.id);
    await updateDoc(profileToUpdate, { points: (prevProfile.points -= 10) });
    setChangeMarker(false);
    setChanging(false);
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
          onPress={() => {}}
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
            ? filteredMarkers.map((marker) => {
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
      <View>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={(e) => {
            e.stopPropagation();
            handleButtonClick();
          }}
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
        <TouchableOpacity
          style={styles.buttonRadiusLocation}
          onPress={incrementCounter}
        >
          <Text style={{ fontSize: 23, fontWeight: "bold", color: "white" }}>
            {getTextForState()}
          </Text>
        </TouchableOpacity>
        <Modal
          visible={showFilterModal}
          animationType="slide"
          transparent={true}
        >
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
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleFilterApply}
                >
                  <Text style={styles.buttonModalText}>Apply</Text>
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
                  <Text style={styles.buttonModalText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showAddMarkerModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Text inputs for adding marker */}
              <TextInput
                style={styles.input}
                placeholder="Marker Title"
                value={addMarkerName}
                onChangeText={setAddMarkerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Marker Description"
                value={addMarkerDescription}
                onChangeText={setAddMarkerDescription}
              />
              <TextInput
                style={styles.input}
                placeholder="Marker City"
                value={addMarkerCity}
                onChangeText={setAddMarkerCity}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleAddMarker}
                >
                  <Text style={styles.buttonModalText}>Add Marker</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCloseAddMarkerModal}
                >
                  <Text style={styles.buttonModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={changeMarker} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Marker Title"
                value={updateMarkerName}
                onChangeText={setUpdateMarkerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Marker Description"
                value={updateMarkerDescription}
                onChangeText={setUpdateMarkerDescription}
              />
              <TextInput
                style={styles.input}
                placeholder="Marker City"
                value={updateMarkerCity}
                onChangeText={setUpdateMarkerCity}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={handleUpdateMarker}
                >
                  <Text style={styles.buttonModalText}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    deleteMonument(markerIdChange);
                  }}
                >
                  <Text style={styles.buttonModalText}>Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setChangeMarker(false);
                    setChanging(false);
                  }}
                >
                  <Text style={styles.buttonModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <TouchableOpacity
          style={styles.floatingFilterButton}
          onPress={handleFilterButtonPress}
        >
          <Text style={styles.buttonFilterText}>Filter</Text>
        </TouchableOpacity>
      </View>
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
  clearButton: {
    backgroundColor: "white",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#0782f9",
    padding: 10,
    alignItems: "center",
    flex: 1,
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
  buttonFilterText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  applyButton: {
    backgroundColor: "#0782f9",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: "red",
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
  buttonModalText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "green",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonClearText: {
    color: "#0782f9",
    fontSize: 18,
    fontWeight: "bold",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 80,
    height: 80,
    backgroundColor: "#0571ff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingFilterButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
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
  buttonCurrentLocation: {
    position: "absolute",
    bottom: 115,
    right: 33,
    backgroundColor: "#aaaaaa",
    borderRadius: 50,
    width: 55,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRadiusLocation: {
    position: "absolute",
    bottom: 33,
    right: 115,
    backgroundColor: "#bababa",
    borderRadius: 50,
    borderColor: "#0571ff",
    width: 55,
    height: 55,
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
    top: 500,
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
    marginTop: 10,
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
    height: "70%",
    width: "98%",
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
