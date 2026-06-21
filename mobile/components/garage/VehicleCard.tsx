import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { api } from "../../lib/api";
import type { BuildLog, Vehicle } from "../../lib/types";
import { colors, radii, spacing } from "../../lib/theme";
import { formatLongDate } from "../../lib/utils";
import { CreateVehicleForm } from "../forms/CreateForms";
import { Badge } from "../ui/Badge";
import { OwnerActions } from "../ui/OwnerActions";

export function VehicleCard({ vehicle, onChanged }: { vehicle: Vehicle; onChanged?: () => void }) {
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    try {
      await api.deleteVehicle(vehicle.id);
      onChanged?.();
    } catch {
      // ignore
    }
  }

  return (
    <View style={styles.card}>
      <Image
        source={{ uri: vehicle.image }}
        style={styles.image}
        accessibilityLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Text>
          <OwnerActions
            ownerId={vehicle.userId}
            entityLabel="vehicle"
            onEdit={() => setEditOpen(true)}
            onDelete={handleDelete}
            size={18}
          />
        </View>
        {vehicle.trim ? (
          <Text style={styles.trim}>
            {vehicle.trim} · {vehicle.color}
          </Text>
        ) : null}
        <View style={styles.tags}>
          {vehicle.mods.slice(0, 3).map((mod) => (
            <Badge key={mod.id} variant="outline">
              {mod.name}
            </Badge>
          ))}
          {vehicle.mods.length > 3 ? (
            <Badge variant="outline">{`+${vehicle.mods.length - 3} more`}</Badge>
          ) : null}
        </View>
        <View style={styles.footer}>
          <Ionicons name="construct-outline" size={12} color={colors.textDim} />
          <Text style={styles.footerText}>
            {vehicle.mods.length} mods · {vehicle.buildLogs.length} build logs
          </Text>
        </View>
      </View>
      <CreateVehicleForm
        visible={editOpen}
        editing={vehicle}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          onChanged?.();
        }}
      />
    </View>
  );
}

export function BuildLogCard({ log }: { log: BuildLog }) {
  return (
    <View style={styles.logCard}>
      <View style={styles.logContent}>
        <Text style={styles.logTitle}>{log.title}</Text>
        <Text style={styles.logBody}>{log.content}</Text>
        <Text style={styles.logDate}>{formatLongDate(log.createdAt)}</Text>
      </View>
      {log.image ? <Image source={{ uri: log.image }} style={styles.logImage} /> : null}
    </View>
  );
}

export function ModRow({
  mod,
  vehicleLabel,
}: {
  mod: Vehicle["mods"][0];
  vehicleLabel: string;
}) {
  return (
    <View style={styles.modRow}>
      <View style={styles.modMain}>
        <Text style={styles.modName}>{mod.name}</Text>
        <Text style={styles.modMeta}>{mod.category}</Text>
      </View>
      <View style={styles.modSide}>
        <Text style={styles.modVehicle} numberOfLines={1}>
          {vehicleLabel}
        </Text>
        <Text style={styles.modDate}>
          {new Date(mod.installedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: colors.border,
  },
  body: {
    padding: spacing.md,
    gap: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    flex: 1,
    fontWeight: "600",
    color: colors.text,
    fontSize: 16,
  },
  trim: {
    fontSize: 13,
    color: colors.textDim,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: colors.textDim,
  },
  logCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(24,24,27,0.3)",
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontWeight: "500",
    color: colors.text,
    fontSize: 15,
  },
  logBody: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
  },
  logDate: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textFaint,
  },
  logImage: {
    width: 96,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
  modRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39,39,42,0.5)",
  },
  modMain: {
    flex: 1,
  },
  modName: {
    fontWeight: "500",
    color: colors.text,
    fontSize: 14,
  },
  modMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  modSide: {
    alignItems: "flex-end",
    maxWidth: "45%",
  },
  modVehicle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  modDate: {
    fontSize: 12,
    color: colors.textDim,
    marginTop: 2,
  },
});
