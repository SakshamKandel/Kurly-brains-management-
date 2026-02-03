"use client";

import { useState } from "react";
import { ListTodo, Plus, Check } from "lucide-react";

export default function TodoWidget() {
    const [todos, setTodos] = useState([
        { id: 1, text: "Check emails", completed: false },
        { id: 2, text: "Update daily status", completed: true },
    ]);
    const [newTodo, setNewTodo] = useState("");

    const toggleTodo = (id: number) => {
        setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addTodo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        setTodos([...todos, { id: Date.now(), text: newTodo, completed: false }]);
        setNewTodo("");
    };

    return (
        <div className="bg-[var(--notion-bg)] border border-[var(--notion-border)] rounded-xl h-[180px] flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--notion-border)] flex items-center justify-between bg-[var(--notion-bg-secondary)]/30">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--notion-text-muted)] uppercase tracking-wider">
                    <ListTodo size={14} />
                    <span>Quick Tasks</span>
                </div>
                <span className="text-[10px] bg-[var(--notion-bg-tertiary)] px-1.5 py-0.5 rounded text-[var(--notion-text-muted)]">
                    {todos.filter(t => !t.completed).length} left
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {todos.map(todo => (
                    <div
                        key={todo.id}
                        onClick={() => toggleTodo(todo.id)}
                        className={`
                            flex items-center gap-2 p-2 rounded cursor-pointer transition-colors text-sm group
                            ${todo.completed ? 'text-[var(--notion-text-muted)] line-through' : 'text-[var(--notion-text)] hover:bg-[var(--notion-bg-secondary)]'}
                        `}
                    >
                        <div className={`
                            w-4 h-4 rounded border flex items-center justify-center transition-colors
                            ${todo.completed ? 'bg-[var(--notion-blue)] border-[var(--notion-blue)]' : 'border-[var(--notion-text-muted)] group-hover:border-[var(--notion-blue)]'}
                        `}>
                            {todo.completed && <Check size={10} className="text-white" />}
                        </div>
                        <span className="truncate">{todo.text}</span>
                    </div>
                ))}
            </div>

            <form onSubmit={addTodo} className="p-2 border-t border-[var(--notion-border)]">
                <div className="flex items-center gap-2 bg-[var(--notion-bg-secondary)] rounded px-2 py-1.5">
                    <Plus size={14} className="text-[var(--notion-text-muted)]" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--notion-text)] placeholder-[var(--notion-text-muted)]"
                        placeholder="Add task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                    />
                </div>
            </form>
        </div>
    );
}
