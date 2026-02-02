import type { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
        } & DefaultSession["user"];
    }

    interface User {
        id?: string;
        role?: string;
    }
}

// User types
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    department?: string;
    position?: string;
    role: "ADMIN" | "MANAGER" | "STAFF";
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

// Task types
export interface Task {
    id: string;
    title: string;
    description?: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED" | "CANCELLED";
    dueDate?: Date;
    createdAt: Date;
    creator: UserProfile;
    assignee?: UserProfile;
}

// Message types
export interface Message {
    id: string;
    content: string;
    isRead: boolean;
    createdAt: Date;
    sender: UserProfile;
    receiver?: UserProfile;
}

// Attendance types
export interface Attendance {
    id: string;
    date: Date;
    clockIn: Date;
    clockOut?: Date;
    status: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT";
    notes?: string;
}

// Leave types
export interface LeaveRequest {
    id: string;
    type: "ANNUAL" | "SICK" | "PERSONAL" | "MATERNITY" | "PATERNITY" | "UNPAID";
    startDate: Date;
    endDate: Date;
    reason: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    requester: UserProfile;
    approver?: UserProfile;
}

// Announcement types
export interface Announcement {
    id: string;
    title: string;
    content: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    isPublished: boolean;
    publishedAt?: Date;
    expiresAt?: Date;
    author: UserProfile;
}
