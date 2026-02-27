"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/fetcher";
import { Clock, Download, PlayCircle, StopCircle, Calendar } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";
import Avatar from "@/components/ui/Avatar";

interface AttendanceRecord {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string | null;
    status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
    duration: number | null;
}

interface AdminAttendanceRecord extends AttendanceRecord {
    user: {
        id: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        department: string | null;
    };
}

/* ─── Section Header ─── */
function SectionHeader({ title, trailing }: { title: string; trailing?: string }) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand-blue)" }} />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.35em]" style={{ color: "var(--notion-text-secondary)" }}>
                {title}
            </h3>
            <div className="flex-1 h-px" style={{ background: "var(--notion-border)" }} />
            {trailing && (
                <span className="text-[9px] font-mono tracking-widest uppercase opacity-40" style={{ color: "var(--notion-text-secondary)" }}>
                    {trailing}
                </span>
            )}
        </div>
    );
}

export default function AttendancePage() {
    const { data: session } = useSession();
    const { data: records = [], isLoading: loading, mutate } = useSWR<AttendanceRecord[]>("/api/attendance", fetcher);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [clockLoading, setClockLoading] = useState(false);

    const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";
    const { data: allRecords = [], isLoading: historyLoading } = useSWR<AdminAttendanceRecord[]>(
        isAdmin ? "/api/attendance/history" : null,
        fetcher
    );

    const today = new Date().toISOString().split('T')[0];
    const todayRec = records.find((r: AttendanceRecord) => r.date.startsWith(today));
    if (todayRec && (todayRec !== todayRecord || (!todayRec.checkOut) !== isCheckedIn)) {
        setTodayRecord(todayRec);
        setIsCheckedIn(!todayRec.checkOut);
    }

    const handleClockAction = async () => {
        const action = isCheckedIn ? "clock-out" : "clock-in";
        setClockLoading(true);
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                mutate();
                toast.success(isCheckedIn ? "Clocked out successfully" : "Clocked in successfully");
            } else { toast.error("Clock action failed"); }
        } catch (error) { console.error("Clock action failed:", error); toast.error("Clock action failed"); }
        finally { setClockLoading(false); }
    };

    const formatTime = (isoString?: string | null) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (mins: number | null) => {
        if (mins === null || mins === undefined) return "-";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const columns = [
        {
            key: "date", header: "Date",
            render: (val: string) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={12} style={{ color: "var(--notion-text-muted)" }} />
                    <span className="text-[12px]">{new Date(val).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </span>
            )
        },
        { key: "checkIn", header: "Check In", render: (val: string) => <span className="font-mono text-[12px]">{formatTime(val)}</span> },
        { key: "checkOut", header: "Check Out", render: (val: string) => <span className="font-mono text-[12px]">{formatTime(val)}</span> },
        { key: "duration", header: "Duration", render: (val: number) => <span className="text-[12px]" style={{ color: "var(--notion-text-secondary)" }}>{formatDuration(val)}</span> },
        {
            key: "status", header: "Status",
            render: (val: string) => {
                const colors: Record<string, any> = { PRESENT: "success", LATE: "warning", ABSENT: "error", HALF_DAY: "info" };
                return <Badge variant={colors[val]}>{val}</Badge>;
            }
        }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminColumns: any[] = [
        {
            key: "user", header: "Employee",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, row: AdminAttendanceRecord) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Avatar name={`${row.user.firstName} ${row.user.lastName}`} size="sm" src={row.user.avatar || undefined} />
                    <div>
                        <div className="text-[13px] font-medium">{row.user.firstName} {row.user.lastName}</div>
                        {row.user.department && <div className="text-[11px]" style={{ color: "var(--notion-text-muted)" }}>{row.user.department}</div>}
                    </div>
                </div>
            )
        },
        {
            key: "date", header: "Date",
            render: (val: string) => (
                <span className="text-[12px]">{new Date(val).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            )
        },
        { key: "clockIn", header: "In", render: (val: string) => <span className="font-mono text-[12px]">{formatTime(val)}</span> },
        { key: "clockOut", header: "Out", render: (val: string) => <span className="font-mono text-[12px]">{formatTime(val)}</span> },
        {
            key: "status", header: "Status",
            render: (val: string) => {
                const colors: Record<string, any> = { PRESENT: "success", LATE: "warning", ABSENT: "error", HALF_DAY: "info" };
                return <Badge variant={colors[val]} size="sm">{val}</Badge>;
            }
        },
    ];

    return (
        <PageContainer title="Attendance" icon="🕐">
            <Breadcrumb />

            {/* ═══ Clock Panel ═══ */}
            <div className="mt-6 mb-8">
                <div className="responsive-stack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                        className="relative overflow-hidden w-full"
                        style={{ maxWidth: "420px", background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)", borderRadius: "2px" }}
                    >
                        {/* accent */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: isCheckedIn ? "var(--notion-green)" : "var(--brand-blue)" }} />

                        <div className="flex items-center gap-5 px-5 py-4 pl-6">
                            <div
                                className="w-10 h-10 flex items-center justify-center shrink-0"
                                style={{
                                    background: isCheckedIn ? "var(--notion-green-bg)" : "var(--notion-bg-tertiary)",
                                    color: isCheckedIn ? "var(--notion-green)" : "var(--notion-text)",
                                    borderRadius: "2px",
                                }}
                            >
                                <Clock size={20} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--notion-text-secondary)" }}>
                                    {isCheckedIn ? "Currently Working" : "Not working yet"}
                                </div>
                                <div className="text-xl font-bold font-mono" style={{ color: "var(--notion-text)" }}>
                                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <Button
                                variant={isCheckedIn ? "danger" : "primary"}
                                onClick={handleClockAction}
                                loading={clockLoading}
                                icon={isCheckedIn ? <StopCircle size={14} /> : <PlayCircle size={14} />}
                            >
                                {isCheckedIn ? "Clock Out" : "Clock In"}
                            </Button>
                        </div>
                    </div>

                    <Button variant="ghost" icon={<Download size={14} />}>Export Report</Button>
                </div>
            </div>

            {/* ═══ My History ═══ */}
            {loading ? (
                <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full rounded-sm" />)}
                </div>
            ) : records.length > 0 ? (
                <>
                    <SectionHeader title="My History" trailing={`${records.length} records`} />
                    <Table columns={columns} data={records} />
                </>
            ) : (
                <EmptyState
                    title="No attendance records"
                    description="Your attendance history will appear here once you start clocking in."
                />
            )}

            {/* ═══ Admin: Team Attendance History ═══ */}
            {isAdmin && (
                <div style={{ marginTop: "40px" }}>
                    <SectionHeader title="Team Attendance History" trailing={`${allRecords.length} records`} />
                    {historyLoading ? (
                        <div className="flex flex-col gap-2">
                            {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full rounded-sm" />)}
                        </div>
                    ) : allRecords.length > 0 ? (
                        <Table columns={adminColumns} data={allRecords} />
                    ) : (
                        <EmptyState
                            title="No team records"
                            description="Team attendance records will appear here."
                        />
                    )}
                </div>
            )}
        </PageContainer>
    );
}
