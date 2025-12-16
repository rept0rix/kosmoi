
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { agents } from '@/services/agents/AgentRegistry';
import { cn } from "@/lib/utils";

const TASK_STATUSES = {
    'pending': { label: 'To Do', color: 'bg-slate-100 border-slate-200' },
    'in_progress': { label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    'review': { label: 'In Review', color: 'bg-purple-50 border-purple-200' },
    'done': { label: 'Done', color: 'bg-green-50 border-green-200' }
};

export default function KanbanBoard({ tasks, onUpdateTaskStatus, isRTL }) {

    const columns = useMemo(() => {
        const cols = {
            pending: [],
            in_progress: [],
            review: [],
            done: []
        };
        tasks.forEach(task => {
            if (cols[task.status]) {
                cols[task.status].push(task);
            } else {
                // Fallback for unknown statuses
                cols.pending.push(task);
            }
        });
        return cols;
    }, [tasks]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { draggableId, source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            onUpdateTaskStatus(draggableId, destination.droppableId);
        }
    };

    const getAgentAvatar = (agentName) => {
        if (!agentName) return null;
        const agent = agents.find(a => a.role === agentName || a.name === agentName);
        return agent ? agent.icon : 'User'; // Simple fallback if icon is string
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto p-4 pb-2">
                {Object.entries(TASK_STATUSES).map(([statusId, config]) => (
                    <div key={statusId} className={cn("flex-shrink-0 w-72 flex flex-col rounded-xl border-2 h-full bg-white/50 backdrop-blur-sm", config.color)}>
                        <div className="p-3 font-semibold text-sm flex items-center justify-between">
                            {config.label}
                            <Badge variant="secondary" className="bg-white/50">{columns[statusId]?.length || 0}</Badge>
                        </div>

                        <Droppable droppableId={statusId}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                        "flex-1 p-2 space-y-3 overflow-y-auto custom-scrollbar transition-colors",
                                        snapshot.isDraggingOver ? "bg-black/5" : ""
                                    )}
                                >
                                    {columns[statusId]?.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided, snapshot) => (
                                                <Card
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn(
                                                        "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
                                                        snapshot.isDragging ? "shadow-xl rotate-2 scale-105" : ""
                                                    )}
                                                >
                                                    <CardHeader className="p-3 pb-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <span className="text-sm font-medium leading-snug line-clamp-2">
                                                                {task.title}
                                                            </span>
                                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' :
                                                                task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'
                                                                }`} />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-2">
                                                        <div className="flex items-center justify-between mt-2">
                                                            <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal bg-slate-50">
                                                                {task.priority}
                                                            </Badge>

                                                            {/* Agent Avatar */}
                                                            {task.assigned_to && (
                                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700">
                                                                        {task.assigned_to.charAt(0)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    );
}
