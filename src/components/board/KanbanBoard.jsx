
import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Briefcase, User } from "lucide-react";
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
            <div className={cn("flex h-full gap-6 overflow-x-auto p-6 pb-4", isRTL ? "flex-row-reverse" : "flex-row")}>
                {columns.map((col) => (
                    <div key={col.id} className={cn(
                        "flex-shrink-0 w-80 flex flex-col rounded-2xl h-full transition-colors duration-300",
                        "bg-muted/20 border border-white/5 backdrop-blur-xl shadow-sm", // Premium Column Base
                        "group"
                    )}>
                        {/* Gradient Header Line */}
                        <div className={cn("h-1.5 w-full rounded-t-2xl bg-gradient-to-r",
                            col.id === 'done' || col.id === 'won' ? 'from-green-400 to-emerald-600' :
                                col.id === 'review' || col.id === 'negotiation' ? 'from-purple-400 to-indigo-600' :
                                    col.id === 'in_progress' || col.id === 'proposal' ? 'from-blue-400 to-cyan-500' :
                                        'from-slate-300 to-slate-400'
                        )} />

                        <div className="p-4 pb-2 flex items-center justify-between">
                            <h3 className="font-outfit font-semibold text-foreground/90 tracking-wide flex items-center gap-2">
                                {col.label}
                            </h3>
                            <Badge variant="secondary" className="bg-background/50 backdrop-blur text-foreground/70 font-mono text-xs border-0 shadow-sm">
                                {boardData[col.id]?.length || 0}
                            </Badge>
                        </div>

                        <Droppable droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className={cn(
                                        "flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar transition-all duration-300",
                                        snapshot.isDraggingOver ? "bg-primary/5" : ""
                                    )}
                                >
                                    {boardData[col.id]?.map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided, snapshot) => {
                                                const priorityColor = task.priority === 'high' ? 'bg-red-500' :
                                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300';

                                                return (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={cn(
                                                            "group/card relative bg-card hover:bg-card/90 border border-border/50 rounded-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out",
                                                            snapshot.isDragging ? "shadow-2xl rotate-2 scale-105 z-50 ring-2 ring-primary/20" : ""
                                                        )}
                                                    >
                                                        {/* Priority Strip */}
                                                        {task.priority && (
                                                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full ${priorityColor} opacity-60 group-hover/card:opacity-100 transition-opacity`} />
                                                        )}

                                                        <div className="p-4 pl-5"> {/* Extra padding-left for strip */}
                                                            <div className="flex justify-between items-start gap-3 mb-2">
                                                                <span className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover/card:text-primary transition-colors">
                                                                    {task.title || `${task.first_name || ''} ${task.last_name || ''}`.trim() || 'Untitled'}
                                                                </span>
                                                                {task.value && (
                                                                    <Badge variant="outline" className="shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] items-center gap-0.5">
                                                                        <span className="opacity-70">$</span>{task.value.toLocaleString()}
                                                                    </Badge>
                                                                )}
                                                            </div>

                                                            {/* Context Row */}
                                                            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                                                <div className="flex items-center gap-2 truncate max-w-[70%]">
                                                                    {task.company && (
                                                                        <span className="flex items-center gap-1.5 truncate">
                                                                            <Briefcase className="w-3 h-3 opacity-50" />
                                                                            {task.company}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Assignee */}
                                                                {task.assigned_to ? (
                                                                    <Avatar className="w-6 h-6 border border-background">
                                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assigned_to}`} />
                                                                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                                            {task.assigned_to.substring(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                ) : (
                                                                    <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center opacity-50">
                                                                        <User className="w-3 h-3" />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Tags Footer */}
                                                            {task.tags && task.tags.length > 0 && (
                                                                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/40">
                                                                    {task.tags.slice(0, 3).map((tag, i) => (
                                                                        <span key={i} className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded-md">
                                                                            #{tag}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            }}
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
