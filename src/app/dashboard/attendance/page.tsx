"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Clock, Download, PlayCircle, StopCircle, Calendar } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/layout/Breadcrumb";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

interface AttendanceRecord {
    id: string;
    date: string;
    checkIn: string;
    checkOut: string | null;
    status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY";
    duration: number | null; // in minutes
}

export default function AttendancePage() {
    const { data: session } = useSession();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await fetch("/api/attendance");
            if (res.ok) {
                const data = await res.json();
                setRecords(data);

                // Check if checked in today
                const today = new Date().toISOString().split('T')[0];
                const todayRec = data.find((r: AttendanceRecord) => r.date.startsWith(today));
                if (todayRec) {
                    setTodayRecord(todayRec);
                    setIsCheckedIn(!todayRec.checkOut);
                }
            }
        } catch (error) {
            console.error("Failed to fetch attendance:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClockAction = async () => {
        const action = isCheckedIn ? "clock-out" : "clock-in";
        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            });
            if (res.ok) {
                fetchAttendance();
            }
        } catch (error) {
            console.error("Clock action failed:", error);
        }
    };

    const formatTime = (isoString?: string | null) => {
        if (!isoString) return "-";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDuration = (mins: number | null) => {
        if (!mins) return "-";
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    // Columns for the Notion-style table
    const columns = [
        {
            key: "date",
            header: "Date",
            render: (val: string) => (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={14} className="text-muted" />
                    {new Date(val).toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
            )
        },
        {
            key: "checkIn",
            header: "Check In",
            render: (val: string) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatTime(val)}</span>
        },
        {
            key: "checkOut",
            header: "Check Out",
            render: (val: string) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{formatTime(val)}</span>
        },
        {
            key: "duration",
            header: "Duration",
            render: (val: number) => <span style={{ color: "var(--notion-text-secondary)" }}>{formatDuration(val)}</span>
        },
        {
            key: "status",
            header: "Status",
            render: (val: string) => {
                const colors: Record<string, any> = {
                    PRESENT: "success",
                    LATE: "warning",
                    ABSENT: "error",
                    HALF_DAY: "info"
                };
                return <Badge variant={colors[val]}>{val}</Badge>;
            }
        }
    ];

    return (
        <PageContainer title="Attendance" icon="🕐">
            <Breadcrumb />

            {/* Top Action Area */}
            <div className="responsive-stack" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', marginTop: '24px' }}>
                <Card padding="md" style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%', maxWidth: '400px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        borderRadius: '50%',
                        backgroundColor: isCheckedIn ? 'var(--notion-green-bg)' : 'var(--notion-bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: isCheckedIn ? 'var(--notion-green)' : 'var(--notion-text)'
                    }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--notion-text-secondary)' }}>
                            {isCheckedIn ? "Currently Working" : "Not working yet"}
                        </div>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--notion-text)' }}>
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                    <Button
                        variant={isCheckedIn ? "danger" : "primary"} // Use danger for Stop
                        onClick={handleClockAction}
                        style={{ marginLeft: 'auto' }}
                        icon={isCheckedIn ? <StopCircle size={16} /> : <PlayCircle size={16} />}
                    >
                        {isCheckedIn ? "Clock Out" : "Clock In"}
                    </Button>
                </Card>

                <Button variant="ghost" icon={<Download size={14} />}>Export Report</Button>
            </div>

            {/* Table Area */}
            {loading ? (
                <div className="skeleton" style={{ width: '100%', height: '300px' }} />
            ) : records.length > 0 ? (
                <>
                    <h3 style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--notion-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        History
                    </h3>
                    <Table columns={columns} data={records} />
                </>
            ) : (
                <EmptyState
                    title="No attendance records"
                    description="Your attendance history will appear here once you start clocking in."
                />
            )}

        </PageContainer>
    );
}
