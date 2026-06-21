import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import type { MaintenanceLog, ServiceManual } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";
import { formatShortDate } from "../../lib/utils";
import { Badge } from "../ui/Badge";

export function MaintenanceEntry({ log }: { log: MaintenanceLog }) {
  const vehicle = log.vehicle;

  return (
    <View style={styles.entry}>
      <View style={styles.entryHeader}>
        <View style={styles.entryMain}>
          <Text style={styles.entryTitle}>{log.title}</Text>
          {vehicle ? (
            <Text style={styles.entryVehicle}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Text>
          ) : null}
        </View>
        <Badge variant="outline">{log.category}</Badge>
      </View>
      <Text style={styles.entryBody}>{log.description}</Text>
      <View style={styles.entryMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="speedometer-outline" size={12} color={colors.textDim} />
          <Text style={styles.metaText}>{log.mileage.toLocaleString()} mi</Text>
        </View>
        {log.cost !== undefined && log.cost > 0 ? (
          <Text style={styles.metaText}>${log.cost}</Text>
        ) : null}
        <Text style={styles.metaText}>{formatShortDate(log.performedAt)}</Text>
      </View>
    </View>
  );
}

export function ManualCard({ manual }: { manual: ServiceManual }) {
  return (
    <View style={styles.manual}>
      <View style={styles.manualIcon}>
        <Ionicons name="book-outline" size={20} color={colors.accent} />
      </View>
      <View style={styles.manualBody}>
        <Text style={styles.manualTitle}>{manual.title}</Text>
        <Text style={styles.manualSub}>
          {manual.vehicleMake} {manual.vehicleModel} ({manual.yearRange})
        </Text>
        <View style={styles.manualTags}>
          {manual.sections.map((section) => (
            <Badge key={section} variant="outline">
              {section}
            </Badge>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(24,24,27,0.3)",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  entryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  entryMain: {
    flex: 1,
  },
  entryTitle: {
    fontWeight: "500",
    color: colors.text,
    fontSize: 15,
  },
  entryVehicle: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  entryBody: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
  },
  entryMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textDim,
  },
  manual: {
    flexDirection: "row",
    gap: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flex: 1,
  },
  manualIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  manualBody: {
    flex: 1,
  },
  manualTitle: {
    fontWeight: "600",
    color: colors.text,
    fontSize: 14,
  },
  manualSub: {
    fontSize: 13,
    color: colors.textDim,
    marginTop: 2,
  },
  manualTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
});
