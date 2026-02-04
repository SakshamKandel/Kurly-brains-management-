"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
    User, Mail, Phone, Building2, Briefcase, Save, Lock,
    Camera, CheckCircle2, MessageCircle, Calendar, Zap, Clock
} from "lucide-react";

interface ProfileStats {
    tasksCompleted: number;
    messagesSent: number;
    daysAttended: number;
    leaveDaysUsed: number;
    pendingTasks: number;
}

interface RecentActivity {
    id: string;
    title: string;
    status: string;
    updatedAt: string;
}

interface Manager {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

interface ProfileData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    department: string | null;
    position: string | null;
    avatar: string | null;
    role: string;
    status: string;
    createdAt: string;
    managerId: string | null;
    manager: Manager | null;
    stats: ProfileStats;
    recentActivity: RecentActivity[];
}

export default function ProfilePage() {
    const { data: session, update } = useSession();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        department: "",
        position: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/users/me");
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFormData(prev => ({
                    ...prev,
                    firstName: data.firstName || "",
                    lastName: data.lastName || "",
                    phone: data.phone || "",
                    department: data.department || "",
                    position: data.position || "",
                }));
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // 1. Upload to R2
            const uploadRes = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();

            // 2. Update Profile with new Avatar URL
            const updateRes = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar: url }),
            });

            if (updateRes.ok) {
                const updatedUser = await updateRes.json();
                setProfile(prev => prev ? { ...prev, avatar: updatedUser.avatar } : null);
                update({ user: { image: updatedUser.avatar } }); // Update session
                setMessage("Profile picture updated!");
            }
        } catch (error) {
            console.error("Error uploading image:", error);
            setMessage("Failed to upload image");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage("");

        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage("New passwords do not match");
            setSaving(false);
            return;
        }

        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setMessage("Profile updated successfully!");
                setFormData(prev => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                }));
                fetchProfile();
                update();
            } else {
                const data = await res.json();
                setMessage(data.error || "Failed to update profile");
            }
        } catch (error) {
            console.error("Failed to save profile:", error);
            setMessage("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const getInitials = () => {
        if (!profile) return "?";
        return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const getRoleColor = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN": return "var(--notion-red)";
            case "ADMIN": return "var(--notion-orange)";
            case "MANAGER": return "var(--notion-blue)";
            default: return "var(--notion-text-secondary)";
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
                <div className="skeleton" style={{ width: 200, height: 24 }} />
                <div className="skeleton" style={{ width: 150, height: 16 }} />
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* Header Section */}
            <div className="profile-header">
                <div className="profile-avatar-container">
                    <label htmlFor="avatar-upload" style={{ cursor: "pointer", display: "block", height: "100%" }}>
                        <div className="profile-avatar">
                            {profile?.avatar ? (
                                <img src={profile.avatar} alt="Profile" />
                            ) : (
                                <span>{getInitials()}</span>
                            )}
                            <div className="avatar-overlay">
                                {uploading ? <div className="spinner" style={{ width: 12, height: 12 }} /> : <Camera size={14} />}
                            </div>
                        </div>
                    </label>
                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }}
                        disabled={uploading}
                    />
                </div>
                <div className="profile-info">
                    <h1>{profile?.firstName} {profile?.lastName}</h1>
                    <div className="profile-meta">
                        {profile?.position && <span>{profile.position}</span>}
                        {profile?.department && <span>•</span>}
                        {profile?.department && <span>{profile.department}</span>}
                    </div>
                    <div className="profile-badges">
                        <span
                            className="badge role"
                            style={{ background: getRoleColor(profile?.role || ""), color: '#fff' }}
                        >
                            {profile?.role?.replace("_", " ")}
                        </span>
                        <span className="badge status">
                            <span className="status-dot"></span>
                            {profile?.status}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <CheckCircle2 size={18} className="stat-icon green" />
                    <div className="stat-content">
                        <span className="stat-value">{profile?.stats?.tasksCompleted ?? 0}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Zap size={18} className="stat-icon purple" />
                    <div className="stat-content">
                        <span className="stat-value">{profile?.stats?.pendingTasks ?? 0}</span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="stat-card">
                    <MessageCircle size={18} className="stat-icon blue" />
                    <div className="stat-content">
                        <span className="stat-value">{profile?.stats?.messagesSent ?? 0}</span>
                        <span className="stat-label">Messages</span>
                    </div>
                </div>
                <div className="stat-card">
                    <Calendar size={18} className="stat-icon orange" />
                    <div className="stat-content">
                        <span className="stat-value">{profile?.stats?.daysAttended ?? 0}</span>
                        <span className="stat-label">Attendance</span>
                    </div>
                </div>
            </div>

            {/* Member Since */}
            <div className="member-since">
                <Clock size={14} />
                <span>Member since {profile?.createdAt && formatDate(profile.createdAt)}</span>
            </div>

            {/* Tab Navigation */}
            <div className="tab-nav">
                <button
                    className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
                    onClick={() => setActiveTab("profile")}
                >
                    <User size={14} />
                    Profile
                </button>
                <button
                    className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
                    onClick={() => setActiveTab("security")}
                >
                    <Lock size={14} />
                    Security
                </button>
            </div>

            {/* Content */}
            <div className="profile-content">
                {message && (
                    <div className={`message ${message.includes("success") ? "success" : "error"}`}>
                        {message}
                    </div>
                )}

                {activeTab === "profile" && (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-section">
                            <div className="section-header">Basic Information</div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name</label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Mail size={12} />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="disabled"
                                />
                                <span className="hint">Email cannot be changed</span>
                            </div>

                            <div className="form-group">
                                <label>
                                    <Phone size={12} />
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 000-0000"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="section-header">Work Information</div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>
                                        <Building2 size={12} />
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="Engineering"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>
                                        <Briefcase size={12} />
                                        Position
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="Software Engineer"
                                    />
                                </div>
                            </div>

                            {profile?.manager && (
                                <div className="manager-info">
                                    <span className="manager-label">Reports to</span>
                                    <span className="manager-name">
                                        {profile.manager.firstName} {profile.manager.lastName}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={saving} className="save-btn">
                                <Save size={14} />
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === "security" && (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-section">
                            <div className="section-header">Change Password</div>
                            <p className="section-desc">Update your password to keep your account secure.</p>

                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        placeholder="New password"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Confirm Password</label>
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Confirm password"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={saving} className="save-btn">
                                <Lock size={14} />
                                {saving ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <style jsx>{`
                .profile-page {
                    max-width: 700px;
                    margin: 0 auto;
                    padding: 32px 24px;
                }

                .profile-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    padding: 60px;
                }

                .skeleton {
                    background: var(--notion-bg-tertiary);
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }

                /* Header */
                .profile-header {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .profile-avatar-container {
                    position: relative;
                    width: 72px;
                    height: 72px;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .profile-avatar {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: var(--notion-bg-tertiary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--notion-text);
                    overflow: hidden;
                    position: relative;
                }

                .profile-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-overlay {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 24px;
                    height: 24px;
                    background: var(--notion-blue);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    color: white;
                    border: 2px solid var(--notion-bg);
                    z-index: 10;
                }

                .profile-avatar-container:hover .avatar-overlay {
                    transform: scale(1.1);
                    transition: transform 0.2s;
                }

                .profile-info h1 {
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--notion-text);
                    margin: 0 0 4px 0;
                }

                .profile-meta {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                    color: var(--notion-text-secondary);
                    margin-bottom: 8px;
                }

                .profile-badges {
                    display: flex;
                    gap: 8px;
                }

                .badge {
                    font-size: 11px;
                    font-weight: 500;
                    padding: 3px 8px;
                    border-radius: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }

                .badge.status {
                    background: var(--notion-bg-tertiary);
                    color: var(--notion-text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--notion-green);
                }

                /* Stats Grid */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 12px;
                    margin-bottom: 16px;
                }

                .stat-card {
                    background: var(--notion-bg-secondary);
                    border-radius: 6px;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .stat-icon {
                    flex-shrink: 0;
                }

                .stat-icon.green { color: var(--notion-green); }
                .stat-icon.purple { color: var(--notion-purple); }
                .stat-icon.blue { color: var(--notion-blue); }
                .stat-icon.orange { color: var(--notion-orange); }

                .stat-content {
                    display: flex;
                    flex-direction: column;
                }

                .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: var(--notion-text);
                    line-height: 1;
                }

                .stat-label {
                    font-size: 11px;
                    color: var(--notion-text-muted);
                    margin-top: 2px;
                }

                /* Member Since */
                .member-since {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: var(--notion-text-muted);
                    margin-bottom: 24px;
                }

                /* Tabs */
                .tab-nav {
                    display: flex;
                    gap: 4px;
                    margin-bottom: 20px;
                    border-bottom: 1px solid var(--notion-divider);
                    padding-bottom: 12px;
                }

                .tab-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--notion-text-secondary);
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .tab-btn:hover {
                    background: var(--notion-bg-hover);
                    color: var(--notion-text);
                }

                .tab-btn.active {
                    background: var(--notion-bg-tertiary);
                    color: var(--notion-text);
                }

                /* Content */
                .profile-content {
                    background: var(--notion-bg-secondary);
                    border-radius: 8px;
                    padding: 24px;
                }

                .message {
                    padding: 10px 14px;
                    border-radius: 6px;
                    font-size: 13px;
                    margin-bottom: 16px;
                }

                .message.success {
                    background: rgba(15, 157, 88, 0.15);
                    color: var(--notion-green);
                }

                .message.error {
                    background: rgba(235, 87, 87, 0.15);
                    color: var(--notion-red);
                }

                /* Form */
                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }

                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .section-header {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--notion-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .section-desc {
                    font-size: 13px;
                    color: var(--notion-text-muted);
                    margin: -8px 0 0 0;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-group label {
                    font-size: 12px;
                    font-weight: 500;
                    color: var(--notion-text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .form-group input {
                    padding: 8px 12px;
                    font-size: 14px;
                    background: var(--notion-bg);
                    border: 1px solid var(--notion-divider);
                    border-radius: 4px;
                    color: var(--notion-text);
                    outline: none;
                    transition: border-color 0.15s;
                }

                .form-group input:focus {
                    border-color: var(--notion-blue);
                }

                .form-group input.disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .form-group .hint {
                    font-size: 11px;
                    color: var(--notion-text-muted);
                }

                .manager-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 12px;
                    background: var(--notion-bg);
                    border-radius: 4px;
                    font-size: 13px;
                }

                .manager-label {
                    color: var(--notion-text-muted);
                }

                .manager-name {
                    color: var(--notion-text);
                    font-weight: 500;
                }

                /* Actions */
                .form-actions {
                    padding-top: 16px;
                    border-top: 1px solid var(--notion-divider);
                    display: flex;
                    justify-content: flex-end;
                }

                .save-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    font-size: 13px;
                    font-weight: 500;
                    background: var(--notion-blue);
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: opacity 0.15s;
                }

                .save-btn:hover {
                    opacity: 0.9;
                }

                .save-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                /* Responsive */
                @media (max-width: 600px) {
                    .profile-page {
                        padding: 20px 16px;
                    }

                    .profile-header {
                        flex-direction: column;
                        text-align: center;
                    }

                    .profile-meta, .profile-badges {
                        justify-content: center;
                    }

                    .stats-grid {
                        grid-template-columns: 1fr 1fr;
                    }

                    .form-row {
                        grid-template-columns: 1fr;
                    }

                    .member-since {
                        justify-content: center;
                    }
                }
            `}</style>
        </div>
    );
}
