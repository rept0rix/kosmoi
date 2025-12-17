import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Move, Save, Undo, Redo, Type, Palette, MousePointer2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function VisualEditorUI({ selectedElement, onUpdate, onClose, onSave, onUndo, onRedo, canUndo, canRedo }) {
    // ... (keep start of function unchanged)

    // ... (skip to CardFooter)
    <CardFooter className="p-3 border-t bg-slate-50 flex justify-between items-center gap-2">
        <div className="flex gap-1">
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
            >
                <Undo className="h-4 w-4" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
            >
                <Redo className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => onUpdate(selectedElement, 'reset')}>
                Reset
            </Button>
            <Button size="sm" onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700">
                <Save className="mr-1 h-3 w-3" /> Save
            </Button>
        </div>
    </CardFooter>
    const [content, setContent] = useState('');
    const [classes, setClasses] = useState('');
    const [imageSrc, setImageSrc] = useState('');
    const [imageAlt, setImageAlt] = useState('');
    const [linkHref, setLinkHref] = useState('');

    // Position state for drag
    const [position, setPosition] = useState({ x: 20, y: 80 });
    const popoverRef = useRef(null);
    const isDraggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const initialPositionRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (selectedElement) {
            setContent(selectedElement.content || '');
            setClasses(selectedElement.classes || '');
            setImageSrc(selectedElement.attributes?.src || '');
            setImageAlt(selectedElement.attributes?.alt || '');
            setLinkHref(selectedElement.attributes?.href || '');
        }
    }, [selectedElement]);

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) {
                    onRedo && onRedo();
                } else {
                    onUndo && onUndo();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onUndo, onRedo]);

    // Handle Content Updates
    const handleContentChange = (e) => {
        const newContent = e.target.value;
        setContent(newContent);
        onUpdate({ ...selectedElement, content: newContent }, 'content');
    };

    const handleClassesChange = (e) => {
        const newClasses = e.target.value;
        setClasses(newClasses);
        onUpdate({ ...selectedElement, classes: newClasses }, 'classes');
    };

    const handleImageSrcChange = (e) => {
        const newSrc = e.target.value;
        setImageSrc(newSrc);
        onUpdate({ ...selectedElement, attributes: { ...selectedElement.attributes, src: newSrc } }, 'attributes');
    };

    const handleImageAltChange = (e) => {
        const newAlt = e.target.value;
        setImageAlt(newAlt);
        onUpdate({ ...selectedElement, attributes: { ...selectedElement.attributes, alt: newAlt } }, 'attributes');
    };

    const handleLinkHrefChange = (e) => {
        const newHref = e.target.value;
        setLinkHref(newHref);
        onUpdate({ ...selectedElement, attributes: { ...selectedElement.attributes, href: newHref } }, 'attributes');
    };

    // Simple draggable logic
    const handleMouseDown = (e) => {
        if (e.target.closest('.drag-handle')) {
            isDraggingRef.current = true;
            dragStartRef.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDraggingRef.current) {
                setPosition({
                    x: e.clientX - dragStartRef.current.x,
                    y: e.clientY - dragStartRef.current.y
                });
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    if (!selectedElement) return null;

    return (
        <div
            className="fixed z-[10000] shadow-2xl transition-none"
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
        >
            <Card className="w-[350px] bg-white/95 backdrop-blur border-slate-200 dark:bg-slate-900/95 dark:border-slate-800">
                <CardHeader className="p-3 border-b drag-handle cursor-move select-none flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
                            {selectedElement.tagName.toLowerCase()}
                        </Badge>
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[120px]">
                            {selectedElement.visualSelectorId}
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent className="p-0">
                    <Tabs defaultValue="content" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-none border-b bg-transparent p-0">
                            <TabsTrigger
                                value="content"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent"
                            >
                                <Type className="mr-2 h-4 w-4" /> Content
                            </TabsTrigger>
                            <TabsTrigger
                                value="style"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:bg-transparent"
                            >
                                <Palette className="mr-2 h-4 w-4" /> Style
                            </TabsTrigger>
                        </TabsList>

                        <div className="p-4 bg-slate-50/50 min-h-[200px]">
                            <TabsContent value="content" className="mt-0 space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Text Content</Label>
                                    <Textarea
                                        value={content}
                                        onChange={handleContentChange}
                                        className="font-mono text-sm min-h-[140px] resize-y bg-white"
                                        placeholder="Edit text content..."
                                    />
                                </div>

                                {selectedElement.tagName === 'IMG' && (
                                    <>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Image Source (URL)</Label>
                                            <Input
                                                value={imageSrc}
                                                onChange={handleImageSrcChange}
                                                className="font-mono text-sm bg-white"
                                                placeholder="https://..."
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Alt Text</Label>
                                            <Input
                                                value={imageAlt}
                                                onChange={handleImageAltChange}
                                                className="font-mono text-sm bg-white"
                                                placeholder="Image description..."
                                            />
                                        </div>
                                    </>
                                )}

                                {selectedElement.tagName === 'A' && (
                                    <div className="space-y-1">
                                        <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Link URL (Href)</Label>
                                        <Input
                                            value={linkHref}
                                            onChange={handleLinkHrefChange}
                                            className="font-mono text-sm bg-white"
                                            placeholder="https://..."
                                        />
                                    </div>
                                )}

                            </TabsContent>

                            <TabsContent value="style" className="mt-0 space-y-3">
                                <div className="space-y-1">
                                    <Label className="text-xs text-slate-500 uppercase tracking-wider font-bold">Tailwind Classes</Label>
                                    <Textarea
                                        value={classes}
                                        onChange={handleClassesChange}
                                        className="font-mono text-xs min-h-[140px] resize-y bg-white"
                                        placeholder="e.g., text-red-500 p-4..."
                                    />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </CardContent>

                <CardFooter className="p-3 border-t bg-slate-50 flex justify-between items-center gap-2">
                    <div className="flex gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={onUndo}
                            disabled={!canUndo}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={onRedo}
                            disabled={!canRedo}
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            <Redo className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="ghost" className="text-xs" onClick={() => onUpdate(selectedElement, 'reset')}>
                            Reset
                        </Button>
                        <Button size="sm" onClick={onSave} className="bg-indigo-600 hover:bg-indigo-700">
                            <Save className="mr-1 h-3 w-3" /> Save
                        </Button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
