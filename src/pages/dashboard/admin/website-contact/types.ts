export type ContactItemKey = "email" | "phone" | "whatsapp" | "location";

export type SocialMediaLink = {
  platform: string;
  url: string;
};

export type ContactItem = {
  key: ContactItemKey;
  title: string;
  detail: string;
  description: string;
  /** Only used when key === "whatsapp" */
  openingMessage?: string;
  /** Only used when key === "phone" (now Social Media) */
  socialMediaLinks?: SocialMediaLink[];
};

export const SOCIAL_MEDIA_PLATFORMS = [
  "Facebook",
  "Instagram",
  "Twitter",
  "TikTok",
  "YouTube",
] as const;

export const defaultItems: ContactItem[] = [
  {
    key: "email",
    title: "Email Us",
    detail: "hello@easymarketingassist.com",
    description: "We typically respond within 24 hours",
  },
  {
    key: "phone",
    title: "Social Media",
    detail: "",
    description: "Follow us on social media",
    socialMediaLinks: [],
  },
  {
    key: "whatsapp",
    title: "WhatsApp",
    detail: "+1 (555) 123-4567",
    description: "Quick responses for existing clients",
    openingMessage: "",
  },
  {
    key: "location",
    title: "Location",
    detail: "Remote / Worldwide",
    description: "Available for global clients",
  },
];

export function sanitizeItems(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return defaultItems;

  const byKey = new Map<ContactItemKey, ContactItem>();
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as any;
    if (!["email", "phone", "whatsapp", "location"].includes(obj.key)) continue;

    const isWhatsapp = obj.key === "whatsapp";
    const isPhone = obj.key === "phone";

    const item: ContactItem = {
      key: obj.key,
      title: typeof obj.title === "string" ? obj.title : "",
      detail: typeof obj.detail === "string" ? obj.detail : "",
      description: typeof obj.description === "string" ? obj.description : "",
      openingMessage:
        typeof obj.openingMessage === "string" ? obj.openingMessage : isWhatsapp ? "" : undefined,
      socialMediaLinks: isPhone && Array.isArray(obj.socialMediaLinks)
        ? obj.socialMediaLinks.filter(
            (l: any) => l && typeof l.platform === "string" && typeof l.url === "string"
          )
        : isPhone ? [] : undefined,
    };
    byKey.set(item.key, item);
  }

  // Keep order stable
  return defaultItems.map((d) => byKey.get(d.key) ?? d);
}
