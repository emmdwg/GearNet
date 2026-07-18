import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { MultiImagePicker } from "../media/MultiImagePicker";
import { VideoPicker, type VideoDraft } from "../media/VideoPicker";
import { VideoChaptersEditor } from "../media/VideoChaptersEditor";
import { FormField, FormModal, formStyles } from "./FormModal";
import { PostPicker } from "../ui/PostPicker";
import { UserAutocomplete } from "../ui/UserAutocomplete";
import { api } from "../../lib/api";
import { buildFitmentTagsFromVehicle } from "../../lib/fitment-tags";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  normalizeMarketplaceCategory,
  type MarketplaceCategoryId,
} from "../../lib/marketplace-categories";
import { BUILD_MILESTONE_TYPES, type BuildMilestoneType } from "../../lib/build-timeline";
import { MOD_CATEGORIES } from "../../lib/mod-categories";
import { MOD_PART_TYPES, type ModPartType } from "../../lib/mod-part-type";
import { CLUB_TAG_SUGGESTIONS } from "../../lib/clubs";
import { PROJECT_STATUSES } from "../../lib/vehicle-meta";
import { colors, radii } from "../../lib/theme";
import type { Club, MarketplaceListing, Post, Vehicle, VideoChapter } from "../../lib/types";

const DEFAULT_CAR =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=500&fit=crop";

type BaseProps = { visible: boolean; onClose: () => void; onSuccess: () => void };

function SubmitButton({ loading, label, onPress }: { loading: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable style={[formStyles.submitBtn, loading && { opacity: 0.5 }]} onPress={onPress} disabled={loading}>
      <Text style={formStyles.submitText}>{loading ? "Saving..." : label}</Text>
    </Pressable>
  );
}

type MediaMode = "post" | "before-after";

const POST_TEMPLATES = [
  { label: "New mod", caption: "Fresh install — ", tags: "newmod, build, geartalk" },
  { label: "Track day", caption: "Track day recap — ", tags: "trackday, hpde, geartalk" },
  { label: "Parts haul", caption: "Parts haul — ", tags: "partshaul, buildup, geartalk" },
  { label: "Exhaust note", caption: "Exhaust note — ", tags: "exhaust, revclip, geartalk", audio: true },
] as const;

export function CreatePostForm({ visible, onClose, onSuccess, editing, clubId }: BaseProps & { editing?: Post; clubId?: string }) {
  const [mode, setMode] = useState<MediaMode>("post");
  const [images, setImages] = useState<string[]>([]);
  const [beforeImages, setBeforeImages] = useState<string[]>([]);
  const [afterImages, setAfterImages] = useState<string[]>([]);
  const [video, setVideo] = useState<VideoDraft | null>(null);
  const [videoChapters, setVideoChapters] = useState<VideoChapter[]>([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspiredByPostId, setInspiredByPostId] = useState("");
  const [collaboratorList, setCollaboratorList] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSponsored, setIsSponsored] = useState(false);
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorUrl, setSponsorUrl] = useState("");
  const [tagLocation, setTagLocation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const isBeforeAfter = editing?.postType === "before-after";
    setMode(isBeforeAfter ? "before-after" : "post");
    setImages(editing?.images && editing.images.length > 0 ? editing.images : editing?.image ? [editing.image] : []);
    setBeforeImages(editing?.beforeImage ? [editing.beforeImage] : []);
    setAfterImages(editing?.afterImage ? [editing.afterImage] : []);
    setVideo(
      editing?.videoUrl
        ? {
            url: editing.videoUrl,
            duration: editing.videoDuration ?? 0,
            poster: editing.videoPoster,
          }
        : null
    );
    setVideoChapters(editing?.videoChapters ?? []);
    setCaption(editing?.caption ?? "");
    setTags(editing?.tags?.join(", ") ?? "");
    setVehicleId(editing?.vehicleId ?? "");
    setInspiredByPostId(editing?.inspiredByPostId ?? "");
    setCollaboratorList(editing?.collaborators ?? []);
    setAudioUrl(editing?.audioUrl ?? "");
    setScheduledAt(
      editing?.scheduledAt
        ? editing.scheduledAt.slice(0, 16).replace("T", " ")
        : ""
    );
    setIsSponsored(Boolean(editing?.isSponsored));
    setSponsorName(editing?.sponsorName ?? "");
    setSponsorUrl(editing?.sponsorUrl ?? "");
    setTagLocation(false);
    setError("");
    api.getVehicles().then(setVehicles).catch(() => setVehicles([]));
  }, [visible, editing]);

  async function saveDraft() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        status: "draft" as const,
        caption: caption.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        images: images.length > 0 ? images : undefined,
        vehicleId: vehicleId || undefined,
        clubId,
      };
      if (editing) {
        await api.updatePost(editing.id, { ...payload, status: "draft" });
      } else {
        await api.createPost(payload);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save draft");
    } finally {
      setLoading(false);
    }
  }

  function parseScheduledAtIso(raw: string): string | undefined {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    const normalized = trimmed.includes("T") ? trimmed : trimmed.replace(" ", "T");
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime()) || d <= new Date()) return undefined;
    return d.toISOString();
  }

  async function submit() {
    if (mode === "before-after") {
      if (!beforeImages[0] || !afterImages[0]) {
        setError("Add both before and after photos");
        return;
      }
    } else if (images.length === 0 && !video) {
      setError("Add at least one photo or a video");
      return;
    }

    let scheduledAtIso: string | undefined;
    if (scheduledAt.trim()) {
      scheduledAtIso = parseScheduledAtIso(scheduledAt);
      if (!scheduledAtIso) {
        setError("Schedule time must be a valid future date (YYYY-MM-DD HH:mm)");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      let locationFields: { latitude?: number; longitude?: number } = {};
      if (tagLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          locationFields = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        } else {
          setError("Location unavailable. Turn off Share location or allow permission.");
          setLoading(false);
          return;
        }
      }

      const legendary = {
        vehicleId: vehicleId || undefined,
        postType:
          mode === "before-after"
            ? ("before-after" as const)
            : audioUrl.trim()
              ? ("audio" as const)
              : collaboratorList.length
                ? ("collab" as const)
                : vehicleId
                  ? ("build" as const)
                  : ("standard" as const),
        beforeImage: mode === "before-after" ? beforeImages[0] : null,
        afterImage: mode === "before-after" ? afterImages[0] : null,
        inspiredByPostId: inspiredByPostId.trim() || undefined,
        collaborators: collaboratorList,
        audioUrl: audioUrl.trim() || undefined,
        isSponsored,
        sponsorName: isSponsored ? sponsorName.trim() || undefined : undefined,
        sponsorUrl: isSponsored ? sponsorUrl.trim() || undefined : undefined,
        ...locationFields,
      };

      const payload =
        mode === "before-after"
          ? {
              mediaType: "image" as const,
              // After is primary feed thumbnail; keep both for gallery/fallback paths
              images: [afterImages[0], beforeImages[0]],
              caption: caption.trim(),
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              clubId,
              ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
              ...legendary,
            }
          : {
              mediaType: video ? ("video" as const) : ("image" as const),
              images,
              videoUrl: video?.url,
              videoDuration: video?.duration,
              videoPoster: video?.poster,
              videoChapters: video ? videoChapters : undefined,
              caption: caption.trim(),
              tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
              clubId,
              ...(scheduledAtIso ? { scheduledAt: scheduledAtIso } : {}),
              ...legendary,
            };
      if (editing) {
        await api.updatePost(editing.id, payload);
      } else {
        await api.createPost(payload);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const willSchedule = Boolean(parseScheduledAtIso(scheduledAt));

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Post" : clubId ? "Share to Club" : "New Post"}
      footer={
        <View style={{ gap: 10 }}>
          <SubmitButton
            loading={loading}
            label={editing ? "Save Changes" : willSchedule ? "Schedule Post" : "Share Post"}
            onPress={submit}
          />
          {!editing ? (
            <Pressable
              style={[formStyles.submitBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.borderLight }, loading && { opacity: 0.5 }]}
              onPress={saveDraft}
              disabled={loading}
            >
              <Text style={[formStyles.submitText, { color: colors.textMuted }]}>Save Draft</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      {!editing ? (
        <View style={listingFormStyles.chipRow}>
          {POST_TEMPLATES.map((template) => (
            <Pressable
              key={template.label}
                onPress={() => {
                  setCaption(template.caption);
                  setTags(template.tags);
                }}
              style={listingFormStyles.chip}
            >
              <Text style={listingFormStyles.chipText}>{template.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <View style={segmentStyles.row}>
        {(["post", "before-after"] as const).map((m) => (
          <Pressable
            key={m}
            style={[segmentStyles.btn, mode === m && segmentStyles.btnActive]}
            onPress={() => setMode(m)}
          >
            <Text style={[segmentStyles.text, mode === m && segmentStyles.textActive]}>
              {m === "before-after" ? "Before/After" : "Post"}
            </Text>
          </Pressable>
        ))}
      </View>
      {mode === "post" ? (
        <>
          <FormField label="Video (optional)">
            <VideoPicker video={video} onChange={setVideo} folder="posts" disabled={loading} />
          </FormField>
          {video ? (
            <FormField label="Chapters (optional)">
              <VideoChaptersEditor
                chapters={videoChapters}
                onChange={setVideoChapters}
                maxDuration={video.duration}
                disabled={loading}
              />
            </FormField>
          ) : null}
          <FormField label="Photos (required)">
            <MultiImagePicker
              images={images}
              onChange={setImages}
              folder="posts"
              maxImages={20}
              label="Add photos"
              showCounter
            />
          </FormField>
        </>
      ) : (
        <>
          <FormField label="Before photo">
            <MultiImagePicker images={beforeImages} onChange={setBeforeImages} folder="posts" maxImages={1} label="Upload before" />
          </FormField>
          <FormField label="After photo">
            <MultiImagePicker images={afterImages} onChange={setAfterImages} folder="posts" maxImages={1} label="Upload after" />
          </FormField>
        </>
      )}
      {vehicles.length > 0 ? (
        <FormField label="Tag vehicle">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
            <Pressable
              onPress={() => setVehicleId("")}
              style={[listingFormStyles.chip, !vehicleId && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, !vehicleId && listingFormStyles.chipTextActive]}>None</Text>
            </Pressable>
            {vehicles.map((v) => (
              <Pressable
                key={v.id}
                onPress={() => setVehicleId(v.id)}
                style={[listingFormStyles.chip, vehicleId === v.id && listingFormStyles.chipActive]}
              >
                <Text style={[listingFormStyles.chipText, vehicleId === v.id && listingFormStyles.chipTextActive]}>
                  {v.year} {v.make}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </FormField>
      ) : null}
      <FormField label="Caption (optional)">
        <TextInput
          value={caption}
          onChangeText={setCaption}
          style={[formStyles.input, formStyles.textarea]}
          multiline
          placeholder="Say something about this post..."
        />
      </FormField>
      <FormField label="Tags (comma separated)">
        <TextInput value={tags} onChangeText={setTags} style={formStyles.input} />
      </FormField>
      <FormField label="Inspired by (optional)">
        <PostPicker value={inspiredByPostId} onChange={setInspiredByPostId} />
      </FormField>
      <FormField label="Collaborators">
        <UserAutocomplete value={collaboratorList} onChange={setCollaboratorList} placeholder="Search @username" />
      </FormField>
      <FormField label="Rev clip / sound check URL">
        <TextInput value={audioUrl} onChangeText={setAudioUrl} style={formStyles.input} placeholder="Audio file URL" autoCapitalize="none" />
      </FormField>
      <FormField label="Schedule for (optional)">
        <TextInput
          value={scheduledAt}
          onChangeText={setScheduledAt}
          style={formStyles.input}
          placeholder="YYYY-MM-DD HH:mm"
          autoCapitalize="none"
        />
      </FormField>
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setIsSponsored((v) => !v)}>
        <View style={[listingFormStyles.checkbox, isSponsored && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Paid partnership / sponsored</Text>
      </Pressable>
      {isSponsored ? (
        <>
          <FormField label="Sponsor name">
            <TextInput value={sponsorName} onChangeText={setSponsorName} style={formStyles.input} placeholder="Brand name" />
          </FormField>
          <FormField label="Sponsor URL">
            <TextInput
              value={sponsorUrl}
              onChangeText={setSponsorUrl}
              style={formStyles.input}
              placeholder="https://"
              autoCapitalize="none"
            />
          </FormField>
        </>
      ) : null}
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setTagLocation((v) => !v)}>
        <View style={[listingFormStyles.checkbox, tagLocation && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Tag my location (Near You feed)</Text>
      </Pressable>
    </FormModal>
  );
}

const segmentStyles = {
  row: {
    flexDirection: "row" as const,
    borderWidth: 1,
    borderColor: "#3f3f46",
    borderRadius: 10,
    padding: 4,
    marginBottom: 4,
  },
  btn: { flex: 1, borderRadius: 8, paddingVertical: 8, alignItems: "center" as const },
  btnActive: { backgroundColor: "#27272a" },
  text: { color: "#a1a1aa", fontSize: 14, fontWeight: "500" as const },
  textActive: { color: "#ffffff" },
};

export function CreatePitUpdateForm({ visible, onClose, onSuccess }: BaseProps) {
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<"public" | "followers" | "crew" | "private">("public");
  const [shareLocation, setShareLocation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setImages([]);
    setCaption("");
    setVisibility("public");
    setShareLocation(false);
    setError("");
  }, [visible]);

  async function submit() {
    if (images.length === 0 || !caption.trim()) {
      setError("At least one image and caption are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      let locationFields: { latitude?: number; longitude?: number } = {};
      if (shareLocation) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          locationFields = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      }
      await api.createPitUpdate({
        image: images[0],
        slides: images.map((img) => ({ image: img, caption: "" })),
        caption: caption.trim(),
        visibility,
        ...locationFields,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="Add Pit Update" footer={<SubmitButton loading={loading} label="Share Update" onPress={submit} />}>
      <Text style={formStyles.hint}>Share a 24-hour snapshot from your garage.</Text>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Photos (up to 5 slides)">
        <MultiImagePicker images={images} onChange={setImages} folder="posts" maxImages={5} label="Add photos" />
      </FormField>
      <FormField label="Caption">
        <TextInput value={caption} onChangeText={setCaption} style={formStyles.input} maxLength={80} />
      </FormField>
      <FormField label="Who can see this?">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {(
            [
              { value: "public", label: "Everyone" },
              { value: "followers", label: "Followers only" },
              { value: "crew", label: "Crew only" },
              { value: "private", label: "Only me" },
            ] as const
          ).map(({ value, label }) => (
            <Pressable
              key={value}
              onPress={() => setVisibility(value)}
              style={[listingFormStyles.chip, visibility === value && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, visibility === value && listingFormStyles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setShareLocation((v) => !v)}>
        <View style={[listingFormStyles.checkbox, shareLocation && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Share location (shows LIVE badge for 2 hours)</Text>
      </Pressable>
    </FormModal>
  );
}

export function CreateVehicleForm({ visible, onClose, onSuccess, editing }: BaseProps & { editing?: Vehicle }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [color, setColor] = useState("");
  const [vin, setVin] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [buildProgress, setBuildProgress] = useState("0");
  const [installHours, setInstallHours] = useState("");
  const [waitingOnParts, setWaitingOnParts] = useState(false);
  const [waitingOnPartsNote, setWaitingOnPartsNote] = useState("");
  const [forSale, setForSale] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [decoding, setDecoding] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setYear(String(editing?.year ?? new Date().getFullYear()));
    setMake(editing?.make ?? "");
    setModel(editing?.model ?? "");
    setTrim(editing?.trim ?? "");
    setColor(editing?.color ?? "");
    setVin(editing?.vin ?? "");
    setProjectStatus(editing?.projectStatus ?? "");
    setBuildProgress(String(editing?.buildProgress ?? 0));
    setInstallHours(
      typeof editing?.installHours === "number" ? String(editing.installHours) : "",
    );
    setWaitingOnParts(editing?.waitingOnParts ?? false);
    setWaitingOnPartsNote(editing?.waitingOnPartsNote ?? "");
    setForSale(editing?.forSale ?? false);
    setImages(editing?.image ? [editing.image] : []);
    setError("");
  }, [visible, editing]);

  async function decodeVin() {
    if (!vin.trim()) return;
    setDecoding(true);
    setError("");
    try {
      const data = await api.decodeVin(vin.trim());
      if (data.year) setYear(String(data.year));
      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.trim) setTrim(data.trim);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Decode failed");
    } finally {
      setDecoding(false);
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const hoursParsed = installHours.trim() === "" ? null : Number(installHours);
      const payload = {
        year: parseInt(year, 10),
        make,
        model,
        trim: trim || undefined,
        color: color || "Unknown",
        image: images[0] || DEFAULT_CAR,
        images: images.length > 0 ? images : undefined,
        vin: vin.trim() || undefined,
        projectStatus: projectStatus || undefined,
        buildProgress: parseInt(buildProgress, 10) || 0,
        installHours:
          hoursParsed !== null && !Number.isNaN(hoursParsed) ? Math.round(hoursParsed) : null,
        waitingOnParts,
        waitingOnPartsNote: waitingOnParts ? waitingOnPartsNote.trim() || null : null,
        forSale,
      };
      if (editing) {
        await api.updateVehicle(editing.id, payload);
      } else {
        await api.createVehicle(payload);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Vehicle" : "Add Vehicle"}
      footer={<SubmitButton loading={loading} label={editing ? "Save Changes" : "Add to Garage"} onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="VIN (optional)">
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={vin}
            onChangeText={(t) => setVin(t.toUpperCase())}
            style={[formStyles.input, { flex: 1 }]}
            maxLength={17}
            autoCapitalize="characters"
          />
          <Pressable
            onPress={() => void decodeVin()}
            disabled={decoding || !vin.trim()}
            style={[formStyles.input, { justifyContent: "center", paddingHorizontal: 12, opacity: decoding ? 0.5 : 1 }]}
          >
            <Text style={{ color: colors.accent, fontWeight: "600" }}>{decoding ? "..." : "Decode"}</Text>
          </Pressable>
        </View>
      </FormField>
      <FormField label="Year"><TextInput value={year} onChangeText={setYear} keyboardType="number-pad" style={formStyles.input} /></FormField>
      <FormField label="Make"><TextInput value={make} onChangeText={setMake} style={formStyles.input} /></FormField>
      <FormField label="Model"><TextInput value={model} onChangeText={setModel} style={formStyles.input} /></FormField>
      <FormField label="Trim"><TextInput value={trim} onChangeText={setTrim} style={formStyles.input} /></FormField>
      <FormField label="Color"><TextInput value={color} onChangeText={setColor} style={formStyles.input} /></FormField>
      <FormField label="Project status">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          <Pressable
            onPress={() => setProjectStatus("")}
            style={[listingFormStyles.chip, !projectStatus && listingFormStyles.chipActive]}
          >
            <Text style={[listingFormStyles.chipText, !projectStatus && listingFormStyles.chipTextActive]}>
              Not set
            </Text>
          </Pressable>
          {PROJECT_STATUSES.map((s) => (
            <Pressable
              key={s.value}
              onPress={() => setProjectStatus(s.value)}
              style={[listingFormStyles.chip, projectStatus === s.value && listingFormStyles.chipActive]}
            >
              <Text
                style={[
                  listingFormStyles.chipText,
                  projectStatus === s.value && listingFormStyles.chipTextActive,
                  { textTransform: "none" },
                ]}
              >
                {s.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <FormField label={`Build progress: ${buildProgress}%`}>
        <TextInput value={buildProgress} onChangeText={setBuildProgress} keyboardType="number-pad" style={formStyles.input} placeholder="0-100" />
      </FormField>
      <FormField label="Install hours (optional)">
        <TextInput
          value={installHours}
          onChangeText={setInstallHours}
          keyboardType="number-pad"
          style={formStyles.input}
          placeholder="e.g. 40"
        />
      </FormField>
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setWaitingOnParts((v) => !v)}>
        <View style={[listingFormStyles.checkbox, waitingOnParts && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Waiting on parts</Text>
      </Pressable>
      {waitingOnParts ? (
        <FormField label="Waiting note (optional)">
          <TextInput
            value={waitingOnPartsNote}
            onChangeText={setWaitingOnPartsNote}
            style={formStyles.input}
            placeholder="What’s delayed?"
            maxLength={200}
          />
        </FormField>
      ) : null}
      <FormField label="Photos">
        <MultiImagePicker images={images} onChange={setImages} folder="vehicles" maxImages={8} label="Add photos" showCounter />
      </FormField>
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setForSale((v) => !v)}>
        <View style={[listingFormStyles.checkbox, forSale && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>List this project for sale</Text>
      </Pressable>
    </FormModal>
  );
}

export function CreateEventForm({
  visible,
  onClose,
  onSuccess,
  clubId,
  prefill,
}: BaseProps & {
  clubId?: string;
  prefill?: { title?: string; location?: string; city?: string; latitude?: number; longitude?: number };
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tags, setTags] = useState("");
  const [recurringRule, setRecurringRule] = useState("");
  const [routeStops, setRouteStops] = useState("");
  const [isOutdoor, setIsOutdoor] = useState(true);
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(prefill?.title ?? "");
    setDescription("");
    setLocation(prefill?.location ?? "");
    setCity(prefill?.city ?? "");
    setLatitude(prefill?.latitude);
    setLongitude(prefill?.longitude);
    setDate("");
    setTime("");
    setTags("");
    setRecurringRule("");
    setRouteStops("");
    setIsOutdoor(true);
    setTicketPrice("");
    setTicketUrl("");
    setError("");
  }, [visible, prefill]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const routeJson = routeStops
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, lat, lng] = line.split(",").map((p) => p.trim());
          return { name, lat: parseFloat(lat), lng: parseFloat(lng) };
        })
        .filter((s) => s.name && !Number.isNaN(s.lat) && !Number.isNaN(s.lng));

      await api.createEvent({
        title,
        description,
        location,
        city,
        date,
        time,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        clubId,
        recurringRule: recurringRule.trim() || undefined,
        routeJson: routeJson.length > 0 ? routeJson : undefined,
        isOutdoor,
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop",
        ticketPrice: ticketPrice ? Math.round(parseFloat(ticketPrice) * 100) : undefined,
        ticketUrl: ticketUrl.trim() || undefined,
        latitude,
        longitude,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title={clubId ? "Club Meet" : "Create Event"} footer={<SubmitButton loading={loading} label="Create Event" onPress={submit} />}>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Title"><TextInput value={title} onChangeText={setTitle} style={formStyles.input} /></FormField>
      <FormField label="Description"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      <FormField label="Location"><TextInput value={location} onChangeText={setLocation} style={formStyles.input} /></FormField>
      <FormField label="City"><TextInput value={city} onChangeText={setCity} style={formStyles.input} /></FormField>
      <FormField label="Date (YYYY-MM-DD)"><TextInput value={date} onChangeText={setDate} style={formStyles.input} placeholder="2026-06-22" /></FormField>
      <FormField label="Time"><TextInput value={time} onChangeText={setTime} style={formStyles.input} placeholder="7:00 PM" /></FormField>
      <FormField label="Tags (comma separated)"><TextInput value={tags} onChangeText={setTags} style={formStyles.input} placeholder="meet, cruise" /></FormField>
      <FormField label="Recurring schedule (optional)">
        <TextInput value={recurringRule} onChangeText={setRecurringRule} style={formStyles.input} placeholder="Every 2nd Saturday" />
        <Text style={formStyles.hint}>Display label only — does not create multiple event dates.</Text>
      </FormField>
      <FormField label="Cruise route stops (name, lat, lng per line)">
        <TextInput
          value={routeStops}
          onChangeText={setRouteStops}
          style={[formStyles.input, formStyles.textarea]}
          multiline
          placeholder={"Meet point, 37.7749, -122.4194\nPhoto spot, 37.8024, -122.4058"}
        />
      </FormField>
      <Pressable style={formStyles.checkboxRow} onPress={() => setIsOutdoor((v) => !v)}>
        <Ionicons name={isOutdoor ? "checkbox" : "square-outline"} size={20} color={colors.accent} />
        <Text style={formStyles.checkboxLabel}>Outdoor event (weather alerts enabled)</Text>
      </Pressable>
      <FormField label="Ticket price ($, optional)">
        <TextInput value={ticketPrice} onChangeText={setTicketPrice} style={formStyles.input} keyboardType="decimal-pad" placeholder="25" />
      </FormField>
      <FormField label="Ticket URL (optional)">
        <TextInput value={ticketUrl} onChangeText={setTicketUrl} style={formStyles.input} placeholder="https://eventbrite.com/..." autoCapitalize="none" />
      </FormField>
    </FormModal>
  );
}

export function CreateListingForm({
  visible,
  onClose,
  onSuccess,
  editing,
  prefill,
}: BaseProps & { editing?: MarketplaceListing; prefill?: import("../../lib/vehicle-listing-prefill").VehicleListingPrefill | import("../../lib/mod-listing-prefill").ModListingPrefill }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<MarketplaceCategoryId>("parts");
  const [condition, setCondition] = useState("good");
  const [tradeAccepted, setTradeAccepted] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [fitmentVehicleIds, setFitmentVehicleIds] = useState<string[]>([]);
  const [modId, setModId] = useState("");
  const [fitmentTags, setFitmentTags] = useState("");
  const [fitmentAdvanced, setFitmentAdvanced] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(editing?.title ?? prefill?.title ?? "");
    setDescription(editing?.description ?? prefill?.description ?? "");
    setPrice(editing ? String(editing.price) : "");
    setLocation(editing?.location ?? "");
    setCategory(normalizeMarketplaceCategory(editing?.category ?? prefill?.category ?? "parts"));
    setCondition(editing?.condition ?? "good");
    setTradeAccepted(editing?.tradeAccepted ?? false);
    setVehicleId(editing?.vehicleId ?? prefill?.vehicleId ?? "");
    setModId(prefill && "modId" in prefill ? prefill.modId : "");
    setFitmentTags(editing?.fitmentTags?.join(", ") ?? prefill?.fitmentTags?.join(", ") ?? "");
    setFitmentAdvanced(Boolean(editing?.fitmentTags?.length || prefill?.fitmentTags?.length));
    setFitmentVehicleIds(
      editing?.vehicleId || prefill?.vehicleId
        ? [editing?.vehicleId ?? prefill?.vehicleId ?? ""].filter(Boolean)
        : [],
    );
    setImages(editing?.images && editing.images.length > 0 ? editing.images : editing?.image ? [editing.image] : prefill?.images ?? []);
    setError("");
    api.getVehicles().then(setVehicles).catch(() => setVehicles([]));
  }, [visible, editing, prefill]);

  function toggleFitmentVehicle(id: string) {
    setFitmentVehicleIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      const tags = next.flatMap((vid) => {
        const v = vehicles.find((g) => g.id === vid);
        return v ? buildFitmentTagsFromVehicle(v) : [];
      });
      setFitmentTags([...new Set(tags)].join(", "));
      if (!vehicleId && next[0]) setVehicleId(next[0]);
      return next;
    });
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        title,
        description,
        price: parseInt(price, 10) || 0,
        category,
        condition,
        location,
        tradeAccepted,
        vehicleId: vehicleId || undefined,
        modId: modId || undefined,
        fitmentTags: fitmentTags.split(",").map((t) => t.trim()).filter(Boolean),
        images,
      };
      if (images.length === 0) {
        throw new Error("Add at least one photo");
      }
      if (editing) {
        await api.updateListing(editing.id, payload);
      } else {
        await api.createListing(payload);
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Listing" : "List Item"}
      footer={<SubmitButton loading={loading} label={editing ? "Save Changes" : "Publish Listing"} onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Photos">
        <MultiImagePicker images={images} onChange={setImages} folder="marketplace" label="Add photos" />
      </FormField>
      <FormField label="Title"><TextInput value={title} onChangeText={setTitle} style={formStyles.input} /></FormField>
      <FormField label="Description"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      <FormField label="Price ($)"><TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" style={formStyles.input} /></FormField>
      <FormField label="Location"><TextInput value={location} onChangeText={setLocation} style={formStyles.input} /></FormField>
      {vehicles.length > 0 ? (
        <FormField label="Link to garage vehicle">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
            <Pressable onPress={() => setVehicleId("")} style={[listingFormStyles.chip, !vehicleId && listingFormStyles.chipActive]}>
              <Text style={[listingFormStyles.chipText, !vehicleId && listingFormStyles.chipTextActive]}>None</Text>
            </Pressable>
            {vehicles.map((v) => (
              <Pressable key={v.id} onPress={() => setVehicleId(v.id)} style={[listingFormStyles.chip, vehicleId === v.id && listingFormStyles.chipActive]}>
                <Text style={[listingFormStyles.chipText, vehicleId === v.id && listingFormStyles.chipTextActive]}>
                  {v.year} {v.make} {v.model}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </FormField>
      ) : null}
      {vehicles.length > 0 ? (
        <FormField label="Fits which garage cars?">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
            {vehicles.map((v) => {
              const active = fitmentVehicleIds.includes(v.id);
              return (
                <Pressable
                  key={`fit-${v.id}`}
                  onPress={() => toggleFitmentVehicle(v.id)}
                  style={[listingFormStyles.chip, active && listingFormStyles.chipActive]}
                >
                  <Text style={[listingFormStyles.chipText, active && listingFormStyles.chipTextActive]}>
                    {v.year} {v.make} {v.model}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </FormField>
      ) : null}
      <Pressable onPress={() => setFitmentAdvanced((v) => !v)} style={{ marginBottom: 6 }}>
        <Text style={{ color: colors.textFaint, fontSize: 12, fontWeight: "600" }}>
          {fitmentAdvanced ? "Hide advanced fitment" : "Advanced fitment tags"}
        </Text>
      </Pressable>
      {fitmentAdvanced ? (
        <FormField label="Fitment tags (comma separated)">
          <TextInput value={fitmentTags} onChangeText={setFitmentTags} style={formStyles.input} placeholder="E36, 5x120, M3" />
        </FormField>
      ) : fitmentTags ? (
        <Text style={{ color: colors.textFaint, fontSize: 12, marginBottom: 10 }}>{fitmentTags}</Text>
      ) : null}
      <FormField label="Category">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {MARKETPLACE_CATEGORIES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setCategory(item.id)}
              style={[listingFormStyles.chip, category === item.id && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, category === item.id && listingFormStyles.chipTextActive]}>
                {item.shortLabel}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <FormField label="Condition">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {MARKETPLACE_CONDITIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCondition(item)}
              style={[listingFormStyles.chip, condition === item && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, condition === item && listingFormStyles.chipTextActive]}>
                {item.replace("-", " ")}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <Pressable style={listingFormStyles.tradeRow} onPress={() => setTradeAccepted((v) => !v)}>
        <View style={[listingFormStyles.checkbox, tradeAccepted && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Open to trades</Text>
      </Pressable>
    </FormModal>
  );
}

export function CreateBuildLogForm({
  visible,
  onClose,
  onSuccess,
  vehicleId,
}: BaseProps & { vehicleId: string }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [milestoneType, setMilestoneType] = useState<BuildMilestoneType>("update");
  const [dynoHp, setDynoHp] = useState("");
  const [dynoTorque, setDynoTorque] = useState("");
  const [lapTime, setLapTime] = useState("");
  const [trackName, setTrackName] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api.createBuildLog(vehicleId, {
        title,
        content,
        milestoneType,
        images,
        dynoHp: dynoHp ? parseFloat(dynoHp) : undefined,
        dynoTorque: dynoTorque ? parseFloat(dynoTorque) : undefined,
        lapTime: lapTime.trim() || undefined,
        trackName: trackName.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title="Add Timeline Entry"
      footer={<SubmitButton loading={loading} label="Add to Timeline" onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Entry type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {BUILD_MILESTONE_TYPES.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setMilestoneType(item.id)}
              style={[listingFormStyles.chip, milestoneType === item.id && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, milestoneType === item.id && listingFormStyles.chipTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <FormField label="Title"><TextInput value={title} onChangeText={setTitle} style={formStyles.input} /></FormField>
      <FormField label="Story"><TextInput value={content} onChangeText={setContent} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      {milestoneType === "dyno" ? (
        <>
          <FormField label="HP"><TextInput value={dynoHp} onChangeText={setDynoHp} keyboardType="decimal-pad" style={formStyles.input} placeholder="350" /></FormField>
          <FormField label="Torque (lb-ft)"><TextInput value={dynoTorque} onChangeText={setDynoTorque} keyboardType="decimal-pad" style={formStyles.input} placeholder="320" /></FormField>
        </>
      ) : null}
      {milestoneType === "track" ? (
        <>
          <FormField label="Track name"><TextInput value={trackName} onChangeText={setTrackName} style={formStyles.input} placeholder="Laguna Seca" /></FormField>
          <FormField label="Lap time"><TextInput value={lapTime} onChangeText={setLapTime} style={formStyles.input} placeholder="1:42.5" /></FormField>
        </>
      ) : null}
      <FormField label="Photos">
        <MultiImagePicker images={images} onChange={setImages} folder="vehicles" label="Add photos" maxImages={6} />
      </FormField>
    </FormModal>
  );
}

export function CreateModForm({
  visible,
  onClose,
  onSuccess,
  vehicleId,
}: BaseProps & { vehicleId: string }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Engine");
  const [status, setStatus] = useState<"installed" | "planned">("installed");
  const [installedAt, setInstalledAt] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [partType, setPartType] = useState<ModPartType>("aftermarket");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setCategory("Engine");
    setStatus("installed");
    setInstalledAt(new Date().toISOString().slice(0, 10));
    setEstimatedCost("");
    setNotes("");
    setVideoUrl("");
    setAffiliateUrl("");
    setPartType("aftermarket");
    setError("");
  }, [visible]);

  async function submit() {
    if (!name.trim()) {
      setError("Part name is required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createMod(vehicleId, {
        name: name.trim(),
        category,
        status,
        installedAt: installedAt || undefined,
        estimatedCost: estimatedCost ? parseInt(estimatedCost, 10) : undefined,
        notes: notes.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        affiliateUrl: affiliateUrl.trim() || undefined,
        partType,
      });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={status === "planned" ? "Add to Wishlist" : "Log Mod Install"}
      footer={<SubmitButton loading={loading} label="Add to Timeline" onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <View style={segmentStyles.row}>
        <Pressable style={[segmentStyles.btn, status === "installed" && segmentStyles.btnActive]} onPress={() => setStatus("installed")}>
          <Text style={[segmentStyles.text, status === "installed" && segmentStyles.textActive]}>Installed</Text>
        </Pressable>
        <Pressable style={[segmentStyles.btn, status === "planned" && segmentStyles.btnActive]} onPress={() => setStatus("planned")}>
          <Text style={[segmentStyles.text, status === "planned" && segmentStyles.textActive]}>Wishlist</Text>
        </Pressable>
      </View>
      <FormField label="Part / mod name">
        <TextInput value={name} onChangeText={setName} style={formStyles.input} placeholder="BC Racing Coilovers" />
      </FormField>
      <FormField label="Category">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {MOD_CATEGORIES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[listingFormStyles.chip, category === item && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, category === item && listingFormStyles.chipTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <FormField label="Install date (YYYY-MM-DD)">
        <TextInput value={installedAt} onChangeText={setInstalledAt} style={formStyles.input} placeholder="2025-06-21" />
      </FormField>
      <FormField label="Estimated cost ($)">
        <TextInput value={estimatedCost} onChangeText={setEstimatedCost} keyboardType="number-pad" style={formStyles.input} placeholder="1200" />
      </FormField>
      <FormField label="Part type">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {MOD_PART_TYPES.map((item) => (
            <Pressable
              key={item}
              onPress={() => setPartType(item)}
              style={[listingFormStyles.chip, partType === item && listingFormStyles.chipActive]}
            >
              <Text style={[listingFormStyles.chipText, partType === item && listingFormStyles.chipTextActive]}>
                {item === "oem" ? "OEM" : item === "custom" ? "Custom" : "Aftermarket"}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      {status === "installed" ? (
        <FormField label="Install video URL (optional)">
          <TextInput value={videoUrl} onChangeText={setVideoUrl} style={formStyles.input} placeholder="https://youtube.com/..." autoCapitalize="none" />
        </FormField>
      ) : null}
      <FormField label="Affiliate shop link (optional)">
        <TextInput value={affiliateUrl} onChangeText={setAffiliateUrl} style={formStyles.input} placeholder="https://..." autoCapitalize="none" />
      </FormField>
      <FormField label="Notes (optional)">
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={[formStyles.input, formStyles.textarea]}
          multiline
          placeholder="Specs, part numbers, shop..."
        />
      </FormField>
    </FormModal>
  );
}

export function CreateMaintenanceForm({
  visible,
  onClose,
  onSuccess,
  vehicles,
  suggestion,
  editing,
}: BaseProps & {
  vehicles: Pick<Vehicle, "id" | "year" | "make" | "model">[];
  suggestion?: import("../../lib/types").ServiceSuggestion;
  editing?: import("../../lib/types").MaintenanceLog | null;
}) {
  const isEditing = Boolean(editing?.id);
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mileage, setMileage] = useState("");
  const [category, setCategory] = useState("Other");
  const [shopName, setShopName] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [reminderAt, setReminderAt] = useState("");
  const [sharePitUpdate, setSharePitUpdate] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setVehicleId(editing.vehicleId);
      setTitle(editing.title);
      setDescription(editing.description);
      setMileage(String(editing.mileage ?? ""));
      setCategory(editing.category || "Other");
      setShopName(editing.shopName ?? "");
      setReceiptImages(editing.receiptImage ? [editing.receiptImage] : []);
      setReminderAt(editing.reminderAt?.slice(0, 10) ?? "");
      setSharePitUpdate(false);
      setError("");
      return;
    }
    if (suggestion) {
      setTitle(suggestion.suggestedTitle);
      setCategory(suggestion.category);
      setDescription(`Scheduled: ${suggestion.reason}`);
      if (suggestion.vehicleId) setVehicleId(suggestion.vehicleId);
      if (suggestion.dueByDate) setReminderAt(suggestion.dueByDate.slice(0, 10));
    }
  }, [visible, suggestion, editing]);

  async function submit() {
    if (!vehicleId) {
      setError("Add a vehicle first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!isEditing && sharePitUpdate && !receiptImages[0]) {
        setError("Add a receipt photo before sharing a pit update");
        setLoading(false);
        return;
      }
      const payload = {
        vehicleId,
        title,
        description,
        mileage: parseInt(mileage, 10) || 0,
        category,
        performedAt: editing?.performedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        shopName: shopName.trim() || null,
        receiptImage: receiptImages[0] || null,
        reminderAt: reminderAt || null,
      };
      if (isEditing && editing) {
        await api.updateMaintenance(editing.id, payload);
      } else {
        await api.createMaintenance(payload);
        if (sharePitUpdate && receiptImages[0]) {
          await api.createPitUpdate({
            image: receiptImages[0],
            caption: `Just serviced: ${title.trim()}`,
            visibility: "public",
          });
        }
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={isEditing ? "Edit Service" : "Log Service"}
      footer={<SubmitButton loading={loading} label={isEditing ? "Save Changes" : "Save Record"} onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      {vehicles.length === 0 ? (
        <Text style={{ color: "#71717a" }}>Add a vehicle in your garage first.</Text>
      ) : (
        <>
          <FormField label="Vehicle">
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {vehicles.map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() => setVehicleId(v.id)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: vehicleId === v.id ? "#f59e0b" : "#3f3f46",
                    backgroundColor: vehicleId === v.id ? "rgba(245,158,11,0.15)" : "transparent",
                  }}
                >
                  <Text style={{ color: vehicleId === v.id ? "#f59e0b" : "#a1a1aa", fontSize: 13 }}>
                    {v.year} {v.make} {v.model}
                  </Text>
                </Pressable>
              ))}
            </View>
          </FormField>
          <FormField label="Service Title"><TextInput value={title} onChangeText={setTitle} style={formStyles.input} /></FormField>
          <FormField label="Description"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
          <FormField label="Mileage"><TextInput value={mileage} onChangeText={setMileage} keyboardType="number-pad" style={formStyles.input} /></FormField>
          <FormField label="Category"><TextInput value={category} onChangeText={setCategory} style={formStyles.input} /></FormField>
          <FormField label="Shop name"><TextInput value={shopName} onChangeText={setShopName} style={formStyles.input} placeholder="Local shop or DIY" /></FormField>
          <FormField label="Receipt photo">
            <MultiImagePicker images={receiptImages} onChange={setReceiptImages} folder="maintenance" maxImages={1} label="Add receipt" />
          </FormField>
          <FormField label="Reminder date (YYYY-MM-DD)">
            <TextInput value={reminderAt} onChangeText={setReminderAt} style={formStyles.input} placeholder="2026-09-21" />
          </FormField>
          {!isEditing ? (
            <Pressable style={listingFormStyles.tradeRow} onPress={() => setSharePitUpdate((v) => !v)}>
              <View style={[listingFormStyles.checkbox, sharePitUpdate && listingFormStyles.checkboxActive]} />
              <Text style={listingFormStyles.tradeText}>Share as pit update</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </FormModal>
  );
}

export function CreateClubForm({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (club?: Club) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName("");
    setDescription("");
    setCity("");
    setTags([]);
    setCustomTag("");
    setImages([]);
    setCoverImages([]);
    setIsPublic(true);
    setRequiresApproval(false);
    setError("");
  }, [visible]);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6)));
  }

  async function submit() {
    if (!name.trim() || !description.trim()) {
      setError("Name and description required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const created = await api.createClub({
        name: name.trim(),
        description: description.trim(),
        city: city.trim(),
        tags,
        image: images[0],
        coverImage: coverImages[0],
        isPublic,
        requiresApproval,
      });
      onSuccess(created);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="Start a Club" footer={<SubmitButton loading={loading} label="Launch Club" onPress={submit} />}>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Club name"><TextInput value={name} onChangeText={setName} style={formStyles.input} /></FormField>
      <FormField label="About"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      <FormField label="City / region"><TextInput value={city} onChangeText={setCity} style={formStyles.input} placeholder="Los Angeles, CA" /></FormField>
      <FormField label="Scene tags">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {CLUB_TAG_SUGGESTIONS.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)} style={[listingFormStyles.chip, tags.includes(tag) && listingFormStyles.chipActive]}>
              <Text style={[listingFormStyles.chipText, tags.includes(tag) && listingFormStyles.chipTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <TextInput value={customTag} onChangeText={setCustomTag} style={[formStyles.input, { marginTop: 8 }]} placeholder="Custom tag" onSubmitEditing={() => {
          const t = customTag.trim();
          if (t && !tags.includes(t) && tags.length < 6) { setTags([...tags, t]); setCustomTag(""); }
        }} />
      </FormField>
      <FormField label="Cover banner">
        <MultiImagePicker images={coverImages} onChange={setCoverImages} folder="clubs" maxImages={1} label="Add cover" />
      </FormField>
      <FormField label="Club avatar">
        <MultiImagePicker images={images} onChange={setImages} folder="clubs" maxImages={1} label="Add photo" />
      </FormField>
      <Pressable
        style={listingFormStyles.tradeRow}
        onPress={() => {
          setIsPublic((v) => {
            if (v) setRequiresApproval(true);
            return !v;
          });
        }}
      >
        <View style={[listingFormStyles.checkbox, isPublic && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Public club (shows in Discover)</Text>
      </Pressable>
      <Pressable
        style={[listingFormStyles.tradeRow, !isPublic && { opacity: 0.6 }]}
        onPress={() => {
          if (!isPublic) return;
          setRequiresApproval((v) => !v);
        }}
      >
        <View style={[listingFormStyles.checkbox, (requiresApproval || !isPublic) && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>
          {isPublic ? "Require approval to join" : "Private clubs always require approval"}
        </Text>
      </Pressable>
    </FormModal>
  );
}

export function ClubSettingsForm({
  visible,
  onClose,
  onSuccess,
  onDeleted,
  club,
  isOwner = true,
}: BaseProps & { club: Club; onDeleted?: () => void; isOwner?: boolean }) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description);
  const [city, setCity] = useState(club.city ?? "");
  const [tags, setTags] = useState<string[]>(club.tags);
  const [images, setImages] = useState<string[]>(club.image ? [club.image] : []);
  const [coverImages, setCoverImages] = useState<string[]>(club.coverImage ? [club.coverImage] : []);
  const [isPublic, setIsPublic] = useState(club.isPublic);
  const [requiresApproval, setRequiresApproval] = useState(club.requiresApproval);
  const [merchUrl, setMerchUrl] = useState(club.merchUrl ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(club.name);
    setDescription(club.description);
    setCity(club.city ?? "");
    setTags(club.tags);
    setImages(club.image ? [club.image] : []);
    setCoverImages(club.coverImage ? [club.coverImage] : []);
    setIsPublic(club.isPublic);
    setRequiresApproval(club.requiresApproval);
    setMerchUrl(club.merchUrl ?? "");
    setError("");
  }, [visible, club]);

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag].slice(0, 6)));
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api.updateClub(club.slug, isOwner
        ? {
            name: name.trim(),
            description: description.trim(),
            city: city.trim(),
            tags,
            image: images[0] ?? null,
            coverImage: coverImages[0] ?? null,
            isPublic,
            requiresApproval,
            merchUrl: merchUrl.trim() || null,
          }
        : { merchUrl: merchUrl.trim() || null });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeClub() {
    Alert.alert(
      "Delete this club?",
      "This permanently removes the club and can’t be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setDeleting(true);
              setError("");
              try {
                await api.deleteClub(club.slug);
                onClose();
                onDeleted?.();
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to delete");
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="Club Settings" footer={<SubmitButton loading={loading} label="Save Changes" onPress={submit} />}>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      {isOwner ? (
        <>
      <FormField label="Club name"><TextInput value={name} onChangeText={setName} style={formStyles.input} /></FormField>
      <FormField label="About"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      <FormField label="City"><TextInput value={city} onChangeText={setCity} style={formStyles.input} /></FormField>
      <FormField label="Tags">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={listingFormStyles.chipRow}>
          {CLUB_TAG_SUGGESTIONS.map((tag) => (
            <Pressable key={tag} onPress={() => toggleTag(tag)} style={[listingFormStyles.chip, tags.includes(tag) && listingFormStyles.chipActive]}>
              <Text style={[listingFormStyles.chipText, tags.includes(tag) && listingFormStyles.chipTextActive]}>{tag}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </FormField>
      <FormField label="Cover"><MultiImagePicker images={coverImages} onChange={setCoverImages} folder="clubs" maxImages={1} label="Cover" /></FormField>
      <FormField label="Avatar"><MultiImagePicker images={images} onChange={setImages} folder="clubs" maxImages={1} label="Avatar" /></FormField>
      <Pressable
        style={listingFormStyles.tradeRow}
        onPress={() => {
          setIsPublic((v) => {
            if (v) setRequiresApproval(true);
            return !v;
          });
        }}
      >
        <View style={[listingFormStyles.checkbox, isPublic && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>Public club</Text>
      </Pressable>
      <Pressable
        style={[listingFormStyles.tradeRow, !isPublic && { opacity: 0.6 }]}
        onPress={() => {
          if (!isPublic) return;
          setRequiresApproval((v) => !v);
        }}
      >
        <View style={[listingFormStyles.checkbox, (requiresApproval || !isPublic) && listingFormStyles.checkboxActive]} />
        <Text style={listingFormStyles.tradeText}>
          {isPublic ? "Require approval to join" : "Private clubs always require approval"}
        </Text>
      </Pressable>
        </>
      ) : null}
      <FormField label="Merch / store URL"><TextInput value={merchUrl} onChangeText={setMerchUrl} style={formStyles.input} placeholder="https://..." autoCapitalize="none" /></FormField>
      {isOwner ? (
      <Pressable style={[formStyles.submitBtn, { backgroundColor: "transparent", borderWidth: 1, borderColor: "#ef4444", marginTop: 8 }]} onPress={removeClub} disabled={deleting}>
        <Text style={[formStyles.submitText, { color: "#ef4444" }]}>{deleting ? "Deleting..." : "Delete Club"}</Text>
      </Pressable>
      ) : null}
    </FormModal>
  );
}

const listingFormStyles = StyleSheet.create({
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent },
  chipText: { fontSize: 12, color: colors.textDim, textTransform: "capitalize" },
  chipTextActive: { color: colors.accentText, fontWeight: "600" },
  tradeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  checkboxActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tradeText: { fontSize: 14, color: colors.textDim },
});
