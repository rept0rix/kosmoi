
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { agents } from '@/features/agents/services/AgentRegistry';
import { cn } from "@/shared/lib/utils";



const DEFAULT_STATUSES = [
    { id: 'pending', label: 'To Do', color: 'bg-slate-100 border-slate-200' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: 'review', label: 'In Review', color: 'bg-purple-50 border-purple-200' },
    { id: 'done', label: 'Done', color: 'bg-green-50 border-green-200' }
];

export default function KanbanBoard({
    tasks,
    onUpdateTaskStatus,
    columns = DEFAULT_STATUSES,
    taskAdapter = (task) => task, // Optional adapter to normalize task data
    isRTL = false
}) {

    const boardData = useMemo(() => {
        // Initialize columns with empty arrays
        const cols = {};
        columns.forEach(c => cols[c.id] = []);

        tasks.forEach(rawTask => {
            const task = taskAdapter(rawTask);
            // Find which column this task belongs to
            // For tasks it is 'status', for leads it might be 'stage_id'
            // The parent component should normalize this via taskAdapter or mapping before passing 'tasks',
            // OR we rely on the task having a property that matches column.id.
            // Let's assume 'tasks' passed in already have a 'status' or 'columnId' that matches column.id

            const colId = task.status || task.stage_id;

            if (cols[colId]) {
                cols[colId].push(task);
            } else {
                // Fallback to first column if status is unknown/mismatch
                if (columns.length > 0) {
                    cols[columns[0].id].push(task);
                }
            }
        });
        return cols;
    }, [tasks, columns, taskAdapter]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const { draggableId, source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            onUpdateTaskStatus(draggableId, destination.droppableId);
        }
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className={cn("flex h-full gap-4 overflow-x-auto p-4 pb-2", isRTL ? "flex-row-reverse" : "flex-row")}>
                {columns.map((col) => (
                    <div key={col.id} className={cn("flex-shrink-0 w-72 flex flex-col rounded-xl border-2 h-full bg-white/50 backdrop-blur-sm", col.color || 'bg-slate-50_border-slate-200')}>
                        <div className="p-3 font-semibold text-sm flex items-center justify-between">
                            {col.label}
                            <Badge variant="secondary" className="bg-white/50">{boardData[col.id]?.length || 0}</Badge>
                        </div>

                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                        "flex-1 p-2 space-y-3 overflow-y-auto custom-scrollbar transition-colors",
                                        snapshot.isDraggingOver ? "bg-black/5" : ""
                                    )}
                                >
                                    {boardData[col.id]?.map((task, index) => (
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
                                                                {task.title || task.first_name + ' ' + task.last_name || 'Untitled'}
                                                            </span>
                                                            {task.priority && (
                                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' :
                                                                    task.priority === 'medium' ? 'bg-yellow-500' : 'bg-slate-300'
                                                                    }`} />
                                                            )}
                                                            {task.value && (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1 font-normal bg-green-50 text-green-700 border-green-200">
                                                                    ${task.value}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="p-3 pt-2">
                                                        <div className="flex items-center justify-between mt-2">
                                                            {task.company && (
                                                                <span className="text-xs text-slate-500 truncate max-w-[120px]">
                                                                    {task.company}
                                                                </span>
                                                            )}

                                                            {/* Agent Avatar */}
                                                            {task.assigned_to && (
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
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
