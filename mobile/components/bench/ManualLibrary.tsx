import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../lib/api";
import { colors, radii, spacing } from "../../lib/theme";
import type { ManualGuideNote, ManualSuggestion, ServiceManual, Vehicle } from "../../lib/types";
import { ManualCard } from "./MaintenanceEntry";

type Props = {
  initialManuals: ServiceManual[];
  totalCount: number;
  vehicleCount?: number;
  fleetVehicles?: Pick<Vehicle, "year" | "make" | "model">[];
};

function hasVerifiedManualUrl(manual: ServiceManual) {
  return typeof manual.sourceUrl === "string" && manual.sourceUrl.trim().length > 0;
}

function withResolvedManuals(manuals: ServiceManual[]) {
  return manuals.filter(hasVerifiedManualUrl);
}

export function ManualLibrary({ initialManuals, totalCount, vehicleCount, fleetVehicles = [] }: Props) {
  const safeInitial = useMemo(
    () => withResolvedManuals(initialManuals ?? []),
    [initialManuals],
  );
  const safeTotalCount = totalCount ?? 0;
  const safeVehicleCount = vehicleCount ?? 0;
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ManualSuggestion[]>([]);
  const [results, setResults] = useState(safeInitial);
  const [total, setTotal] = useState(safeTotalCount);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [focused, setFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [tips, setTips] = useState<ManualGuideNote[]>([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [tipSection, setTipSection] = useState("");
  const [tipText, setTipText] = useState("");
  const [tipSaving, setTipSaving] = useState(false);

  const tipsVehicle = useMemo(() => {
    if (results.length > 0) {
      return { make: results[0].vehicleMake, model: results[0].vehicleModel };
    }
    if (fleetVehicles.length > 0) {
      return { make: fleetVehicles[0].make, model: fleetVehicles[0].model };
    }
    return null;
  }, [results, fleetVehicles]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const runSearch = useCallback(async (q: string) => {
    if (!q) {
      setResults(safeInitial);
      setTotal(safeTotalCount);
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchManuals(q);
      setResults(withResolvedManuals(Array.isArray(data.results) ? data.results : []));
      setTotal(typeof data.total === "number" ? data.total : 0);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
    } catch {
      setResults([]);
      setTotal(0);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [safeInitial, safeTotalCount]);

  const loadMore = useCallback(async () => {
    if (debouncedQuery || loadingMore || results.length >= total) return;
    setLoadingMore(true);
    try {
      const data = await api.getServiceManuals(48, results.length);
      const next = withResolvedManuals(Array.isArray(data.results) ? data.results : []);
      setResults((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        return [...prev, ...next.filter((m) => !seen.has(m.id))];
      });
      if (typeof data.total === "number") setTotal(data.total);
      else if (typeof data.vehicleTotal === "number") setTotal(data.vehicleTotal);
    } catch {
      /* keep current */
    } finally {
      setLoadingMore(false);
    }
  }, [debouncedQuery, loadingMore, results.length, total]);

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults(safeInitial);
      setTotal(safeTotalCount);
    }
  }, [safeInitial, safeTotalCount, debouncedQuery]);

  useEffect(() => {
    if (!tipsVehicle) {
      setTips([]);
      return;
    }
    setTipsLoading(true);
    api
      .getManualGuideNotes(tipsVehicle.make, tipsVehicle.model)
      .then((data) => setTips(data.notes))
      .catch(() => setTips([]))
      .finally(() => setTipsLoading(false));
  }, [tipsVehicle?.make, tipsVehicle?.model]);

  async function submitTip() {
    if (!tipsVehicle || !tipSection.trim() || !tipText.trim()) return;
    setTipSaving(true);
    try {
      const note = await api.createManualGuideNote({
        vehicleMake: tipsVehicle.make,
        vehicleModel: tipsVehicle.model,
        section: tipSection.trim(),
        tip: tipText.trim(),
      });
      setTips((prev) => [note, ...prev]);
      setTipSection("");
      setTipText("");
    } finally {
      setTipSaving(false);
    }
  }

  async function upvoteTip(id: string) {
    try {
      const data = await api.upvoteManualGuideNote(id);
      setTips((prev) => prev.map((t) => (t.id === id ? { ...t, upvotes: data.upvotes } : t)));
    } catch {
      /* ignore */
    }
  }

  function applySuggestion(suggestion: ManualSuggestion) {
    setQuery(suggestion.query);
    setDebouncedQuery(suggestion.query);
    setFocused(false);
    setSuggestions([]);
  }

  const showSuggestions = focused && suggestions.length > 0 && query.trim().length > 0;

  return (
    <View>
      <Text style={styles.sectionTitle}>Reference Manuals</Text>
      <Text style={styles.sectionHint}>
        {safeVehicleCount > 0
          ? `${safeVehicleCount.toLocaleString()} vehicles indexed · ${safeTotalCount.toLocaleString()} verified service manual generations`
          : `${safeTotalCount.toLocaleString()} verified service manual generations`}
      </Text>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textDim} style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder="Search year, make, model — e.g. 2015 Ford F-150"
          placeholderTextColor={colors.textDim}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setDebouncedQuery("");
              setSuggestions([]);
            }}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={18} color={colors.textDim} />
          </Pressable>
        ) : null}
      </View>

      {showSuggestions ? (
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <Pressable key={item.id} style={styles.suggestionRow} onPress={() => applySuggestion(item)}>
              <Text style={styles.suggestionLabel}>{item.label}</Text>
              <Text style={styles.suggestionSub} numberOfLines={1}>
                {item.subtitle}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
      ) : null}

      {!loading && debouncedQuery && results.length === 0 ? (
        <Text style={styles.empty}>
          No verified manuals matched "{debouncedQuery}". Try a different year, make, or model.
        </Text>
      ) : null}

      {!loading && !debouncedQuery ? (
        safeInitial.length > 0 ? (
          <Text style={styles.helper}>
            Showing verified manuals with direct links — search by year, make, and model. Same manual across
            multiple years is grouped into one generation.
          </Text>
        ) : (
          <Text style={styles.helper}>
            No verified manuals in the catalog yet. Search by year, make, and model as more links are resolved.
          </Text>
        )
      ) : null}

      {(results ?? []).map((manual) => (
        <ManualCard key={manual.id} manual={manual} />
      ))}

      {total > results.length ? (
        <View style={{ alignItems: "center", marginTop: 8, gap: 8 }}>
          <Text style={styles.moreHint}>
            Showing {results.length} of {total.toLocaleString()} matches
          </Text>
          {!debouncedQuery ? (
            <Pressable
              onPress={loadMore}
              disabled={loadingMore}
              style={[styles.loadMoreBtn, loadingMore && { opacity: 0.5 }]}
            >
              <Text style={styles.loadMoreText}>{loadingMore ? "Loading…" : "Load more manuals"}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {tipsVehicle ? (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Community tips</Text>
          <Text style={styles.tipsSub}>
            {tipsVehicle.make} {tipsVehicle.model}
          </Text>
          {tipsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} />
          ) : tips.length > 0 ? (
            tips.map((note) => (
              <View key={note.id} style={styles.tipCard}>
                <Text style={styles.tipSection}>{note.section}</Text>
                <Text style={styles.tipBody}>{note.tip}</Text>
                <View style={styles.tipFooter}>
                  <Text style={styles.tipUser}>@{note.user.username}</Text>
                  <Pressable onPress={() => upvoteTip(note.id)} style={styles.upvoteBtn}>
                    <Ionicons name="thumbs-up-outline" size={14} color={colors.textDim} />
                    <Text style={styles.upvoteCount}>{note.upvotes}</Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.empty}>No community tips yet.</Text>
          )}
          <TextInput
            value={tipSection}
            onChangeText={setTipSection}
            placeholder="Section (e.g. Oil change)"
            placeholderTextColor={colors.textFaint}
            style={styles.tipInput}
          />
          <TextInput
            value={tipText}
            onChangeText={setTipText}
            placeholder="Your tip..."
            placeholderTextColor={colors.textFaint}
            multiline
            style={[styles.tipInput, styles.tipTextarea]}
          />
          <Pressable
            style={[styles.tipSubmit, (tipSaving || !tipSection.trim() || !tipText.trim()) && { opacity: 0.5 }]}
            onPress={submitTip}
            disabled={tipSaving || !tipSection.trim() || !tipText.trim()}
          >
            <Text style={styles.tipSubmitText}>{tipSaving ? "Posting..." : "Add tip"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.text, marginBottom: 4, marginTop: 24 },
  sectionHint: { fontSize: 13, color: colors.textDim, marginBottom: 12 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 15,
  },
  suggestions: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  suggestionRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionLabel: { color: colors.text, fontSize: 14, fontWeight: "500" },
  suggestionSub: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  empty: { fontSize: 14, color: colors.textDim, marginBottom: 12 },
  helper: { fontSize: 13, color: colors.textDim, marginBottom: 12, lineHeight: 18 },
  moreHint: { textAlign: "center", fontSize: 12, color: colors.textDim, marginTop: 8 },
  loadMoreBtn: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  loadMoreText: { color: colors.accent, fontSize: 14, fontWeight: "600" },
  tipsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tipsTitle: { fontSize: 16, fontWeight: "600", color: colors.text },
  tipsSub: { fontSize: 12, color: colors.textDim, marginBottom: 12, marginTop: 2 },
  tipCard: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardMuted,
    padding: spacing.sm,
    marginBottom: 8,
  },
  tipSection: { fontSize: 12, fontWeight: "600", color: colors.accent },
  tipBody: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  tipFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  tipUser: { fontSize: 10, color: colors.textFaint },
  upvoteBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  upvoteCount: { fontSize: 11, color: colors.textDim },
  tipInput: {
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.sm,
    color: colors.text,
    marginBottom: 8,
  },
  tipTextarea: { minHeight: 64, textAlignVertical: "top" },
  tipSubmit: {
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  tipSubmitText: { fontWeight: "600", color: colors.accentText },
});
