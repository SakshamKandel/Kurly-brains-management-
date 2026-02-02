"use client";

import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/Toast";

interface UseOptimisticOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error, rollback: () => void) => void;
    successMessage?: string;
    errorMessage?: string;
}

/**
 * Hook for optimistic updates - immediately update UI, then sync with server
 * 
 * Usage:
 * const { execute, isLoading } = useOptimistic<Task>({
 *   successMessage: "Task updated!",
 *   errorMessage: "Failed to update task"
 * });
 * 
 * // In your handler:
 * execute(
 *   () => updateTaskAPI(taskId, newData), // API call
 *   () => setTasks(prev => prev.map(t => t.id === taskId ? newData : t)), // Optimistic update
 *   () => setTasks(prev => prev.map(t => t.id === taskId ? oldData : t))  // Rollback
 * );
 */
export function useOptimistic<T = unknown>(options: UseOptimisticOptions<T> = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();

    const execute = useCallback(async (
        apiCall: () => Promise<T>,
        optimisticUpdate: () => void,
        rollback: () => void
    ) => {
        // Apply optimistic update immediately
        optimisticUpdate();
        setIsLoading(true);

        try {
            const result = await apiCall();

            if (options.successMessage) {
                success(options.successMessage);
            }

            options.onSuccess?.(result);
            return result;
        } catch (err) {
            // Rollback on error
            rollback();

            const errorMsg = options.errorMessage || "Something went wrong";
            error(errorMsg, { label: "Retry", onClick: () => execute(apiCall, optimisticUpdate, rollback) });

            options.onError?.(err as Error, rollback);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [options, success, error]);

    return { execute, isLoading };
}

/**
 * Simpler version for list operations
 */
export function useOptimisticList<T extends { id: string }>() {
    const [items, setItems] = useState<T[]>([]);
    const { success, error } = useToast();

    const addItem = useCallback(async (
        newItem: T,
        apiCall: () => Promise<T>
    ) => {
        // Optimistic add
        setItems(prev => [newItem, ...prev]);

        try {
            const result = await apiCall();
            // Replace temp item with real one
            setItems(prev => prev.map(i => i.id === newItem.id ? result : i));
            success("Added successfully");
            return result;
        } catch (err) {
            // Rollback
            setItems(prev => prev.filter(i => i.id !== newItem.id));
            error("Failed to add");
            throw err;
        }
    }, [success, error]);

    const updateItem = useCallback(async (
        id: string,
        updates: Partial<T>,
        apiCall: () => Promise<T>
    ) => {
        // Store old item for rollback
        const oldItem = items.find(i => i.id === id);
        if (!oldItem) return;

        // Optimistic update
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));

        try {
            const result = await apiCall();
            setItems(prev => prev.map(i => i.id === id ? result : i));
            success("Updated successfully");
            return result;
        } catch (err) {
            // Rollback
            setItems(prev => prev.map(i => i.id === id ? oldItem : i));
            error("Failed to update");
            throw err;
        }
    }, [items, success, error]);

    const removeItem = useCallback(async (
        id: string,
        apiCall: () => Promise<void>
    ) => {
        // Store for rollback
        const oldItem = items.find(i => i.id === id);
        const oldIndex = items.findIndex(i => i.id === id);
        if (!oldItem) return;

        // Optimistic remove
        setItems(prev => prev.filter(i => i.id !== id));

        try {
            await apiCall();
            success("Removed successfully");
        } catch (err) {
            // Rollback - insert at original position
            setItems(prev => {
                const newItems = [...prev];
                newItems.splice(oldIndex, 0, oldItem);
                return newItems;
            });
            error("Failed to remove", { label: "Retry", onClick: () => removeItem(id, apiCall) });
            throw err;
        }
    }, [items, success, error]);

    return { items, setItems, addItem, updateItem, removeItem };
}
