import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../constants/colors";

export default function LaunchSplash() {
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const glow = useRef(new Animated.Value(0.2)).current;
  const sweep = useRef(new Animated.Value(-220)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.25,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(sweep, {
        toValue: 220,
        duration: 1100,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    ).start(() => {
      sweep.setValue(-220);
    });
  }, [fade, glow, scale, sweep]);

  return (
    <View style={styles.container}>
      <View style={styles.bgOrbOuter} />
      <View style={styles.bgOrbInner} />

      <Animated.View style={[styles.brandWrap, { opacity: fade, transform: [{ scale }] }]}>
        <Animated.Text style={[styles.brandTextGlow, { opacity: glow }]}>MONEYLENS</Animated.Text>
        <Text style={styles.brandText}>MONEYLENS</Text>
        <Text style={styles.tag}>SMART MONEY VISION</Text>

        <View style={styles.lineTrack}>
          <Animated.View style={[styles.lineSweep, { transform: [{ translateX: sweep }] }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  bgOrbOuter: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: "rgba(32,227,242,0.06)",
    top: -160,
  },
  bgOrbInner: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(32,227,242,0.1)",
    top: 120,
  },
  brandWrap: {
    alignItems: "center",
  },
  brandTextGlow: {
    position: "absolute",
    color: COLORS.primary,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(32,227,242,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  brandText: {
    color: COLORS.primary,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 2,
  },
  tag: {
    marginTop: 10,
    color: COLORS.textLight,
    letterSpacing: 3,
    fontSize: 11,
    fontWeight: "600",
  },
  lineTrack: {
    marginTop: 20,
    width: 220,
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(125,144,173,0.25)",
    overflow: "hidden",
  },
  lineSweep: {
    width: 120,
    height: 3,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
});
