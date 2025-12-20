import React from 'react';
import { Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default function StudioProperties({ selectedNode, onChange, onDelete }) {
    if (!selectedNode) {
        return (
            <div className="w-64 h-full bg-white border-l border-gray-200 p-4 flex flex-col items-center justify-center text-gray-400 text-sm">
                <p>Select an element to edit properties</p>
            </div>
        );
    }

    const { data, type } = selectedNode;

    // Handlers for updating data
    const handleStatusChange = (value) => {
        onChange(selectedNode.id, { ...data, status: value });
    };

    const handleWidthChange = (e) => {
        onChange(selectedNode.id, { ...data, width: parseInt(e.target.value) || 0 });
    };

    return (
        <div className="w-80 h-full bg-white border-l border-gray-200 flex flex-col shadow-sm z-10 overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Settings size={16} />
                    Properties
                </h3>
            </div>

            <div className="p-4 space-y-6">

                {/* Common Identity Info */}
                <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 uppercase">ID</Label>
                    <div className="text-xs font-mono bg-gray-50 p-2 rounded border truncate" title={selectedNode.id}>
                        {selectedNode.id}
                    </div>
                </div>

                {type === 'live-screen' && (
                    <>
                        <div className="space-y-2">
                            <Label>Screen Type</Label>
                            <div className="text-sm font-medium text-gray-700">{data.screenId}</div>
                        </div>

                        {/* Status / Version Control */}
                        <div className="space-y-2">
                            <Label>Status (Environment)</Label>
                            <Select value={data.status || 'live'} onValueChange={handleStatusChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="live">Live (Production)</SelectItem>
                                    <SelectItem value="dev">Development</SelectItem>
                                    <SelectItem value="draft">Draft (Design)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-gray-400">
                                Controls the visual indicator on the screen.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label>Width</Label>
                                <Input type="number" value={data.width || 400} onChange={handleWidthChange} />
                            </div>
                            <div className="space-y-1">
                                <Label>Height</Label>
                                <Input type="number" value={data.height || 600} disabled />
                            </div>
                        </div>
                    </>
                )}

                {/* Delete Area */}
                <div className="pt-6 border-t mt-6">
                    <Button variant="destructive" className="w-full gap-2" size="sm" onClick={() => onDelete(selectedNode.id)}>
                        <Trash2 size={14} />
                        Delete Layer
                    </Button>
                </div>
            </div>
        </div>
    );
}
