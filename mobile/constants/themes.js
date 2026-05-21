export const DARK_COLORS = {
  primary: "#20E3F2",
  background: "#060A14",
  text: "#E8F6FF",
  border: "#1E2A40",
  white: "#E8F6FF",
  textLight: "#7D90AD",
  expense: "#FF6B6B",
  income: "#2BFFB1",
  card: "#0D1423",
  shadow: "#000000",
  surface: "#121B2C",
  surfaceAlt: "#0B1220",
};

export const LIGHT_COLORS = {
  primary: "#0ABCD6",
  background: "#F4F8FF",
  text: "#0A1324",
  border: "#D3DFEF",
  white: "#FFFFFF",
  textLight: "#5A6F8F",
  expense: "#D64545",
  income: "#00A978",
  card: "#FFFFFF",
  shadow: "#000000",
  surface: "#ECF3FF",
  surfaceAlt: "#E7EFFC",
};

export const getThemeColors = (themeMode = "dark") =>
  themeMode === "light" ? LIGHT_COLORS : DARK_COLORS;
