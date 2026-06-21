import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { MultiImagePicker } from "../media/MultiImagePicker";
import { FormField, FormModal, formStyles } from "./FormModal";
import { api } from "../../lib/api";
import type { MarketplaceListing, Post, Vehicle } from "../../lib/types";

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

export function CreatePostForm({ visible, onClose, onSuccess, editing }: BaseProps & { editing?: Post }) {
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setImages(editing?.images && editing.images.length > 0 ? editing.images : editing?.image ? [editing.image] : []);
    setCaption(editing?.caption ?? "");
    setTags(editing?.tags?.join(", ") ?? "");
    setError("");
  }, [visible, editing]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        images: images.length > 0 ? images : [DEFAULT_CAR],
        caption,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={editing ? "Edit Post" : "New Post"}
      footer={<SubmitButton loading={loading} label={editing ? "Save Changes" : "Share Post"} onPress={submit} />}
    >
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Photos">
        <MultiImagePicker images={images} onChange={setImages} folder="posts" label="Add photos" />
      </FormField>
      <FormField label="Caption">
        <TextInput value={caption} onChangeText={setCaption} style={[formStyles.input, formStyles.textarea]} multiline />
      </FormField>
      <FormField label="Tags (comma separated)">
        <TextInput value={tags} onChangeText={setTags} style={formStyles.input} />
      </FormField>
    </FormModal>
  );
}

export function CreatePitUpdateForm({ visible, onClose, onSuccess }: BaseProps) {
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api.createPitUpdate({ image: images[0] || DEFAULT_CAR, caption });
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} onClose={onClose} title="Pit Update" footer={<SubmitButton loading={loading} label="Share Update" onPress={submit} />}>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Photo">
        <MultiImagePicker images={images} onChange={setImages} folder="posts" maxImages={1} label="Add photo" />
      </FormField>
      <FormField label="Caption">
        <TextInput value={caption} onChangeText={setCaption} style={formStyles.input} maxLength={80} />
      </FormField>
    </FormModal>
  );
}

export function CreateVehicleForm({ visible, onClose, onSuccess, editing }: BaseProps & { editing?: Vehicle }) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setYear(String(editing?.year ?? new Date().getFullYear()));
    setMake(editing?.make ?? "");
    setModel(editing?.model ?? "");
    setColor(editing?.color ?? "");
    setImages(editing?.image ? [editing.image] : []);
    setError("");
  }, [visible, editing]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        year: parseInt(year, 10),
        make,
        model,
        color: color || "Unknown",
        image: images[0] || DEFAULT_CAR,
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
      <FormField label="Year"><TextInput value={year} onChangeText={setYear} keyboardType="number-pad" style={formStyles.input} /></FormField>
      <FormField label="Make"><TextInput value={make} onChangeText={setMake} style={formStyles.input} /></FormField>
      <FormField label="Model"><TextInput value={model} onChangeText={setModel} style={formStyles.input} /></FormField>
      <FormField label="Color"><TextInput value={color} onChangeText={setColor} style={formStyles.input} /></FormField>
      <FormField label="Photo">
        <MultiImagePicker images={images} onChange={setImages} folder="vehicles" maxImages={1} label="Add photo" />
      </FormField>
    </FormModal>
  );
}

export function CreateEventForm({ visible, onClose, onSuccess }: BaseProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      await api.createEvent({
        title,
        description,
        location,
        city,
        date,
        time,
        image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=400&fit=crop",
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
    <FormModal visible={visible} onClose={onClose} title="Create Event" footer={<SubmitButton loading={loading} label="Create Event" onPress={submit} />}>
      {error ? <Text style={formStyles.error}>{error}</Text> : null}
      <FormField label="Title"><TextInput value={title} onChangeText={setTitle} style={formStyles.input} /></FormField>
      <FormField label="Description"><TextInput value={description} onChangeText={setDescription} style={[formStyles.input, formStyles.textarea]} multiline /></FormField>
      <FormField label="Location"><TextInput value={location} onChangeText={setLocation} style={formStyles.input} /></FormField>
      <FormField label="City"><TextInput value={city} onChangeText={setCity} style={formStyles.input} /></FormField>
      <FormField label="Date (YYYY-MM-DD)"><TextInput value={date} onChangeText={setDate} style={formStyles.input} placeholder="2026-06-20" /></FormField>
      <FormField label="Time"><TextInput value={time} onChangeText={setTime} style={formStyles.input} placeholder="7:00 PM" /></FormField>
    </FormModal>
  );
}

export function CreateListingForm({ visible, onClose, onSuccess, editing }: BaseProps & { editing?: MarketplaceListing }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(editing?.title ?? "");
    setDescription(editing?.description ?? "");
    setPrice(editing ? String(editing.price) : "");
    setLocation(editing?.location ?? "");
    setImages(editing?.images && editing.images.length > 0 ? editing.images : editing?.image ? [editing.image] : []);
    setError("");
  }, [visible, editing]);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const payload = {
        title,
        description,
        price: parseInt(price, 10) || 0,
        category: editing?.category ?? "parts",
        condition: editing?.condition ?? "good",
        location,
        images: images.length > 0 ? images : ["https://images.unsplash.com/photo-1486262715619-67b85e0b08d1?w=800&h=600&fit=crop"],
      };
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
    </FormModal>
  );
}

export function CreateMaintenanceForm({
  visible,
  onClose,
  onSuccess,
  vehicles,
}: BaseProps & { vehicles: Pick<Vehicle, "id" | "year" | "make" | "model">[] }) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mileage, setMileage] = useState("");
  const [category, setCategory] = useState("Other");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!vehicleId) {
      setError("Add a vehicle first");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api.createMaintenance({
        vehicleId,
        title,
        description,
        mileage: parseInt(mileage, 10) || 0,
        category,
        performedAt: new Date().toISOString().slice(0, 10),
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
    <FormModal visible={visible} onClose={onClose} title="Log Service" footer={<SubmitButton loading={loading} label="Save Record" onPress={submit} />}>
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
        </>
      )}
    </FormModal>
  );
}
