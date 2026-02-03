"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";

// Types for sidebar preferences
export interface NavGroup {
    id: string;
    name: string;
    items: string[];
    collapsed: boolean;
}

export interface WorkMode {
    name: string;
    navOrder: string[];
    favorites: string[];
    groups: NavGroup[];
}

export interface NotificationCounts {
    messages: number;
    tasks: number;
    leaves: number;
}

interface SidebarPreferences {
    navOrder: string[];
    favorites: string[];
    groups: NavGroup[];
    workModes: Record<string, WorkMode>;
    activeWorkMode: string | null;
}

interface SidebarContextType {
    // Collapse state
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;

    // Mobile drawer state
    isMobileOpen: boolean;
    setIsMobileOpen: (value: boolean) => void;

    // Navigation order
    navOrder: string[];
    reorderNav: (newOrder: string[]) => void;

    // Favorites
    favorites: string[];
    toggleFavorite: (itemId: string) => void;

    // Groups
    groups: NavGroup[];
    createGroup: (name: string, items?: string[]) => void;
    deleteGroup: (groupId: string) => void;
    toggleGroupCollapse: (groupId: string) => void;
    addToGroup: (groupId: string, itemId: string) => void;
    removeFromGroup: (groupId: string, itemId: string) => void;

    // Work modes
    workModes: Record<string, WorkMode>;
    activeWorkMode: string | null;
    saveWorkMode: (name: string) => void;
    switchWorkMode: (name: string | null) => void;
    deleteWorkMode: (name: string) => void;

    // Notifications
    notificationCounts: NotificationCounts;
    refreshNotifications: () => void;

    // Loading state
    isLoading: boolean;

    // Persistence
    savePreferences: () => Promise<void>;
}

const defaultNavOrder = [
    "dashboard",
    "tasks",
    "messages",
    "attendance",
    "leaves",
    "users",
    "announcements",
];

const defaultContext: SidebarContextType = {
    isCollapsed: false,
    setIsCollapsed: () => { },
    isMobileOpen: false,
    setIsMobileOpen: () => { },
    navOrder: defaultNavOrder,
    reorderNav: () => { },
    favorites: [],
    toggleFavorite: () => { },
    groups: [],
    createGroup: () => { },
    deleteGroup: () => { },
    toggleGroupCollapse: () => { },
    addToGroup: () => { },
    removeFromGroup: () => { },
    workModes: {},
    activeWorkMode: null,
    saveWorkMode: () => { },
    switchWorkMode: () => { },
    deleteWorkMode: () => { },
    notificationCounts: { messages: 0, tasks: 0, leaves: 0 },
    refreshNotifications: () => { },
    isLoading: true,
    savePreferences: async () => { },
};

export const SidebarContext = createContext<SidebarContextType>(defaultContext);

export const useSidebar = () => useContext(SidebarContext);

interface SidebarProviderProps {
    children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [navOrder, setNavOrder] = useState<string[]>(defaultNavOrder);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [groups, setGroups] = useState<NavGroup[]>([]);
    const [workModes, setWorkModes] = useState<Record<string, WorkMode>>({});
    const [activeWorkMode, setActiveWorkMode] = useState<string | null>(null);
    const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
        messages: 0,
        tasks: 0,
        leaves: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch preferences on mount
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const res = await fetch("/api/preferences");
                if (res.ok) {
                    const data = await res.json();
                    if (data.navOrder) setNavOrder(data.navOrder);
                    if (data.favorites) setFavorites(data.favorites);
                    if (data.groups) setGroups(data.groups);
                    if (data.workModes) setWorkModes(data.workModes);
                    if (data.activeWorkMode) setActiveWorkMode(data.activeWorkMode);
                }
            } catch (error) {
                console.error("Failed to fetch preferences:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPreferences();
    }, []);

    // Fetch notification counts
    const refreshNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications/counts");
            if (res.ok) {
                const data = await res.json();
                setNotificationCounts(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }, []);

    // Poll notifications every 30 seconds
    useEffect(() => {
        refreshNotifications();
        const interval = setInterval(refreshNotifications, 30000);
        return () => clearInterval(interval);
    }, [refreshNotifications]);

    // Save preferences to API (debounced in practice)
    const savePreferences = useCallback(async () => {
        try {
            await fetch("/api/preferences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    navOrder,
                    favorites,
                    groups,
                    workModes,
                    activeWorkMode,
                }),
            });
        } catch (error) {
            console.error("Failed to save preferences:", error);
        }
    }, [navOrder, favorites, groups, workModes, activeWorkMode]);

    // Auto-save when preferences change
    useEffect(() => {
        if (!isLoading) {
            const timeout = setTimeout(savePreferences, 1000);
            return () => clearTimeout(timeout);
        }
    }, [navOrder, favorites, groups, workModes, activeWorkMode, isLoading, savePreferences]);

    // Actions
    const reorderNav = useCallback((newOrder: string[]) => {
        setNavOrder(newOrder);
    }, []);

    const toggleFavorite = useCallback((itemId: string) => {
        setFavorites(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    }, []);

    const createGroup = useCallback((name: string, items: string[] = []) => {
        const newGroup: NavGroup = {
            id: `group-${Date.now()}`,
            name,
            items,
            collapsed: false,
        };
        setGroups(prev => [...prev, newGroup]);
    }, []);

    const deleteGroup = useCallback((groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    }, []);

    const toggleGroupCollapse = useCallback((groupId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ));
    }, []);

    const addToGroup = useCallback((groupId: string, itemId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId && !g.items.includes(itemId)
                ? { ...g, items: [...g.items, itemId] }
                : g
        ));
    }, []);

    const removeFromGroup = useCallback((groupId: string, itemId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, items: g.items.filter(id => id !== itemId) }
                : g
        ));
    }, []);

    const saveWorkMode = useCallback((name: string) => {
        const mode: WorkMode = {
            name,
            navOrder,
            favorites,
            groups,
        };
        setWorkModes(prev => ({ ...prev, [name]: mode }));
        setActiveWorkMode(name);
    }, [navOrder, favorites, groups]);

    const switchWorkMode = useCallback((name: string | null) => {
        if (name && workModes[name]) {
            const mode = workModes[name];
            setNavOrder(mode.navOrder);
            setFavorites(mode.favorites);
            setGroups(mode.groups);
        }
        setActiveWorkMode(name);
    }, [workModes]);

    const deleteWorkMode = useCallback((name: string) => {
        setWorkModes(prev => {
            const updated = { ...prev };
            delete updated[name];
            return updated;
        });
        if (activeWorkMode === name) {
            setActiveWorkMode(null);
        }
    }, [activeWorkMode]);

    const value: SidebarContextType = {
        isCollapsed,
        setIsCollapsed,
        isMobileOpen,
        setIsMobileOpen,
        navOrder,
        reorderNav,
        favorites,
        toggleFavorite,
        groups,
        createGroup,
        deleteGroup,
        toggleGroupCollapse,
        addToGroup,
        removeFromGroup,
        workModes,
        activeWorkMode,
        saveWorkMode,
        switchWorkMode,
        deleteWorkMode,
        notificationCounts,
        refreshNotifications,
        isLoading,
        savePreferences,
    };

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
}
