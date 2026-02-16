import type React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { ContactItem, ContactItemKey, SocialMediaLink } from "./types";
import { SOCIAL_MEDIA_PLATFORMS } from "./types";

type Props = {
  item: ContactItem;
  icon: React.ElementType;
  disabled: boolean;
  onChange: (key: ContactItemKey, patch: Partial<Omit<ContactItem, "key">>) => void;
};

export function ContactItemCard({ item, icon: Icon, disabled, onChange }: Props) {
  const isSocialMedia = item.key === "phone";
  const links = item.socialMediaLinks ?? [];

  const updateLink = (idx: number, patch: Partial<SocialMediaLink>) => {
    const next = links.map((l, i) => (i === idx ? { ...l, ...patch } : l));
    onChange(item.key, { socialMediaLinks: next });
  };

  const addLink = () => {
    const usedPlatforms = new Set(links.map((l) => l.platform));
    const available = SOCIAL_MEDIA_PLATFORMS.find((p) => !usedPlatforms.has(p));
    if (!available) return;
    onChange(item.key, { socialMediaLinks: [...links, { platform: available, url: "" }] });
  };

  const removeLink = (idx: number) => {
    onChange(item.key, { socialMediaLinks: links.filter((_, i) => i !== idx) });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">
              {isSocialMedia ? "SOCIAL MEDIA" : item.key.toUpperCase()}
            </CardTitle>
            <CardDescription>
              {isSocialMedia ? "Tambahkan link Social Media." : "Ubah teks yang ditampilkan."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`${item.key}-title`}>Title</Label>
          <Input
            id={`${item.key}-title`}
            value={item.title}
            disabled={disabled}
            onChange={(e) => onChange(item.key, { title: e.target.value })}
          />
        </div>

        {!isSocialMedia && (
          <div className="space-y-2">
            <Label htmlFor={`${item.key}-detail`}>Detail</Label>
            <Input
              id={`${item.key}-detail`}
              value={item.detail}
              disabled={disabled}
              onChange={(e) => onChange(item.key, { detail: e.target.value })}
            />
          </div>
        )}

        {item.key === "whatsapp" && (
          <div className="space-y-2">
            <Label htmlFor={`${item.key}-openingMessage`}>Whatsapp Message</Label>
            <Textarea
              id={`${item.key}-openingMessage`}
              value={item.openingMessage ?? ""}
              disabled={disabled}
              rows={4}
              placeholder="Contoh: Hallo !!!\nSaya ingin bertanya tentang..."
              onChange={(e) => onChange(item.key, { openingMessage: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Saat user klik WhatsApp di halaman /contact, teks ini akan otomatis terisi sebagai chat.
            </p>
          </div>
        )}

        {isSocialMedia && (
          <div className="space-y-3">
            <Label>Social Media Links</Label>
            {links.map((link, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select
                  value={link.platform}
                  disabled={disabled}
                  onValueChange={(v) => updateLink(idx, { platform: v })}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOCIAL_MEDIA_PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="https://..."
                  value={link.url}
                  disabled={disabled}
                  onChange={(e) => updateLink(idx, { url: e.target.value })}
                  className="flex-1"
                />
                {!disabled && (
                  <Button variant="ghost" size="icon" onClick={() => removeLink(idx)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            {!disabled && links.length < SOCIAL_MEDIA_PLATFORMS.length && (
              <Button variant="outline" size="sm" onClick={addLink}>
                <Plus className="h-4 w-4 mr-1" /> Add Social Media
              </Button>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor={`${item.key}-desc`}>Description</Label>
          <Input
            id={`${item.key}-desc`}
            value={item.description}
            disabled={disabled}
            onChange={(e) => onChange(item.key, { description: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
