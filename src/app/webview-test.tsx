import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WebViewTestScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: "https://luminalaundry.com/" }}
        style={styles.webview}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#214738" />
          </View>
        )}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFDFA",
  },
  webview: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFDFA",
  },
});
