import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import LivePreview from '@/components/LivePreview';
import { useLanguage } from "@/components/LanguageContext";
import UXHeatmapOverlay from '@/components/board/UXHeatmapOverlay';
import { Plus, Trash2, BookOpen, CheckSquare, Settings, Archive, Database, PlayCircle, ScanEye } from 'lucide-react';

export default function BoardRoomRightSidebar({
    activeRightTab,
    setActiveRightTab,
    tasks,
    knowledgeItems,
    files,
    handleCreateTask,
    handleDeleteTask,
    handleUpdateTaskStatus,
    isSplitView,
    onSplitViewToggle
}) {
    const { language } = useLanguage();
    const isRTL = language === 'he';

    // Local state for Create Task Dialog
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');

    const onConfirmCreate = () => {
        handleCreateTask({
            title: newTaskTitle,
            description: newTaskDescription,
            priority: newTaskPriority
        });
        setIsCreateTaskOpen(false);
        setNewTaskTitle('');
        setNewTaskDescription('');
    };

    // UX Vision Logic
    const [isScanning, setIsScanning] = useState(false);
    const [heatmapPoints, setHeatmapPoints] = useState(null);

    const handleScan = () => {
        setIsScanning(true);
        setHeatmapPoints(null);

        // Simulate Agent Vision Analysis
        setTimeout(() => {
            // Mock Data representing "Attention Prediction"
            const mockPoints = [
                { x: 50, y: 30, score: 95, intensity: 40 }, // Center Hero
                { x: 15, y: 8, score: 60, intensity: 20 },  // Logo
                { x: 85, y: 8, score: 70, intensity: 25 },  // Nav Action
                { x: 50, y: 65, score: 85, intensity: 35 }, // Main CTA
                { x: 30, y: 90, score: 40, intensity: 15 }, // Footer/Grid
                { x: 70, y: 90, score: 45, intensity: 15 }, // Footer/Grid
            ];
            setHeatmapPoints(mockPoints);
            setIsScanning(false);
        }, 3000);
    };

    return (
        <div className={`border-s bg-white flex flex-col shadow-sm z-10 transition-all duration-300 ${activeRightTab === 'preview'
            ? (isSplitView ? 'w-1/2' : 'w-[480px]')
            : 'w-80'
            } hidden md:flex dark:bg-slate-950 dark:border-slate-800`}>

            <Tabs value={activeRightTab} onValueChange={setActiveRightTab} className="flex-1 flex flex-col">
                <div className="p-2 border-b flex gap-1 bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                    <TabsList className="flex w-full bg-transparent p-0 gap-1">
                        <TabsTrigger
                            value="tasks"
                            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-blue-400 dark:text-slate-400`}
                        >
                            <CheckSquare className="w-3 h-3" />
                            {isRTL ? 'משימות' : 'Tasks'}
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] min-w-[16px] ml-1 dark:bg-slate-700 dark:text-slate-300">{tasks.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="knowledge"
                            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-purple-400 dark:text-slate-400`}
                        >
                            <BookOpen className="w-3 h-3" />
                            {isRTL ? 'ידע' : 'Knowledge'}
                            <Badge variant="secondary" className="h-4 px-1 text-[9px] min-w-[16px] ml-1 dark:bg-slate-700 dark:text-slate-300">{knowledgeItems.length}</Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="preview"
                            className={`flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-colors data-[state=active]:bg-white data-[state=active]:text-pink-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-pink-400 dark:text-slate-400`}
                        >
                            <PlayCircle className="w-3 h-3" />
                            {isRTL ? 'Live' : 'Preview'}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 bg-gray-50/30 overflow-hidden relative dark:bg-slate-950/50">
                    <TabsContent value="preview" className="h-full m-0 p-0">
                        <LivePreview
                            initialUrl="http://localhost:5173/landing"
                            isSplitView={isSplitView}
                            onSplitViewToggle={onSplitViewToggle}
                            overlay={<UXHeatmapOverlay points={heatmapPoints} isScanning={isScanning} />}
                            additionalActions={
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className={`h-6 w-6 transition-colors ${(isScanning || heatmapPoints) ? 'text-purple-600 bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300' : 'text-gray-500'}`}
                                    onClick={handleScan}
                                    title="UX Vision Scan (Predictive Heatmap)"
                                    disabled={isScanning}
                                >
                                    <ScanEye className={`w-3 h-3 ${isScanning ? 'animate-pulse text-purple-600' : ''}`} />
                                </Button>
                            }
                        />
                    </TabsContent>

                    <TabsContent value="tasks" className="h-full m-0 p-0">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-3">
                                <Button
                                    onClick={() => setIsCreateTaskOpen(true)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs mb-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    {isRTL ? 'הוסף משימה' : 'Add New Task'}
                                </Button>

                                {tasks.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3 dark:bg-green-900/20">
                                            <CheckSquare className="w-6 h-6 text-green-200 dark:text-green-500" />
                                        </div>
                                        <p className="text-sm text-gray-400 dark:text-slate-500">
                                            {isRTL ? 'אין משימות פעילות' : 'No active tasks'}
                                        </p>
                                    </div>
                                )}
                                {tasks.map(task => (
                                    <Card key={task.id} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 group dark:bg-slate-900 dark:border-slate-800">
                                        <CardHeader className="p-3 pb-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <CardTitle className="text-sm font-semibold leading-tight text-gray-800 flex-1 dark:text-slate-200">
                                                    {task.title}
                                                </CardTitle>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleUpdateTaskStatus(task.id, task.status === 'done' ? 'in_progress' : 'done')}
                                                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${task.status === 'done'
                                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900'
                                                            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900'
                                                            }`}
                                                    >
                                                        {task.status === 'done' ? 'Done' : 'Active'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                                    >
                                                        <Archive className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2">
                                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed dark:text-slate-400">
                                                {task.description}
                                            </p>
                                            <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-slate-800">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600 dark:bg-slate-700 dark:text-slate-300">
                                                        {(task.assigned_to || 'U')[0]}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 font-medium dark:text-slate-500">
                                                        {task.assigned_to || 'Unassigned'}
                                                    </span>
                                                </div>
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                                    task.priority === 'medium' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                                        'bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="knowledge" className="h-full m-0 p-0">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-3">
                                {knowledgeItems.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-3 dark:bg-purple-900/20">
                                            <Database className="w-6 h-6 text-purple-200 dark:text-purple-400" />
                                        </div>
                                        <p className="text-sm text-gray-400 dark:text-slate-500">
                                            {isRTL ? 'אין פריטי ידע' : 'No knowledge items'}
                                        </p>
                                    </div>
                                )}
                                {knowledgeItems.map(item => (
                                    <Card key={item.key} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 dark:bg-slate-900 dark:border-slate-800">
                                        <CardHeader className="p-3 pb-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <CardTitle className="text-xs font-mono text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded dark:bg-purple-900/20 dark:text-purple-300">
                                                    {item.key}
                                                </CardTitle>
                                                <Badge variant="outline" className="text-[9px] text-gray-400 border-gray-100 dark:border-slate-700 dark:text-slate-500">
                                                    {item.category}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2">
                                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 font-mono break-all dark:bg-slate-950/50 dark:border-slate-800 dark:text-slate-400">
                                                {typeof item.value === 'object' ? JSON.stringify(item.value) : item.value}
                                            </div>
                                            <div className="flex justify-end items-center pt-2 mt-2 border-t border-gray-50 dark:border-slate-800">
                                                <span className="text-[9px] text-gray-400 dark:text-slate-500">
                                                    Updated by {item.updated_by}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Create Task Dialog */}
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
                <DialogContent className="dark:bg-slate-950 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-slate-100">{isRTL ? 'הוסף משימה חדשה' : 'Create New Task'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Input
                            placeholder={isRTL ? "כותרת המשימה..." : "Task Title..."}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        />
                        <Input
                            placeholder={isRTL ? "תיאור..." : "Description..."}
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100"
                        />
                        <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                            <SelectTrigger className="dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                                <SelectItem value="low" className="dark:focus:bg-slate-800 dark:text-slate-100">Low</SelectItem>
                                <SelectItem value="medium" className="dark:focus:bg-slate-800 dark:text-slate-100">Medium</SelectItem>
                                <SelectItem value="high" className="dark:focus:bg-slate-800 dark:text-slate-100">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateTaskOpen(false)} className="dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                            {isRTL ? 'ביטול' : 'Cancel'}
                        </Button>
                        <Button onClick={onConfirmCreate} className="bg-blue-600 text-white dark:bg-blue-700 dark:hover:bg-blue-600">
                            {isRTL ? 'הוסף משימה' : 'Add Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
