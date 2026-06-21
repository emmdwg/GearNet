export type MeetPin = {
  id: string;
  userId: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  createdAt: string;
  user?: { id: string; username: string; displayName: string; avatar: string };
};

export type MapMarker = {
  id: string;
  title: string;
  description?: string;
  latitude: number;
  longitude: number;
  type: "event" | "pin";
  subtitle?: string;
};
