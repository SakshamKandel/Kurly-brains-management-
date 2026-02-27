"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { Megaphone, Plus, Calendar, AlertCircle, X, Trash2 } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Dropdown from "@/components/ui/Dropdown";
import { toast } from "sonner";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  isPublished: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  author: { firstName: string; lastName: string };
}

/* ─── Priority bar color ─── */
function priColor(p: string) {
  switch (p) {
    case "URGENT": return "var(--notion-red)";
    case "HIGH": return "var(--brand-blue)";
    case "MEDIUM": return "var(--notion-text-secondary)";
    default: return "var(--notion-text-muted)";
  }
}

/* ─── Section Header ─── */
function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
      <h3 className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--notion-text-secondary)" }}>{title}</h3>
      <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
      {trailing && <span className="text-[9px] font-mono tracking-widest uppercase opacity-40" style={{ color: "var(--notion-text-secondary)" }}>{trailing}</span>}
    </div>
  );
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
  const { data: announcements = [], isLoading, mutate } = useSWR<Announcement[]>("/api/announcements", fetcher);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "MEDIUM", expiresAt: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameParts = (session?.user?.name || "").split(" ");
    const tempAnnouncement: Announcement = {
      id: `temp-${Date.now()}`,
      title: form.title,
      content: form.content,
      priority: form.priority as Announcement["priority"],
      isPublished: true,
      publishedAt: new Date().toISOString(),
      expiresAt: form.expiresAt || null,
      createdAt: new Date().toISOString(),
      author: { firstName: nameParts[0] || "", lastName: nameParts.slice(1).join(" ") || "" },
    };
    mutate([...announcements, tempAnnouncement], false);
    setShowModal(false);
    setForm({ title: "", content: "", priority: "MEDIUM", expiresAt: "" });
    toast.success("Announcement published");

    try {
      const res = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error("Failed");
      mutate();
    } catch {
      mutate(); // revert
      toast.error("Failed to create announcement");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    mutate(announcements.filter(a => a.id !== id), false);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      mutate();
      toast.success("Deleted");
    } catch {
      mutate(); // revert
      toast.error("Failed to delete");
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <PageContainer
      title="Announcements"
      icon="📢"
      action={isAdmin ? <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New</Button> : undefined}
    >
      <Breadcrumb />

      <div className="mt-6">
        <SectionHeader title="All Announcements" trailing={`${announcements.length} total`} />

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 w-full rounded-sm" />)}
          </div>
        ) : announcements.length === 0 ? (
          <EmptyState title="No announcements" description="There are no announcements to display." />
        ) : (
          <div className="flex flex-col gap-3">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="group/ann relative overflow-hidden transition-all duration-300 hover:bg-[var(--notion-bg-tertiary)]"
                style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px" }}
              >
                {/* Priority left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: priColor(a.priority) }} />

                <div className="px-5 py-4 pl-6">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h4 className="text-[14px] font-semibold" style={{ color: "var(--notion-text)" }}>{a.title}</h4>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.priority === "URGENT" ? "error" : a.priority === "HIGH" ? "warning" : "default"} size="sm">
                        {a.priority}
                      </Badge>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-1 bg-transparent border-none cursor-pointer opacity-0 group-hover/ann:opacity-100 transition-opacity"
                          style={{ color: "var(--notion-red)" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--notion-text-secondary)" }}>{a.content}</p>
                  <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-muted)" }}>
                    <span>{a.author.firstName} {a.author.lastName}</span>
                    <span className="opacity-30">·</span>
                    <span>{formatDate(a.createdAt)}</span>
                    {a.expiresAt && (
                      <>
                        <span className="opacity-30">·</span>
                        <span>Expires {formatDate(a.expiresAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Modal ═══ */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Announcement">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Title</label>
            <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full" style={{ padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px", color: "var(--notion-text)", outline: "none", fontSize: "14px" }} />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Content</label>
            <textarea required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} className="w-full" style={{ padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px", color: "var(--notion-text)", outline: "none", fontSize: "14px", resize: "vertical" }} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Priority</label>
              <Dropdown options={[{ value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent" }]} value={form.priority} onChange={val => setForm({ ...form, priority: val })} />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5" style={{ color: "var(--notion-text-secondary)" }}>Expires</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="w-full" style={{ padding: "10px 12px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px", color: "var(--notion-text)", outline: "none" }} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Publish</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
