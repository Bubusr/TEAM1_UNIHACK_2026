import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, PanResponder, Platform, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://10.170.1.31:8000";
type Tab = "garden" | "snap" | "profile";
type Pet = { id: string; name: string; species: string; coat: string; exp: number; exp_to_next: number; affection: number; fence_state: string; fence_seconds_remaining: number; actions_today: Record<string, number>; action_limits: Record<string, number>; image_uri?: string | null; kibble: number; crops: number; food: number };

export default function App() {
  const [tab, setTab] = useState<Tab>("garden");
  const [pet, setPet] = useState<Pet | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  async function refreshGarden() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/v1/garden`);
      if (!response.ok) throw new Error(`Garden request failed (${response.status}).`);
      setPet((await response.json()).pet);
      setNotice(null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Garden could not be loaded.");
    } finally { setLoading(false); }
  }
  async function interact(action: string) {
    if (!pet) return;
    const response = await fetch(`${API_URL}/v1/pets/${pet.id}/interactions/${action}`, { method: "POST" });
    if (!response.ok) { setNotice(`Daily ${action} cap reached.`); return; }
    const data = await response.json();
    setPet(data.pet);
    setNotice(`+${data.exp_gained} EXP  •  +${data.affection_gained} affection`);
  }
  useEffect(() => { refreshGarden(); }, []);
  return <SafeAreaView style={styles.safeArea}>
    {tab === "garden" ? <Garden pet={pet} notice={notice} loading={loading} onRetry={refreshGarden} onInteract={interact} onNotice={setNotice} /> : tab === "snap" ? <Snap onDone={() => refreshGarden()} /> : <Profile pet={pet} />}
    <View style={styles.tabs}>
      <IconTab icon="⌂" active={tab === "garden"} onPress={() => setTab("garden")} />
      <IconTab icon="◎" active={tab === "snap"} onPress={() => setTab("snap")} />
      <IconTab icon="☻" active={tab === "profile"} onPress={() => setTab("profile")} />
    </View>
  </SafeAreaView>;
}

function Garden({ pet, notice, loading, onRetry, onInteract, onNotice }: { pet: Pet | null; notice: string | null; loading: boolean; onRetry: () => void; onInteract: (action: string) => void; onNotice: (message: string) => void }) {
  const [selected, setSelected] = useState<"mochi" | "pip" | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [animalsOpen, setAnimalsOpen] = useState(false);
  const [cropWatered, setCropWatered] = useState(false);
  const [sceneSize, setSceneSize] = useState({ width: 0, height: 0 });
  if (loading) return <View style={styles.center}><Text style={styles.body}>Loading your garden...</Text></View>;
  if (!pet) return <View style={styles.center}><Text style={styles.title}>Garden unavailable</Text><Text style={styles.body}>{notice ?? "Check your Wi-Fi connection."}</Text><Pressable style={styles.primaryButton} onPress={onRetry}><Text style={styles.primaryText}>Try again</Text></Pressable></View>;
  return <View style={styles.garden}>
    <View style={styles.header}>
      <View><Text style={styles.eyebrow}>PAWVERSE / GARDEN</Text><Text style={styles.title}>Good morning, friend.</Text></View>
      <View style={styles.headerActions}>
        <Pressable style={styles.wallet} onPress={() => setShopOpen(true)}><View style={styles.coin}><Text style={styles.coinText}>K</Text></View><Text style={styles.walletText}>{pet.kibble}</Text></Pressable>
        <View style={styles.streakCluster}><Text style={styles.streakIcon}>🔥</Text><View><Text style={styles.streak}>1 day</Text><Text style={styles.streakTimer}>{formatTime(pet.fence_seconds_remaining)}</Text></View></View>
      </View>
    </View>
    <View style={styles.scene} onLayout={({ nativeEvent }) => setSceneSize({ width: nativeEvent.layout.width, height: nativeEvent.layout.height })}>
      <View style={styles.farmGrass} /><View style={styles.farmPathVertical} /><View style={styles.farmPathHorizontal} />
      <View style={styles.cropPlot}>
        <Text style={styles.cropRows}>⋮ ⋮ ⋮ ⋮</Text>
        <Text style={styles.cropStatus}>{cropWatered ? "watered" : `${pet.crops} seed${pet.crops === 1 ? "" : "s"}`}</Text>
        <View style={styles.cropActions}>
          <Pressable style={styles.cropButton} onPress={() => { setCropWatered(true); onNotice("Crop watered. Come back after it grows."); }}><Text style={styles.cropButtonText}>💧</Text></Pressable>
          <Pressable style={styles.cropButton} onPress={async () => { if (!cropWatered) { onNotice("Water a seed first."); return; } const response = await fetch(`${API_URL}/v1/garden/grow`, { method: "POST" }); const data = await response.json(); onNotice(response.ok ? data.message : data.detail ?? "Crop could not grow."); if (response.ok) onRetry(); }}><Text style={styles.cropButtonText}>🌾</Text></Pressable>
        </View>
        <Text style={styles.cropButtonLabel}>water / grow</Text>
      </View>
      <Pressable style={styles.barn} onPress={() => setAnimalsOpen(true)}><View style={styles.barnRoof} /><View style={styles.barnDoor} /></Pressable>
      <Pressable style={styles.shopStall} onPress={() => setShopOpen(true)}><View style={styles.shopAwning} /><View style={styles.shopCounter} /><Text style={styles.shopSignText}>SHOP</Text></Pressable>
      <Pressable style={styles.farmPond} onPress={() => onNotice("Drag Mochi to the lake to let them drink.")}><View style={styles.pondHighlight} /><Text style={styles.lakeSparkle}>✦</Text></Pressable>
      <Pressable style={styles.animalPen} onPress={() => setSelected("pip")}><View style={styles.penRail} /><MovingAnimal emoji="🐔" style={styles.penAnimal} /></Pressable>
      <View style={[styles.farmTree, styles.farmTreeOne]}><View style={styles.farmTreeCrown} /><View style={styles.farmTreeTrunk} /></View>
      <View style={[styles.farmTree, styles.farmTreeTwo]}><View style={styles.farmTreeCrown} /><View style={styles.farmTreeTrunk} /></View>
      <DraggablePet bounds={sceneSize} imageUri={pet.image_uri} onDrop={() => { fetch(`${API_URL}/v1/pets/${pet.id}/drink`, { method: "POST" }).then(() => onNotice("Mochi had a refreshing drink.")).catch(() => onNotice("Mochi could not reach the lake.")); }} onPress={() => setSelected("mochi")} />
    </View>
    {notice && <Text style={styles.notice}>{notice}</Text>}
    <PetDetailsModal pet={pet} selected={selected} onClose={() => setSelected(null)} onInteract={onInteract} />
    <AnimalListModal visible={animalsOpen} onClose={() => setAnimalsOpen(false)} onSelect={(animal) => { setAnimalsOpen(false); setSelected(animal); }} />
    <ShopModal pet={pet} visible={shopOpen} onClose={() => setShopOpen(false)} onNotice={onNotice} />
  </View>;
}

function MovingAnimal({ emoji, style }: { emoji: string; style: object }) {
  const motion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(motion, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(motion, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [motion]);
  return <Animated.Text style={[style, { transform: [{ translateX: motion.interpolate({ inputRange: [0, 1], outputRange: [0, 8] }) }, { translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) }] }]}>{emoji}</Animated.Text>;
}

function Profile({ pet }: { pet: Pet | null }) {
  if (!pet) return <View style={styles.center}><Text style={styles.body}>Loading profile...</Text></View>;
  return <View style={styles.profile}><Text style={styles.eyebrow}>PAWVERSE / PROFILE</Text><Text style={styles.profileTitle}>Your farm life</Text><View style={styles.profileCard}><Text style={styles.profileAvatar}>🐾</Text><Text style={styles.profileName}>Pet Keeper</Text><Text style={styles.profileMeta}>Local demo account</Text></View><View style={styles.profileStats}><ProfileStat label="Kibble" value={`${pet.kibble}`} /><ProfileStat label="Food" value={`${pet.food}`} /><ProfileStat label="Seeds" value={`${pet.crops}`} /><ProfileStat label="Fence" value={pet.fence_state} /></View><View style={styles.profileCard}><Text style={styles.cardTitle}>Mochi</Text><Text style={styles.cardBody}>{pet.exp} EXP • {pet.affection}% affection</Text><Text style={styles.cardBody}>Your captured pet lives in the farmhouse.</Text></View></View>;
}

function ProfileStat({ label, value }: { label: string; value: string }) {
  return <View style={styles.profileStat}><Text style={styles.profileStatValue}>{value}</Text><Text style={styles.profileStatLabel}>{label}</Text></View>;
}

function DraggablePet({ bounds, imageUri, onDrop, onPress }: { bounds: { width: number; height: number }; imageUri?: string | null; onDrop: () => void; onPress: () => void }) {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const wandering = useRef<Animated.CompositeAnimation | null>(null);
  const restartWandering = useRef<(() => void) | null>(null);
  useEffect(() => {
    let active = true;
    const startWandering = () => {
      if (!active || !bounds.width || !bounds.height) return;
      const maxX = Math.max(0, bounds.width - 94);
      const maxY = Math.max(0, bounds.height - 94);
      const destinations = Array.from({ length: 5 }, () => ({
        x: Math.random() * maxX,
        y: Math.random() * maxY,
      }));
      const animation = Animated.sequence(destinations.map((destination) => Animated.timing(position, {
        toValue: destination,
        duration: 1800 + Math.random() * 1400,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: false,
      })));
      wandering.current = animation;
      animation.start(({ finished }) => {
        if (finished) startWandering();
      });
    };
    restartWandering.current = () => {
      wandering.current?.stop();
      startWandering();
    };
    position.setValue({
      x: Math.random() * Math.max(0, bounds.width - 94),
      y: Math.random() * Math.max(0, bounds.height - 94),
    });
    startWandering();
    return () => {
      active = false;
      restartWandering.current = null;
      wandering.current?.stop();
    };
  }, [bounds.width, bounds.height, position]);
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => wandering.current?.stop(),
    onPanResponderMove: Animated.event([null, { dx: position.x, dy: position.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.moveY > 420) onDrop();
      Animated.spring(position, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start(() => restartWandering.current?.());
    },
  })).current;
  return <Animated.View {...responder.panHandlers} style={[styles.petAvatar, { transform: position.getTranslateTransform() }]}><Pressable onPress={onPress}>{imageUri ? <Image source={{ uri: imageUri }} style={styles.petImage} /> : <Text style={styles.fallbackPet}>🐱</Text>}</Pressable></Animated.View>;
}

function AnimalListModal({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (animal: "mochi" | "pip") => void }) {
  return <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.petModal}>
    <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}><Text style={styles.closeText}>×</Text></Pressable>
    <Text style={styles.modalTitle}>Farm animals</Text><Text style={styles.modalSubtitle}>Tap an animal to view details.</Text>
    <Pressable style={styles.animalRow} onPress={() => onSelect("mochi")}><Text style={styles.listEmoji}>🐱</Text><View><Text style={styles.shopName}>Mochi</Text><Text style={styles.listMeta}>Cat • orange and white</Text></View></Pressable>
    <Pressable style={styles.animalRow} onPress={() => onSelect("pip")}><Text style={styles.listEmoji}>🐔</Text><View><Text style={styles.shopName}>Pip</Text><Text style={styles.listMeta}>Hen • coop resident</Text></View></Pressable>
  </View></View></Modal>;
}

function ShopModal({ pet, visible, onClose, onNotice }: { pet: Pet; visible: boolean; onClose: () => void; onNotice: (message: string) => void }) {
  async function buy(item: "crop" | "food") {
    const response = await fetch(`${API_URL}/v1/garden/purchase?item=${item}`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) { onNotice(data.detail ?? "Purchase failed."); return; }
    onNotice(`${item === "crop" ? "Crop seed" : "Food"} bought for ${data.price} Kibble.`);
    onClose();
  }

  return <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.petModal}>
    <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}><Text style={styles.closeText}>×</Text></Pressable>
    <Text style={styles.modalTitle}>Farm shop</Text><View style={styles.shopBalance}><View style={styles.coin}><Text style={styles.coinText}>K</Text></View><Text style={styles.shopBalanceText}>{pet.kibble} Kibble available</Text></View><Text style={styles.modalSubtitle}>Spend Kibble earned from petting and playing.</Text>
    <View style={styles.shopRow}><Text style={styles.shopName}>🌱 Crop seed</Text><Pressable style={styles.buyButton} onPress={() => buy("crop")}><Text style={styles.buyText}>5 🪙</Text></Pressable></View>
    <View style={styles.shopRow}><Text style={styles.shopName}>🥣 Ready food</Text><Pressable style={styles.buyButton} onPress={() => buy("food")}><Text style={styles.buyText}>8 🪙</Text></Pressable></View>
    <Text style={styles.modalDescription}>Owned: {pet.crops} seeds • {pet.food} food • {pet.kibble} Kibble</Text>
  </View></View></Modal>;
}

function PetDetailsModal({ pet, selected, onClose, onInteract }: { pet: Pet; selected: "mochi" | "pip" | null; onClose: () => void; onInteract: (action: string) => void }) {
  if (!selected) return null;
  const isMochi = selected === "mochi";
  const expWidth = `${Math.min(100, (pet.exp / pet.exp_to_next) * 100)}%` as `${number}%`;
  return <Modal animationType="slide" transparent visible onRequestClose={onClose}><View style={styles.modalBackdrop}><View style={styles.petModal}>
    <Pressable onPress={onClose} style={styles.closeButton} hitSlop={12}><Text style={styles.closeText}>×</Text></Pressable>
    <Text style={styles.modalEmoji}>{isMochi ? "🐱" : "🐔"}</Text><Text style={styles.modalTitle}>{isMochi ? pet.name : "Pip"}</Text><Text style={styles.modalSubtitle}>{isMochi ? `${pet.species} • ${pet.coat}` : "Hen • farm resident"}</Text>
    {isMochi ? <><View style={styles.detailRow}><Text style={styles.detailLabel}>EXP</Text><Text style={styles.detailValue}>{pet.exp} / {pet.exp_to_next}</Text></View><View style={styles.expBar}><View style={[styles.expFill, { width: expWidth }]} /></View><View style={styles.detailRow}><Text style={styles.detailLabel}>AFFECTION</Text><Text style={styles.detailValue}>{pet.affection}%</Text></View><View style={styles.actions}>{(["feed", "pet", "play"] as const).map((action) => <Pressable key={action} style={styles.action} onPress={() => onInteract(action)}><Text style={styles.actionEmoji}>{action === "feed" ? "🥕" : action === "pet" ? "💚" : "🎾"}</Text><Text style={styles.actionLabel}>{action}</Text><Text style={styles.actionCount}>{pet.actions_today[action]}/{pet.action_limits[action]}</Text></Pressable>)}</View></> : <Text style={styles.modalDescription}>Pip is wandering around the farm. Tap any animal to see their details.</Text>}
  </View></View></Modal>;
}

function Snap({ onDone }: { onDone: (uri: string) => void }) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Find a curious moment");
  async function capture() {
    if (!cameraRef.current || busy) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (!photo?.uri) throw new Error("The camera did not return an image.");
      const response = await fetch(`${API_URL}/v1/captures/${crypto.randomUUID()}/submit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image_uri: photo.uri, captured_at: new Date().toISOString(), device_attestation: "local-demo" }) });
      if (!response.ok) throw new Error("Capture could not be submitted.");
      setMessage("New check-in recorded • fence secured"); onDone(photo.uri);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Capture failed."); } finally { setBusy(false); }
  }
  if (Platform.OS === "web" && typeof window !== "undefined" && !window.isSecureContext) {
    return <View style={styles.center}><Text style={styles.eyebrow}>PAWVERSE / SNAP</Text><Text style={styles.title}>Camera needs a secure browser connection</Text><Text style={styles.body}>On this computer, open the local preview at http://localhost:8082 or use the HTTPS Expo link. Browsers block camera access on a LAN http:// address.</Text><Pressable style={styles.primaryButton} onPress={() => window.location.reload()}><Text style={styles.primaryText}>Reload camera</Text></Pressable></View>;
  }
  if (!permission) return <View style={styles.center}><Text style={styles.body}>Preparing camera...</Text></View>;
  if (!permission.granted) return <View style={styles.center}><Text style={styles.eyebrow}>PAWVERSE / SNAP</Text><Text style={styles.title}>Camera check-in</Text><Text style={styles.body}>Use a live camera photo to protect your streak. Gallery photos are not accepted.</Text><Text style={styles.permissionHint}>{permission.canAskAgain ? "Tap below to allow camera access." : "Camera access is blocked. Open phone settings and allow camera access for Expo Go."}</Text><Pressable style={styles.primaryButton} onPress={requestPermission}><Text style={styles.primaryText}>Allow camera</Text></Pressable></View>;
  return <View style={styles.cameraShell}><CameraView ref={cameraRef} style={styles.camera} facing="back" /><View style={styles.overlay}><View><Text style={styles.eyebrow}>DAILY THEME / 01</Text><Text style={styles.mission}>A curious moment</Text></View><View><Text style={styles.cameraMessage}>{message}</Text><Pressable style={styles.shutter} onPress={capture} disabled={busy}><View style={styles.shutterInner} /></Pressable><Text style={styles.shutterLabel}>{busy ? "ANALYZING..." : "LIVE CAMERA ONLY"}</Text></View></View></View>;
}

function IconTab({ icon, active, onPress }: { icon: string; active: boolean; onPress: () => void }) {
  return <Pressable style={styles.tab} onPress={onPress}><Text style={[styles.tabIcon, active && styles.tabActive]}>{icon}</Text></Pressable>;
}
function formatTime(seconds: number) { return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`; }

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10231D" }, garden: { flex: 1, padding: 10, paddingBottom: 0 }, center: { flex: 1, justifyContent: "center", padding: 28 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 6 }, headerActions: { alignItems: "flex-end", gap: 8 }, eyebrow: { color: "#F6C85F", fontSize: 11, fontWeight: "800", letterSpacing: 1.5 }, title: { color: "#FFF9EC", fontSize: 28, fontWeight: "800", lineHeight: 34, marginTop: 8 }, streakCluster: { alignItems: "center", flexDirection: "row", gap: 7 }, streakIcon: { fontSize: 25 }, streak: { color: "#F6C85F", fontSize: 14, fontWeight: "800" }, streakTimer: { color: "#C9D8CE", fontSize: 11, marginTop: 2 },
  scene: { backgroundColor: "#B3D97A", borderRadius: 24, flex: 1, marginTop: 14, minHeight: 380, overflow: "hidden", position: "relative" }, farmGrass: { backgroundColor: "#83BE68", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 }, farmPathVertical: { backgroundColor: "#D9B982", bottom: 0, left: "47%", position: "absolute", top: 0, width: 36 }, farmPathHorizontal: { backgroundColor: "#D9B982", height: 30, left: 0, position: "absolute", right: 0, top: "38%" },
  cropPlot: { backgroundColor: "#A66D46", borderColor: "#E5C488", borderRadius: 12, borderWidth: 4, height: 150, left: 12, padding: 10, position: "absolute", top: 24, width: 180 }, cropRows: { color: "#6EAD4E", fontSize: 42, letterSpacing: 10, marginTop: 2 }, cropStatus: { color: "#FFF1C7", fontSize: 11, fontWeight: "800", marginTop: 2 }, cropActions: { flexDirection: "row", gap: 8, marginTop: 8 }, cropButton: { alignItems: "center", backgroundColor: "#FFF1C7", borderRadius: 8, height: 34, justifyContent: "center", width: 58 }, cropButtonText: { fontSize: 15 }, cropButtonLabel: { color: "#FFF1C7", fontSize: 9, marginTop: 5 },
  barn: { backgroundColor: "#D86E4B", borderColor: "#F7D49A", borderRadius: 10, borderWidth: 3, height: 118, position: "absolute", right: 14, top: 24, width: 140 }, barnRoof: { backgroundColor: "#8E463F", height: 28, left: -8, position: "absolute", right: -8, top: -12 }, barnDoor: { backgroundColor: "#774536", bottom: 0, height: 52, left: 47, position: "absolute", width: 46 },   shopStall: { backgroundColor: "#C9824B", borderColor: "#F7D49A", borderRadius: 8, borderWidth: 3, height: 88, position: "absolute", right: 14, top: 190, width: 112 }, shopAwning: { backgroundColor: "#F6C85F", height: 22, left: -3, position: "absolute", right: -3, top: -8 }, shopCounter: { backgroundColor: "#774536", bottom: 12, height: 24, left: 12, position: "absolute", right: 12 }, shopSignText: { color: "#10231D", fontSize: 10, fontWeight: "900", position: "absolute", textAlign: "center", top: 30, width: 112 },
  farmPond: { backgroundColor: "#4EABC0", borderColor: "#D1EDC1", borderRadius: 70, borderWidth: 5, bottom: 22, height: 115, left: 18, position: "absolute", width: 190 }, pondHighlight: { backgroundColor: "#B8E9D2", borderRadius: 5, height: 7, left: 38, position: "absolute", top: 28, width: 52 }, lakeSparkle: { color: "#E8F4EA", fontSize: 22, position: "absolute", right: 34, top: 38 }, animalPen: { borderColor: "#D6A36B", borderRadius: 8, borderWidth: 4, bottom: 28, height: 100, position: "absolute", right: 16, width: 150 }, penRail: { backgroundColor: "#D6A36B", height: 6, left: 0, position: "absolute", right: 0, top: 40 }, penAnimal: { fontSize: 36, left: 18, position: "absolute", top: 12 }, farmTree: { height: 58, position: "absolute", width: 54 }, farmTreeOne: { left: 200, top: 24 }, farmTreeTwo: { bottom: 28, right: 190 }, farmTreeCrown: { backgroundColor: "#347B55", borderRadius: 30, height: 50, position: "absolute", width: 54 }, farmTreeTrunk: { backgroundColor: "#8C5D3D", bottom: 0, height: 24, left: 22, position: "absolute", width: 10 },
  petAvatar: { alignItems: "center", height: 94, justifyContent: "center", left: 0, position: "absolute", top: 0, width: 94 }, petImage: { height: 86, resizeMode: "contain", width: 86 }, fallbackPet: { fontSize: 58 }, petShadow: { backgroundColor: "#4E8052", borderRadius: 30, bottom: -8, height: 12, left: 8, opacity: 0.5, position: "absolute", width: 60 },
  card: { backgroundColor: "#183128", borderRadius: 20, marginTop: 14, padding: 16 }, expBar: { backgroundColor: "#10231D", borderRadius: 5, height: 8, marginTop: 12, overflow: "hidden" }, expFill: { backgroundColor: "#F6C85F", height: 8 }, actions: { flexDirection: "row", gap: 8, marginTop: 16 }, action: { alignItems: "center", backgroundColor: "#24483A", borderRadius: 14, flex: 1, padding: 10 }, actionEmoji: { fontSize: 22 }, actionLabel: { color: "#FFF9EC", fontSize: 12, fontWeight: "700", marginTop: 4 }, actionCount: { color: "#9FE3B7", fontSize: 11, marginTop: 2 }, notice: { color: "#F6C85F", fontSize: 13, marginTop: 8, textAlign: "center" },
  tabs: { backgroundColor: "#0D1D18", flexDirection: "row", padding: 6 }, tab: { alignItems: "center", flex: 1, padding: 9 }, tabIcon: { color: "#7D998A", fontSize: 24, fontWeight: "700" }, tabActive: { color: "#F6C85F" }, wallet: { alignItems: "center", backgroundColor: "#24483A", borderRadius: 15, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 7 }, coin: { alignItems: "center", backgroundColor: "#F6C85F", borderRadius: 10, height: 20, justifyContent: "center", width: 20 }, coinText: { color: "#10231D", fontSize: 11, fontWeight: "900" }, walletText: { color: "#FFF9EC", fontSize: 13, fontWeight: "800" }, cameraShell: { flex: 1, margin: 14, overflow: "hidden", borderRadius: 28 }, camera: { flex: 1 }, overlay: { ...StyleSheet.absoluteFill, justifyContent: "space-between", padding: 24 }, mission: { color: "#FFF9EC", fontSize: 32, fontWeight: "800", marginTop: 8 }, cameraMessage: { color: "#FFF9EC", fontSize: 13, marginBottom: 10, textAlign: "center" }, body: { color: "#C9D8CE", fontSize: 17, lineHeight: 25, marginTop: 16 }, permissionHint: { color: "#F6C85F", fontSize: 14, lineHeight: 21, marginTop: 18 }, primaryButton: { backgroundColor: "#F6C85F", borderRadius: 16, marginTop: 30, padding: 17, alignItems: "center" }, primaryText: { color: "#10231D", fontSize: 16, fontWeight: "800" }, shutter: { alignSelf: "center", backgroundColor: "#FFF9EC", borderColor: "#F6C85F", borderRadius: 42, borderWidth: 5, height: 84, padding: 7, width: 84 }, shutterInner: { backgroundColor: "#F6C85F", borderRadius: 32, flex: 1 }, shutterLabel: { color: "#FFF9EC", fontSize: 11, fontWeight: "800", marginTop: 10, textAlign: "center", letterSpacing: 1 },
  shopRow: { alignItems: "center", backgroundColor: "#24483A", borderRadius: 14, flexDirection: "row", justifyContent: "space-between", marginTop: 14, padding: 14 }, shopBalance: { alignItems: "center", alignSelf: "center", backgroundColor: "#24483A", borderRadius: 15, flexDirection: "row", gap: 8, marginTop: 14, paddingHorizontal: 12, paddingVertical: 8 }, shopBalanceText: { color: "#FFF9EC", fontSize: 14, fontWeight: "800" }, shopName: { color: "#FFF9EC", fontSize: 16, fontWeight: "700" }, listMeta: { color: "#C9D8CE", fontSize: 12, marginTop: 3 }, animalRow: { alignItems: "center", backgroundColor: "#24483A", borderRadius: 14, flexDirection: "row", gap: 14, marginTop: 14, padding: 14 }, listEmoji: { fontSize: 32 }, buyButton: { backgroundColor: "#F6C85F", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, buyText: { color: "#10231D", fontWeight: "800" },
  profile: { flex: 1, padding: 24 }, profileTitle: { color: "#FFF9EC", fontSize: 32, fontWeight: "800", marginTop: 8 }, profileCard: { backgroundColor: "#183128", borderRadius: 20, marginTop: 20, padding: 20 }, cardTitle: { color: "#FFF9EC", fontSize: 20, fontWeight: "800" }, cardBody: { color: "#C9D8CE", fontSize: 14, marginTop: 8 }, profileAvatar: { fontSize: 52, textAlign: "center" }, profileName: { color: "#FFF9EC", fontSize: 22, fontWeight: "800", marginTop: 8, textAlign: "center" }, profileMeta: { color: "#C9D8CE", marginTop: 5, textAlign: "center" }, profileStats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 }, profileStat: { backgroundColor: "#24483A", borderRadius: 14, flexGrow: 1, minWidth: "45%", padding: 14 }, profileStatValue: { color: "#F6C85F", fontSize: 18, fontWeight: "800" }, profileStatLabel: { color: "#C9D8CE", fontSize: 12, marginTop: 5 },
  modalBackdrop: { backgroundColor: "rgba(5, 16, 12, 0.72)", flex: 1, justifyContent: "flex-end" }, petModal: { backgroundColor: "#183128", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 26, paddingBottom: 36 }, closeButton: { alignItems: "center", backgroundColor: "#24483A", borderRadius: 18, height: 36, justifyContent: "center", position: "absolute", right: 18, top: 18, width: 36 }, closeText: { color: "#FFF9EC", fontSize: 25 }, modalEmoji: { fontSize: 64, textAlign: "center" }, modalTitle: { color: "#FFF9EC", fontSize: 28, fontWeight: "800", marginTop: 8, textAlign: "center" }, modalSubtitle: { color: "#C9D8CE", fontSize: 14, marginTop: 5, textAlign: "center" }, detailRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 }, detailLabel: { color: "#9FE3B7", fontSize: 11, fontWeight: "800", letterSpacing: 1 }, detailValue: { color: "#FFF9EC", fontSize: 13, fontWeight: "700" }, modalDescription: { color: "#C9D8CE", fontSize: 16, lineHeight: 24, marginTop: 22, textAlign: "center" },
});
