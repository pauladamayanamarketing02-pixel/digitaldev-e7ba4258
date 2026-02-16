import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCcw, Trash2, Save, StickyNote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuditLogRow = {
  id: string;
  created_at: string;
  actor_user_id: string;
  provider: string;
  action: string;
  metadata: Record<string, any>;
};

function formatTime(v: unknown) {
  const s = typeof v === "string" ? v : null;
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

function WebsiteMetadataView({ metadata }: { metadata: Record<string, any> }) {
  const m = metadata ?? {};
  const fields = [
    { label: "Nama Domain", value: m.domain ?? "-" },
    { label: "Durasi Paket", value: m.subscription_years ? `${m.subscription_years} tahun` : "-" },
    { label: "Nama Template", value: m.template_name ?? "-" },
    { label: "Nama Depan", value: m.first_name ?? "-" },
    { label: "Nama Belakang", value: m.last_name ?? "-" },
    { label: "Email", value: m.email ?? "-" },
    { label: "Nomor Telp/WA", value: m.phone ?? "-" },
    { label: "Nama Bisnis", value: m.business_name || "-" },
    { label: "Provinsi", value: m.province ?? "-" },
    { label: "Kota/Kab", value: m.city ?? "-" },
  ];

  const addOns = m.add_ons ?? {};
  const subAddOns = m.subscription_add_ons ?? {};
  const addOnKeys = Object.keys(addOns);
  const subAddOnKeys = Object.keys(subAddOns);

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-2 text-sm">
            <span className="font-medium text-muted-foreground w-36 shrink-0">{f.label}</span>
            <span className="text-foreground">{String(f.value)}</span>
          </div>
        ))}
      </div>
      {addOnKeys.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Add-ons</p>
          <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(addOns, null, 2)}</pre>
        </div>
      )}
      {subAddOnKeys.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Subscription Add-ons</p>
          <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(subAddOns, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function MarketingMetadataView({ metadata }: { metadata: Record<string, any> }) {
  const m = metadata ?? {};
  const fields = [
    { label: "Plan", value: m.package_name ?? "-" },
    { label: "Durasi Paket", value: m.subscription_years ? `${m.subscription_years} tahun` : "-" },
    { label: "Nama Depan", value: m.first_name ?? "-" },
    { label: "Nama Belakang", value: m.last_name ?? "-" },
    { label: "Email", value: m.email ?? "-" },
    { label: "Nomor Telp/WA", value: m.phone ?? "-" },
    { label: "Nama Bisnis", value: m.business_name || "-" },
    { label: "Provinsi", value: m.province ?? "-" },
    { label: "Kota/Kab", value: m.city ?? "-" },
  ];

  const addOns = m.add_ons ?? {};
  const subAddOns = m.subscription_add_ons ?? {};
  const addOnKeys = Object.keys(addOns);
  const subAddOnKeys = Object.keys(subAddOns);

  return (
    <div className="space-y-3">
      <div className="grid gap-2">
        {fields.map((f) => (
          <div key={f.label} className="flex gap-2 text-sm">
            <span className="font-medium text-muted-foreground w-36 shrink-0">{f.label}</span>
            <span className="text-foreground">{String(f.value)}</span>
          </div>
        ))}
      </div>
      {addOnKeys.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Add-ons</p>
          <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(addOns, null, 2)}</pre>
        </div>
      )}
      {subAddOnKeys.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Subscription Add-ons</p>
          <pre className="rounded bg-muted p-2 text-xs">{JSON.stringify(subAddOns, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function FollowUpTable({
  items,
  loading,
  type,
  onRead,
  onDelete,
}: {
  items: AuditLogRow[];
  loading: boolean;
  type: "website" | "marketing";
  onRead: (item: AuditLogRow) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">
          {type === "website" ? "Request Website" : "Request Digital Marketing"} ({items.length})
        </CardTitle>
        {loading ? <span className="text-sm text-muted-foreground">Memuat…</span> : null}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>{type === "website" ? "Domain" : "Plan"}</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => {
              const m = it.metadata ?? {};
              const name = `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim() || "-";
              const email = m.email ?? "-";
              const hasNote = Boolean((m as any)?._note);
              const keyCol = type === "website" ? (m.domain ?? "-") : (m.package_name ?? "-");

              return (
                <TableRow key={it.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(it.created_at)}
                  </TableCell>
                  <TableCell className="font-medium truncate max-w-[180px]">{keyCol}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="truncate text-sm font-medium">{name}</span>
                      <span className="text-xs text-muted-foreground truncate">{email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {hasNote ? (
                      <StickyNote className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRead(it)} title="Read">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus request ini?</AlertDialogTitle>
                            <AlertDialogDescription>Data ini akan dihapus permanen.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(it.id)}>Hapus</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {!loading && items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Belum ada request.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminAuditLogs() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuditLogRow[]>([]);
  const [selectedItem, setSelectedItem] = useState<AuditLogRow | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [tab, setTab] = useState<"website" | "marketing">("website");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("super_admin_audit_logs")
        .select("id,created_at,actor_user_id,provider,action,metadata")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data as AuditLogRow[]) ?? []);
    } catch (e: any) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const websiteItems = useMemo(() => items.filter((i) => i.action === "order_website_pay"), [items]);
  const marketingItems = useMemo(() => items.filter((i) => i.action === "order_billing_pay"), [items]);

  const handleRead = (item: AuditLogRow) => {
    setSelectedItem(item);
    setNote((item.metadata as any)?._note ?? "");
  };

  const handleSaveNote = async () => {
    if (!selectedItem) return;
    setSavingNote(true);
    try {
      const newMetadata = { ...selectedItem.metadata, _note: note };
      const { error } = await (supabase as any)
        .from("super_admin_audit_logs")
        .update({ metadata: newMetadata })
        .eq("id", selectedItem.id);
      if (error) throw error;

      setItems((prev) =>
        prev.map((i) => (i.id === selectedItem.id ? { ...i, metadata: newMetadata } : i))
      );
      setSelectedItem((prev) => prev ? { ...prev, metadata: newMetadata } : null);
      toast.success("Note tersimpan");
    } catch (e: any) {
      toast.error("Gagal menyimpan note");
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("super_admin_audit_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
      toast.success("Log dihapus");
    } catch (e: any) {
      console.error("Delete failed:", e);
      toast.error("Gagal menghapus");
    }
  };

  const isWebsite = selectedItem?.action === "order_website_pay";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-foreground">Follow Up</h1>
          <p className="text-sm text-muted-foreground">Daftar request order website & digital marketing.</p>
        </div>

        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="website">Website ({websiteItems.length})</TabsTrigger>
          <TabsTrigger value="marketing">Marketing ({marketingItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="mt-4">
          <FollowUpTable items={websiteItems} loading={loading} type="website" onRead={handleRead} onDelete={handleDelete} />
        </TabsContent>

        <TabsContent value="marketing" className="mt-4">
          <FollowUpTable items={marketingItems} loading={loading} type="marketing" onRead={handleRead} onDelete={handleDelete} />
        </TabsContent>
      </Tabs>

      {/* Read Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isWebsite ? "Request Website" : "Request Digital Marketing"}
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-6">
              <div className="flex gap-2 text-sm">
                <span className="font-medium text-muted-foreground w-36 shrink-0">Waktu Request</span>
                <span>{formatTime(selectedItem.created_at)}</span>
              </div>

              {isWebsite ? (
                <WebsiteMetadataView metadata={selectedItem.metadata} />
              ) : (
                <MarketingMetadataView metadata={selectedItem.metadata} />
              )}

              {/* Note section */}
              <div className="space-y-2 pt-4 border-t">
                <p className="text-sm font-medium text-foreground">Note</p>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tambahkan catatan follow up..."
                  rows={3}
                />
                <div className="flex items-center justify-between gap-2">
                  <Button size="sm" onClick={handleSaveNote} disabled={savingNote}>
                    <Save className="h-4 w-4 mr-2" />
                    {savingNote ? "Menyimpan..." : "Save Note"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus request ini?</AlertDialogTitle>
                        <AlertDialogDescription>Data ini akan dihapus permanen.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleDelete(selectedItem.id);
                            setSelectedItem(null);
                          }}
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
