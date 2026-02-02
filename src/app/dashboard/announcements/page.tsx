"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Megaphone, Plus, Calendar, AlertCircle, X, Trash2 } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Badge from "@/components/ui/Badge";
import Dropdown from "@/components/ui/Dropdown";

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

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "MEDIUM",
    isPublished: true,
    expiresAt: "",
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        fetchAnnouncements();
        setShowModal(false);
        setFormData({
          title: "",
          content: "",
          priority: "MEDIUM",
          isPublished: true,
          expiresAt: "",
        });
      }
    } catch (error) {
      console.error("Failed to create announcement:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      setAnnouncements(prev => prev.filter(a => a.id !== id)); // Optimistic

      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        fetchAnnouncements(); // Revert
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      fetchAnnouncements();
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <PageContainer
      title="Announcements"
      icon="📢"
      action={isAdmin ? <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>New Post</Button> : null}
    >
      <Breadcrumb />

      <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div className="skeleton" style={{ width: '100%', height: '200px' }} />
        ) : announcements.length > 0 ? (
          announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="notion-card hover-bg"
              style={{
                padding: '24px',
                border: '1px solid var(--notion-border)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    padding: '4px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--notion-pink-bg)',
                    color: 'var(--notion-pink)'
                  }}>
                    <Megaphone size={16} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--notion-text)' }}>
                    {announcement.title}
                  </h3>
                </div>
                {isAdmin && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(announcement.id)}>
                    <Trash2 size={14} color="var(--notion-red)" />
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="text-xs text-muted">
                  {formatDate(announcement.publishedAt || announcement.createdAt)}
                </span>
                <span className="text-xs text-muted">•</span>
                <span className="text-xs text-muted">
                  {announcement.author.firstName} {announcement.author.lastName}
                </span>
                {announcement.priority === 'URGENT' && (
                  <Badge variant="error" size="sm">Urgent</Badge>
                )}
              </div>

              <div style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--notion-text)', whiteSpace: 'pre-wrap' }}>
                {announcement.content}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No announcements yet"
            description="Important updates will be posted here."
            action={isAdmin ? <Button onClick={() => setShowModal(true)}>Create Announcement</Button> : null}
          />
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Announcement">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            autoFocus
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="text-xs text-muted">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={5}
              style={{
                background: 'transparent',
                border: '1px solid var(--notion-border)',
                color: 'var(--notion-text)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                resize: 'vertical',
                fontSize: '14px',
                fontFamily: 'var(--font-body)'
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>Priority</label>
              <Dropdown
                options={[
                  { value: "LOW", label: "Low" },
                  { value: "MEDIUM", label: "Medium" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" }
                ]}
                value={formData.priority}
                onChange={(val) => setFormData({ ...formData, priority: val })}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                type="date"
                label="Expires (Optional)"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Post Announcement</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}
