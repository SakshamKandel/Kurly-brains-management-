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
        <div className="h-full w-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--notion-text-muted)] uppercase tracking-widest">
                    <ListTodo size={14} className="text-[var(--brand-cyan)]" />
                    <span>Quick Tasks</span>
                </div>
                <span className="text-[9px] bg-[var(--notion-bg-tertiary)] px-2 py-0.5 rounded text-[var(--brand-cyan)] font-mono">
                    {todos.filter(t => !t.completed).length} left
                </span>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 -mx-2 px-2">
                {todos.map(todo => (
                    <div
                        key={todo.id}
                        onClick={() => toggleTodo(todo.id)}
                        className={`
                            flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all duration-300 group
                            ${todo.completed ? 'text-[var(--notion-text-muted)] opacity-60' : 'text-[var(--notion-text)] hover:bg-[var(--notion-bg-tertiary)] hover:translate-x-1'}
                        `}
                    >
                        <div className={`
                            w-4 h-4 rounded-sm border flex items-center justify-center transition-all duration-300
                            ${todo.completed ? 'bg-[var(--brand-cyan)] border-[var(--brand-cyan)]' : 'border-[var(--notion-border)] group-hover:border-[var(--brand-cyan)] bg-[var(--notion-bg-secondary)]'}
                        `}>
                            <Check size={10} strokeWidth={3} className={`transition-opacity ${todo.completed ? 'opacity-100 text-[var(--notion-bg)]' : 'opacity-0'}`} />
                        </div>
                        <span className={`text-sm tracking-wide ${todo.completed ? 'line-through decoration-[var(--notion-border)]' : 'font-light'}`}>
                            {todo.text}
                        </span>
                    </div>
                ))}
            </div>

            <form onSubmit={addTodo} className="mt-auto">
                <div className="flex items-center gap-2 bg-[var(--notion-bg-tertiary)] border border-transparent focus-within:border-[var(--brand-cyan)] rounded-md px-3 py-2 transition-colors">
                    <Plus size={14} className="text-[var(--notion-text-muted)]" />
                    <input
                        className="flex-1 bg-transparent border-none outline-none text-xs text-[var(--notion-text)] placeholder-[var(--notion-text-muted)] font-light tracking-wide"
                        placeholder="Add quick task..."
                        value={newTodo}
                        onChange={(e) => setNewTodo(e.target.value)}
                    />
                </div>
            </form>
        </div>
    );
}
