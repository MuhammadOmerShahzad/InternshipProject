'use client';

import { useState, useEffect } from 'react';

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
    priority?: 'low' | 'medium' | 'high';
}

interface TodoListProps {
    userId?: string;
    userZone?: string;
    userBranch?: string;
    userEmail?: string;
}

export default function TodoList({ userId, userZone, userBranch, userEmail }: TodoListProps) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // TODO: Replace with actual API endpoint
                // const response = await fetch(`/api/assigned-tasks?userId=${userId}&zone=${userZone}&branch=${userBranch}`);
                // const data = await response.json();
                // setTasks(data);

                // Mock data for now
                setTasks([]);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setTasks([]);
                setLoading(false);
            }
        };

        fetchTasks();
    }, [userId, userZone, userBranch, userEmail]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading tasks...</div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
                <h3 className="font-bold text-lg">No Tasks</h3>
                <p className="mt-2 text-sm text-center">You have no assigned tasks at the moment</p>
            </div>
        );
    }

    const getPriorityColor = (priority?: string) => {
        switch (priority) {
            case 'high':
                return 'text-red-600 bg-red-50';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'low':
                return 'text-green-600 bg-green-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'in-progress':
                return 'text-blue-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <div
                    key={task._id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-sm">{task.title}</h4>
                        {task.priority && (
                            <span
                                className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}
                            >
                                {task.priority}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                    <div className="flex items-center justify-between mt-2">
                        <span className={`text-xs font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('-', ' ').toUpperCase()}
                        </span>
                        {task.dueDate && (
                            <span className="text-xs text-gray-500">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
