import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, BookOpen, CheckSquare, Settings } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import LivePreview from '@/components/LivePreview';
import { useLanguage } from "@/components/LanguageContext";

export default function BoardRoomSidebar({
    activeRightTab,
    setActiveRightTab,
    tasks,
    knowledgeItems,
    handleCreateTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    setIsCreateTaskOpen,
    isSplitView,
    onSplitViewToggle
}) {
    const { language } = useLanguage();
    const isRTL = language === 'he';

    return (
        <div className="w-full md:w-96 border-l bg-slate-50/50 flex flex-col h-[50vh] md:h-auto">
            <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex-1 flex flex-col">
                <div className="p-2 border-b bg-white">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="tasks" className="text-xs">
                            <CheckSquare className="w-3 h-3 mr-2" />
                            Tasks ({tasks.filter(t => t.status !== 'completed').length})
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="text-xs">
                            <BookOpen className="w-3 h-3 mr-2" />
                            Knowledge
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="text-xs">
                            <Settings className="w-3 h-3 mr-2" />
                            Context
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="tasks" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <div className="p-3 border-b flex justify-between items-center bg-white/50">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Items</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsCreateTaskOpen(true)} aria-label="Create New Task">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                        <div className="space-y-3">
                            {tasks.map(task => (
                                <Card key={task.id} className={`shadow-sm transition-all ${task.status === 'completed' ? 'opacity-50 grayscale' : 'hover:shadow-md'}`}>
                                    <div className="p-3 flex items-start gap-3">
                                        <Checkbox
                                            checked={task.status === 'completed'}
                                            onCheckedChange={(checked) => handleUpdateTaskStatus(task.id, checked ? 'completed' : 'in_progress')}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-medium leading-none ${task.status === 'completed' ? 'line-through text-slate-500' : ''}`}>
                                                    {task.title}
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4 text-slate-400 hover:text-red-500 -mt-1 -mr-1"
                                                    onClick={() => handleDeleteTask(task.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2">
                                                <div className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {task.priority || 'medium'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 ml-auto">
                                                    @{task.assigned_to}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                            {tasks.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed rounded-lg">
                                    No tasks yet
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="knowledge" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <ScrollArea className="flex-1 p-3">
                        <div className="grid grid-cols-1 gap-2">
                            {knowledgeItems.map((item, i) => (
                                <Card key={i} className="bg-white">
                                    <div className="p-3 flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded text-blue-600">
                                            <BookOpen className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{item.title || "Untitled Doc"}</h4>
                                            <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
                    <div className="flex-1 relative">
                        <div className="absolute inset-0 overflow-auto">
                            <LivePreview
                                isSplitView={isSplitView}
                                onSplitViewToggle={onSplitViewToggle}
                            />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
