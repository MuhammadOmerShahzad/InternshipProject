'use client';

import { useState, useEffect } from 'react';
import { getUserTasks, toggleTaskCompletion, Task } from '@/lib/actions/tasks';
import { Loader2 } from 'lucide-react';

interface TodoListProps {
    userBranchId?: string;
    refreshTrigger?: number;
}

export default function TodoList({ userBranchId, refreshTrigger }: TodoListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!userBranchId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            const { tasks: fetchedTasks } = await getUserTasks(userBranchId);
            setTasks(fetchedTasks);
            setLoading(false);
        };

        fetchTasks();
    }, [userBranchId, refreshTrigger]);

    const handleToggleComplete = async (taskId: string, currentStatus: boolean) => {
        // Optimistic update
        setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !currentStatus } : t));

        const result = await toggleTaskCompletion(taskId, !currentStatus);
        if (!result.success) {
            // Revert on error
            setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: currentStatus } : t));
            alert('Failed to update task');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#f15a22]" />
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 py-12">
                <svg
                    className="w-12 h-12 mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                </svg>
                <h3 className="font-bold text-base">No Tasks</h3>
                <p className="mt-1 text-sm text-center">You have no assigned tasks at the moment</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => (
                <label
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                >
                    <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleComplete(task.id, task.completed)}
                        className="mt-0.5 w-5 h-5 rounded border-gray-300 text-[#f15a22] focus:ring-[#f15a22] focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {task.title}
                        </h4>
                        {task.description && (
                            <p className={`text-xs mt-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                {task.description}
                            </p>
                        )}
                    </div>
                </label>
            ))}
        </div>
    );
}
