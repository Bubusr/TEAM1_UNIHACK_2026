import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.170.1.31:8000";

type CaptureResult = {
  judgment: {
    score: { total: number; sharpness_lighting: number; cuteness_action: number; theme_match: number };
    outcome: string;
  };
  result: { exp_gained: number; pet: { name: string; species: string; status: string } | null };
};

export default function App() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function capture() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    setError(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error("The camera did not return an image.");
      const response = await fetch(`${API_URL}/v1/captures/${crypto.randomUUID()}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_uri: photo.uri,
          captured_at: new Date().toISOString(),
          device_attestation: "local-demo",
        }),
      });
      if (!response.ok) throw new Error("Capture could not be submitted.");
      setResult((await response.json()) as CaptureResult);
    } catch (captureError) {
      setError(captureError instanceof Error ? captureError.message : "Capture failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!permission) return <LoadingScreen />;
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.eyebrow}>PAWVERSE / SNAP</Text>
          <Text style={styles.title}>Meet today’s mission</Text>
          <Text style={styles.body}>PawVerse needs your camera to capture a real animal. Gallery photos are not accepted.</Text>
          <Pressable style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryText}>Allow camera</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (result) {
    const pet = result.result.pet;
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.eyebrow}>JUDGMENT COMPLETE</Text>
          <Text style={styles.score}>{result.judgment.score.total}</Text>
          <Text style={styles.scoreLabel}>/ 100</Text>
          <Text style={styles.title}>{pet ? `New pet: ${pet.name}` : "Adoption failed"}</Text>
          <Text style={styles.body}>
            {pet ? "Your first pet is ready in your collection." : "Try a clearer, happier animal moment."} EXP +{result.result.exp_gained}
          </Text>
          <Pressable style={styles.secondaryButton} onPress={() => setResult(null)}>
            <Text style={styles.secondaryText}>Capture again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.cameraShell}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={styles.overlay}>
          <View>
            <Text style={styles.eyebrow}>DAILY THEME / 01</Text>
            <Text style={styles.mission}>A curious moment</Text>
            <Text style={styles.hint}>Find an animal looking, playing, or exploring.</Text>
          </View>
          <View>
            {error && <Text style={styles.error}>{error}</Text>}
            <Pressable style={styles.shutter} onPress={capture} disabled={busy}>
              <View style={styles.shutterInner} />
            </Pressable>
            <Text style={styles.shutterLabel}>{busy ? "ANALYZING..." : "LIVE CAMERA ONLY"}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return <SafeAreaView style={styles.safeArea}><View style={styles.center}><Text style={styles.body}>Preparing camera...</Text></View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10231D" },
  cameraShell: { flex: 1, margin: 14, overflow: "hidden", borderRadius: 28 },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFill, justifyContent: "space-between", padding: 24 },
  center: { flex: 1, justifyContent: "center", padding: 28 },
  eyebrow: { color: "#F6C85F", fontSize: 12, fontWeight: "800", letterSpacing: 1.8 },
  mission: { color: "#FFF9EC", fontSize: 32, fontWeight: "800", marginTop: 8 },
  title: { color: "#FFF9EC", fontSize: 38, fontWeight: "800", lineHeight: 44, marginTop: 14 },
  body: { color: "#C9D8CE", fontSize: 17, lineHeight: 25, marginTop: 16 },
  hint: { color: "#E8F4EA", fontSize: 15, marginTop: 8 },
  score: { color: "#F6C85F", fontSize: 92, fontWeight: "900", marginTop: 18 },
  scoreLabel: { color: "#C9D8CE", fontSize: 16 },
  primaryButton: { backgroundColor: "#F6C85F", borderRadius: 16, marginTop: 30, padding: 17, alignItems: "center" },
  primaryText: { color: "#10231D", fontSize: 16, fontWeight: "800" },
  secondaryButton: { borderColor: "#F6C85F", borderRadius: 16, borderWidth: 1, marginTop: 30, padding: 16, alignItems: "center" },
  secondaryText: { color: "#F6C85F", fontSize: 16, fontWeight: "800" },
  shutter: { alignSelf: "center", backgroundColor: "#FFF9EC", borderColor: "#F6C85F", borderRadius: 42, borderWidth: 5, height: 84, padding: 7, width: 84 },
  shutterInner: { backgroundColor: "#F6C85F", borderRadius: 32, flex: 1 },
  shutterLabel: { color: "#FFF9EC", fontSize: 11, fontWeight: "800", marginTop: 10, textAlign: "center", letterSpacing: 1 },
  error: { color: "#FFB4A8", fontSize: 13, marginBottom: 10, textAlign: "center" },
});
