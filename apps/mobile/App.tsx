import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.eyebrow}>PAWVERSE</Text>
        <Text style={styles.title}>A tiny world for every real-world pet.</Text>
        <Text style={styles.body}>
          Slice 0 is ready. Camera capture, the daily theme, and your first pet arrive in Slice 1.
        </Text>
        <View style={styles.status}>
          <Text style={styles.statusTitle}>FOUNDATION ONLINE</Text>
          <Text style={styles.statusBody}>Local services and app shell are connected.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10231D" },
  container: { flex: 1, justifyContent: "center", padding: 28 },
  eyebrow: { color: "#F6C85F", fontSize: 13, fontWeight: "700", letterSpacing: 2 },
  title: { color: "#FFF9EC", fontSize: 42, fontWeight: "800", lineHeight: 47, marginTop: 16 },
  body: { color: "#C9D8CE", fontSize: 17, lineHeight: 25, marginTop: 20 },
  status: { backgroundColor: "#1C392E", borderRadius: 18, marginTop: 38, padding: 18 },
  statusTitle: { color: "#9FE3B7", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  statusBody: { color: "#E8F4EA", fontSize: 15, marginTop: 8 }
});

