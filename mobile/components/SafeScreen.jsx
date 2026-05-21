import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSettings } from "../context/AppSettingsContext";

const SafeScreen = ({ children }) => {
  const insets = useSafeAreaInsets();
  const { themeColors } = useAppSettings();

  return (
    <View style={{ paddingTop: insets.top, flex: 1, backgroundColor: themeColors.background }}>
      {children}
    </View>
  );
};

export default SafeScreen;
