"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
    Plus,
    Search,
    Calendar,
    Video,
    MapPin,
    Users,
    Clock,
    Check,
    X,
    HelpCircle,
} from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";
import { format, isToday, isTomorrow, startOfDay, addDays, isSameDay } from "date-fns";

interface Meeting {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    location: string | null;
    isVirtual: boolean;
    meetLink: string | null;
    createdBy: { id: string; firstName: string; lastName: string; avatar: string | null };
    attendees: {
        id: string;
        status: "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
        user: { id: string; firstName: string; lastName: string; avatar: string | null };
    }[];
    createdAt: string;
}

interface User {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const statusIcon: Record<string, React.ReactNode> = {
    ACCEPTED: <Check size={12} className="text-green-500" />,
    DECLINED: <X size={12} className="text-red-500" />,
    PENDING: <HelpCircle size={12} className="text-yellow-500" />,
    TENTATIVE: <HelpCircle size={12} className="text-blue-500" />,
};

const statusColors: Record<string, string> = {
    ACCEPTED: "#22c55e",
    DECLINED: "#ef4444",
    PENDING: "#eab308",
    TENTATIVE: "#3b82f6",
};

export default function MeetingsPage() {
    const { data: session } = useSession();
    const { data: meetings, mutate } = useSWR<Meeting[]>("/api/meetings", fetcher);
    const { data: users } = useSWR<User[]>("/api/users", fetcher);

    const [showModal, setShowModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const { success, error: showError } = useToast();

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        isVirtual: false,
        meetLink: "",
        attendeeIds: [] as string[],
    });

    const loading = !meetings;

    // Group meetings by date
    const groupedMeetings = useMemo(() => {
        if (!meetings) return new Map<string, Meeting[]>();

        const filtered = meetings.filter((m) =>
            m.title.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const groups = new Map<string, Meeting[]>();

        filtered.forEach((meeting) => {
            const dateKey = startOfDay(new Date(meeting.startTime)).toISOString();
            if (!groups.has(dateKey)) groups.set(dateKey, []);
            groups.get(dateKey)!.push(meeting);
        });

        // Sort each group by start time
        groups.forEach((items) => {
            items.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        });

        return groups;
    }, [meetings, searchQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/meetings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                mutate();
                setShowModal(false);
                resetForm();
                success("Meeting scheduled");
            } else {
                const data = await res.json();
                showError(data.error || "Failed to create meeting");
            }
        } catch (err) {
            showError("Something went wrong");
        }
    };

    const handleRespond = async (meetingId: string, status: "ACCEPTED" | "DECLINED" | "TENTATIVE") => {
        try {
            const res = await fetch(`/api/meetings/${meetingId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                mutate();
                success(status === "ACCEPTED" ? "Accepted" : status === "DECLINED" ? "Declined" : "Marked tentative");
            }
        } catch (err) {
            showError("Failed to respond");
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            startTime: "",
            endTime: "",
            location: "",
            isVirtual: false,
            meetLink: "",
            attendeeIds: [],
        });
    };

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return "Today";
        if (isTomorrow(date)) return "Tomorrow";
        return format(date, "EEEE, MMM d");
    };

    const getMyAttendeeStatus = (meeting: Meeting) => {
        return meeting.attendees.find((a) => a.user.id === session?.user?.id)?.status;
    };

    return (
        <PageContainer
            title="Meetings"
            icon="📅"
            action={
                <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
                    Schedule Meeting
                </Button>
            }
        >
            <Breadcrumb />

            {/* Filter Bar */}
            <div
                style={{
                    margin: "24px 0",
                    borderBottom: "1px solid var(--notion-divider)",
                    paddingBottom: "16px",
                }}
            >
                <Input
                    placeholder="Search meetings..."
                    icon={<Search size={14} />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    fullWidth={false}
                />
            </div>

            {/* Meetings List */}
            {loading ? (
                <div className="skeleton" style={{ width: "100%", height: "300px" }} />
            ) : groupedMeetings.size === 0 ? (
                <EmptyState
                    icon={<Calendar size={48} />}
                    title="No meetings scheduled"
                    description="Schedule your first meeting to get started."
                    action={
                        <Button icon={<Plus size={14} />} onClick={() => setShowModal(true)}>
                            Schedule Meeting
                        </Button>
                    }
                />
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {Array.from(groupedMeetings.entries())
                        .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                        .map(([dateKey, dayMeetings]) => (
                            <div key={dateKey}>
                                <h3
                                    style={{
                                        margin: "0 0 12px 0",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        color: "var(--notion-text-muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {formatDateLabel(dateKey)}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                    {dayMeetings.map((meeting) => {
                                        const myStatus = getMyAttendeeStatus(meeting);
                                        return (
                                            <div
                                                key={meeting.id}
                                                style={{
                                                    padding: "16px",
                                                    background: "var(--notion-bg-secondary)",
                                                    borderRadius: "var(--radius-md)",
                                                    borderLeft: `4px solid ${statusColors[myStatus || "PENDING"]}`,
                                                }}
                                            >
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <div style={{ flex: 1 }}>
                                                        <h4
                                                            style={{
                                                                margin: "0 0 4px 0",
                                                                fontSize: "16px",
                                                                fontWeight: 500,
                                                                color: "var(--notion-text)",
                                                            }}
                                                        >
                                                            {meeting.title}
                                                        </h4>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "16px",
                                                                fontSize: "13px",
                                                                color: "var(--notion-text-secondary)",
                                                            }}
                                                        >
                                                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <Clock size={12} />
                                                                {format(new Date(meeting.startTime), "h:mm a")} -{" "}
                                                                {format(new Date(meeting.endTime), "h:mm a")}
                                                            </span>
                                                            {meeting.location && (
                                                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                    <MapPin size={12} />
                                                                    {meeting.location}
                                                                </span>
                                                            )}
                                                            {meeting.isVirtual && (
                                                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                    <Video size={12} />
                                                                    Virtual
                                                                </span>
                                                            )}
                                                        </div>
                                                        {meeting.description && (
                                                            <p
                                                                style={{
                                                                    margin: "8px 0 0 0",
                                                                    fontSize: "13px",
                                                                    color: "var(--notion-text-muted)",
                                                                }}
                                                            >
                                                                {meeting.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Response Buttons */}
                                                    {myStatus && session?.user?.id !== meeting.createdBy.id && (
                                                        <div style={{ display: "flex", gap: "4px" }}>
                                                            <button
                                                                onClick={() => handleRespond(meeting.id, "ACCEPTED")}
                                                                style={{
                                                                    padding: "6px 10px",
                                                                    border: myStatus === "ACCEPTED" ? "1px solid #22c55e" : "1px solid var(--notion-border)",
                                                                    background: myStatus === "ACCEPTED" ? "#22c55e20" : "transparent",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    cursor: "pointer",
                                                                    color: myStatus === "ACCEPTED" ? "#22c55e" : "var(--notion-text-muted)",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespond(meeting.id, "DECLINED")}
                                                                style={{
                                                                    padding: "6px 10px",
                                                                    border: myStatus === "DECLINED" ? "1px solid #ef4444" : "1px solid var(--notion-border)",
                                                                    background: myStatus === "DECLINED" ? "#ef444420" : "transparent",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    cursor: "pointer",
                                                                    color: myStatus === "DECLINED" ? "#ef4444" : "var(--notion-text-muted)",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                Decline
                                                            </button>
                                                            <button
                                                                onClick={() => handleRespond(meeting.id, "TENTATIVE")}
                                                                style={{
                                                                    padding: "6px 10px",
                                                                    border: myStatus === "TENTATIVE" ? "1px solid #3b82f6" : "1px solid var(--notion-border)",
                                                                    background: myStatus === "TENTATIVE" ? "#3b82f620" : "transparent",
                                                                    borderRadius: "var(--radius-sm)",
                                                                    cursor: "pointer",
                                                                    color: myStatus === "TENTATIVE" ? "#3b82f6" : "var(--notion-text-muted)",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                Maybe
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Attendees */}
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        marginTop: "12px",
                                                        paddingTop: "12px",
                                                        borderTop: "1px solid var(--notion-divider)",
                                                    }}
                                                >
                                                    <Users size={12} style={{ color: "var(--notion-text-muted)" }} />
                                                    <div style={{ display: "flex", gap: "-4px" }}>
                                                        {meeting.attendees.slice(0, 5).map((attendee, idx) => (
                                                            <div
                                                                key={attendee.id}
                                                                title={`${attendee.user.firstName} ${attendee.user.lastName} - ${attendee.status}`}
                                                                style={{
                                                                    width: "24px",
                                                                    height: "24px",
                                                                    borderRadius: "50%",
                                                                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontSize: "10px",
                                                                    color: "white",
                                                                    marginLeft: idx > 0 ? "-6px" : 0,
                                                                    border: `2px solid ${statusColors[attendee.status]}`,
                                                                    position: "relative",
                                                                    overflow: "hidden",
                                                                }}
                                                            >
                                                                {attendee.user.avatar ? (
                                                                    <img
                                                                        src={attendee.user.avatar}
                                                                        alt=""
                                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                                    />
                                                                ) : (
                                                                    `${attendee.user.firstName[0]}${attendee.user.lastName[0]}`
                                                                )}
                                                            </div>
                                                        ))}
                                                        {meeting.attendees.length > 5 && (
                                                            <div
                                                                style={{
                                                                    width: "24px",
                                                                    height: "24px",
                                                                    borderRadius: "50%",
                                                                    background: "var(--notion-bg-tertiary)",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    fontSize: "10px",
                                                                    color: "var(--notion-text-muted)",
                                                                    marginLeft: "-6px",
                                                                    border: "2px solid var(--notion-bg-secondary)",
                                                                }}
                                                            >
                                                                +{meeting.attendees.length - 5}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: "12px", color: "var(--notion-text-muted)", marginLeft: "8px" }}>
                                                        {meeting.attendees.filter((a) => a.status === "ACCEPTED").length} accepted
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Create Meeting Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Schedule Meeting">
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <Input
                        label="Meeting Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        autoFocus
                        placeholder="Weekly Standup"
                    />

                    <div className="responsive-stack">
                        <Input
                            type="datetime-local"
                            label="Start Time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            required
                        />
                        <Input
                            type="datetime-local"
                            label="End Time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            required
                        />
                    </div>

                    <div className="responsive-stack">
                        <Input
                            label="Location (Optional)"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Conference Room A"
                        />
                        <div style={{ flex: 1 }}>
                            <label
                                className="text-xs text-muted"
                                style={{ display: "block", marginBottom: "4px" }}
                            >
                                Meeting Type
                            </label>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isVirtual: false })}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        border: !formData.isVirtual ? "1px solid var(--notion-primary)" : "1px solid var(--notion-border)",
                                        background: !formData.isVirtual ? "var(--notion-primary-light)" : "transparent",
                                        borderRadius: "var(--radius-sm)",
                                        cursor: "pointer",
                                        color: !formData.isVirtual ? "var(--notion-primary)" : "var(--notion-text-muted)",
                                        fontSize: "13px",
                                    }}
                                >
                                    <MapPin size={14} style={{ marginRight: "4px" }} />
                                    In-Person
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isVirtual: true })}
                                    style={{
                                        flex: 1,
                                        padding: "10px",
                                        border: formData.isVirtual ? "1px solid var(--notion-primary)" : "1px solid var(--notion-border)",
                                        background: formData.isVirtual ? "var(--notion-primary-light)" : "transparent",
                                        borderRadius: "var(--radius-sm)",
                                        cursor: "pointer",
                                        color: formData.isVirtual ? "var(--notion-primary)" : "var(--notion-text-muted)",
                                        fontSize: "13px",
                                    }}
                                >
                                    <Video size={14} style={{ marginRight: "4px" }} />
                                    Virtual
                                </button>
                            </div>
                        </div>
                    </div>

                    {formData.isVirtual && (
                        <Input
                            label="Meeting Link"
                            value={formData.meetLink}
                            onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                            placeholder="https://meet.google.com/..."
                        />
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label className="text-xs text-muted" style={{ display: "block", marginBottom: "4px" }}>
                            Description (Optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={2}
                            style={{
                                width: "100%",
                                background: "var(--notion-bg-secondary)",
                                border: "1px solid var(--notion-border)",
                                color: "var(--notion-text)",
                                padding: "8px 12px",
                                borderRadius: "var(--radius-sm)",
                                resize: "vertical",
                                fontSize: "14px",
                                fontFamily: "var(--font-body)",
                                outline: "none",
                            }}
                            placeholder="Meeting agenda..."
                        />
                    </div>

                    {/* Attendees */}
                    <div>
                        <label className="text-xs text-muted" style={{ display: "block", marginBottom: "8px" }}>
                            Invite Attendees
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "8px",
                                padding: "12px",
                                background: "var(--notion-bg-secondary)",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--notion-border)",
                                maxHeight: "150px",
                                overflowY: "auto",
                            }}
                        >
                            {(users || [])
                                .filter((u) => u.id !== session?.user?.id)
                                .map((user) => {
                                    const isSelected = formData.attendeeIds.includes(user.id);
                                    return (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => {
                                                setFormData({
                                                    ...formData,
                                                    attendeeIds: isSelected
                                                        ? formData.attendeeIds.filter((id) => id !== user.id)
                                                        : [...formData.attendeeIds, user.id],
                                                });
                                            }}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                padding: "6px 10px",
                                                borderRadius: "999px",
                                                border: isSelected
                                                    ? "1px solid var(--notion-primary)"
                                                    : "1px solid var(--notion-border)",
                                                background: isSelected ? "var(--notion-primary-light)" : "transparent",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                                color: isSelected ? "var(--notion-primary)" : "var(--notion-text-secondary)",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "20px",
                                                    height: "20px",
                                                    borderRadius: "50%",
                                                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: "9px",
                                                    color: "white",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt=""
                                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                    />
                                                ) : (
                                                    `${user.firstName[0]}${user.lastName[0]}`
                                                )}
                                            </div>
                                            {user.firstName} {user.lastName}
                                        </button>
                                    );
                                })}
                        </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Schedule Meeting
                        </Button>
                    </div>
                </form>
            </Modal>
        </PageContainer>
    );
}
