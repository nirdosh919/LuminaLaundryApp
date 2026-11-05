import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import type { LocationPoint } from "@/lib/location-search";
import { useAppTheme } from "@/providers/app-theme-provider";
import AddressMapFallback from "./AddressMapFallback";

type ExpoMaps = typeof import("expo-maps");

export default function AddressMap({
  point,
  onPointChange,
}: {
  point: LocationPoint | null;
  onPointChange: (point: LocationPoint) => void;
}) {
  const { colors } = useAppTheme();
  const [maps, setMaps] = useState<ExpoMaps | null>(null);
  const [loadError, setLoadError] = useState(false);
  const androidMapsConfigured =
    Constants.expoConfig?.extra?.maps?.androidConfigured === true;

  useEffect(() => {
    let active = true;
    if (Platform.OS === "web") return;
    import("expo-maps")
      .then((module) => {
        if (active) setMaps(module);
      })
      .catch((error: unknown) => {
        console.error("Native map module is unavailable:", error);
        if (active) setLoadError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!point) {
    return <AddressMapFallback point={point} />;
  }

  if (!maps || (Platform.OS === "android" && !androidMapsConfigured)) {
    return (
      <View>
        <AddressMapFallback point={point} />
        {Platform.OS === "android" && !androidMapsConfigured ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            Android maps are not configured. Add a restricted Google Maps Android key to your build environment, or enter the address manually.
          </Text>
        ) : loadError ? (
          <Text style={[styles.notice, { color: colors.textSecondary }]}>
            Maps need an iOS or Android development build. Your manual address can still be saved.
          </Text>
        ) : null}
      </View>
    );
  }

  const cameraPosition = point
    ? { coordinates: point, zoom: 15 }
    : undefined;

  if (Platform.OS === "ios") {
    const MapView = maps.AppleMaps.View;
    return (
      <View style={styles.map}>
        <MapView
          style={StyleSheet.absoluteFill}
          cameraPosition={cameraPosition}
          markers={[{ id: "pickup", coordinates: point, title: "Pickup address" }]}
          onMapClick={({ coordinates }) => {
            if (typeof coordinates.latitude === "number" &&
                typeof coordinates.longitude === "number") {
              onPointChange({
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
              });
            }
          }}
        />
        <Text
          style={[
            styles.attribution,
            { backgroundColor: colors.modal, color: colors.text },
          ]}
        >
          Map data © Apple Maps · Tap to place pin
        </Text>
      </View>
    );
  }

  const MapView = maps.GoogleMaps.View;
  return (
    <View style={styles.map}>
      <MapView
        style={StyleSheet.absoluteFill}
        cameraPosition={cameraPosition}
        markers={[{ id: "pickup", coordinates: point, title: "Pickup address" }]}
        onMapClick={({ coordinates }) => {
          if (typeof coordinates.latitude === "number" &&
              typeof coordinates.longitude === "number") {
            onPointChange({
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
            });
          }
        }}
        onMarkerClick={(marker) => {
          if (typeof marker.coordinates?.latitude === "number" &&
              typeof marker.coordinates.longitude === "number") {
            onPointChange({
              latitude: marker.coordinates.latitude,
              longitude: marker.coordinates.longitude,
            });
          }
        }}
      />
      <Text
        style={[
          styles.attribution,
          { backgroundColor: colors.modal, color: colors.text },
        ]}
      >
        Map data © Google Maps · Tap to place pin
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 260,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CDD8CE",
  },
  attribution: {
    position: "absolute",
    left: 8,
    bottom: 8,
    borderRadius: 6,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  notice: { fontSize: 11, marginTop: 7, textAlign: "center" },
});

