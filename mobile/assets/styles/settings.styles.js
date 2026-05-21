import { StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 14,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  chipTextActive: {
    color: COLORS.white,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  saveButtonText: {
    fontWeight: "600",
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  inputIcon: {
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  listContainer: {
    marginTop: 8,
    gap: 8,
  },
  rowItem: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowText: {
    color: COLORS.text,
    fontWeight: "500",
  },
});
