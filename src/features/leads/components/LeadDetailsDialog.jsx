import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Mail, Phone, FileText, Calendar, Trash2, User, Building } from 'lucide-react';
import { SalesService } from '@/services/SalesService';
import { toast } from "@/components/ui/use-toast";

export function LeadDetailsDialog({ lead, isOpen, onClose, onUpdate, allStages }) {
    const [activeTab, setActiveTab] = useState("timeline");
    const [interactions, setInteractions] = useState([]);
    const [loadingInteractions, setLoadingInteractions] = useState(false);
    const [newNote, setNewNote] = useState("");

    // Editable state
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        value: 0,
        company: '',
        source: '',
        stage_id: ''
    });

    useEffect(() => {
        if (lead) {
            setFormData({ ...lead });
            fetchInteractions();
            setEditMode(false);
        }
    }, [lead]);

    const fetchInteractions = async () => {
        if (!lead) return;
        setLoadingInteractions(true);
        try {
            const data = await SalesService.getInteractions(lead.id);
            setInteractions(data || []);
        } catch (error) {
            console.error("Failed to load interactions", error);
        } finally {
            setLoadingInteractions(false);
        }
    };

    const handleSaveLead = async () => {
        try {
            await SalesService.updateLead(lead.id, formData);
            toast({ title: "Updated", description: "Lead details saved." });
            setEditMode(false);
            onUpdate(); // Refresh parent
        } catch (error) {
            toast({ title: "Error", description: "Failed to update lead.", variant: "destructive" });
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        try {
            await SalesService.createInteraction(lead.id, 'note', newNote);
            setNewNote("");
            fetchInteractions();
            toast({ title: "Note Added" });
        } catch (error) {
            toast({ title: "Error", description: "Failed to add note.", variant: "destructive" });
        }
    };

    const handleStageChange = async (newStageId) => {
        try {
            await SalesService.updateLeadStage(lead.id, newStageId);
            setFormData(prev => ({ ...prev, stage_id: newStageId }));
            toast({ title: "Stage Updated" });
            onUpdate();
        } catch (error) {
            toast({ title: "Error", description: "Failed to move stage.", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this lead? This cannot be undone.")) {
            try {
                await SalesService.deleteLead(lead.id);
                toast({ title: "Lead Deleted" });
                onClose();
                onUpdate();
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete lead.", variant: "destructive" });
            }
        }
    };

    if (!lead) return null;

    const currentStageName = allStages.find(s => s.id === formData.stage_id)?.name || "Unknown";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl bg-slate-900 border-slate-800 text-white h-[80vh] flex flex-col p-0 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 bg-slate-900 z-10">
                    <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                            <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 text-xl font-bold">
                                {(lead.first_name?.[0] || lead.company?.[0] || "?").toUpperCase()}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    {lead.first_name} {lead.last_name}
                                    {lead.company && <Badge variant="outline" className="text-slate-400 border-slate-700 font-normal">{lead.company}</Badge>}
                                </DialogTitle>
                                <div className="text-sm text-slate-400 mt-1 flex gap-4">
                                    <span className="flex items-center gap-1"><Mail size={12} /> {lead.email || "No email"}</span>
                                    {lead.value > 0 && <span className="text-emerald-400">฿{lead.value.toLocaleString()}</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={formData.stage_id} onValueChange={handleStageChange}>
                                <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700 text-xs text-white">
                                    <SelectValue placeholder={currentStageName} />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    {allStages.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={handleDelete}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 border-b border-slate-800 bg-slate-900/50">
                        <TabsList className="bg-transparent h-12 p-0 space-x-6">
                            <TabsTrigger value="timeline" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-blue-500 transition-none">Timeline</TabsTrigger>
                            <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-blue-500 transition-none">Details</TabsTrigger>
                            <TabsTrigger value="tasks" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none px-0 pb-3 text-slate-400 data-[state=active]:text-blue-500 transition-none">Tasks</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-hidden bg-slate-950/30">
                        <ScrollArea className="h-full">
                            <div className="p-6">
                                <TabsContent value="timeline" className="mt-0 space-y-6">
                                    {/* Add Note Section */}
                                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800/50 space-y-3">
                                        <Textarea
                                            placeholder="Write a note..."
                                            className="bg-transparent border-none resize-none focus-visible:ring-0 min-h-[60px] p-0 text-sm"
                                            value={newNote}
                                            onChange={e => setNewNote(e.target.value)}
                                        />
                                        <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                                            <div className="flex gap-2 text-slate-500">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-800"><Mail size={14} /></Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-slate-800"><Phone size={14} /></Button>
                                            </div>
                                            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700" onClick={handleAddNote}>Save Note</Button>
                                        </div>
                                    </div>

                                    {/* Timeline Items */}
                                    <div className="space-y-6 relative pl-4 border-l-2 border-slate-800 ml-3">
                                        {loadingInteractions ? <div className="text-slate-500 text-xs pl-4">Loading history...</div> : interactions.length === 0 ? <div className="text-slate-500 text-xs pl-4">No interactions yet.</div> : interactions.map((item) => (
                                            <div key={item.id} className="relative pl-6">
                                                <div className={`absolute -left-[31px] top-0 h-7 w-7 rounded-full border-4 border-slate-950 flex items-center justify-center text-white ${item.type === 'email' ? 'bg-blue-500' :
                                                    item.type === 'call' ? 'bg-green-500' :
                                                        item.type === 'status_change' ? 'bg-yellow-500' : 'bg-slate-600'
                                                    }`}>
                                                    {item.type === 'email' ? <Mail size={12} /> :
                                                        item.type === 'call' ? <Phone size={12} /> :
                                                            item.type === 'status_change' ? <Clock size={12} /> : <FileText size={12} />}
                                                </div>
                                                <div className="bg-slate-900 p-3 rounded-md border border-slate-800">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-medium text-sm text-slate-200 capitalize">{item.type.replace('_', ' ')}</span>
                                                        <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-400 whitespace-pre-wrap">{item.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="details" className="mt-0">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider">Contact Name</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={formData.first_name || ''}
                                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                                        className="bg-slate-900 border-slate-800"
                                                        placeholder="First Name"
                                                    />
                                                    <Input
                                                        value={formData.last_name || ''}
                                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                                        className="bg-slate-900 border-slate-800"
                                                        placeholder="Last Name"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider">Email</Label>
                                                <Input
                                                    value={formData.email || ''}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="bg-slate-900 border-slate-800"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider">Values</Label>
                                                <Input
                                                    type="number"
                                                    value={formData.value || ''}
                                                    onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                                    className="bg-slate-900 border-slate-800"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider">Company</Label>
                                                <Input
                                                    value={formData.company || ''}
                                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                                    className="bg-slate-900 border-slate-800"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-slate-500 text-xs uppercase tracking-wider">Source</Label>
                                                <Select value={formData.source} onValueChange={v => setFormData({ ...formData, source: v })}>
                                                    <SelectTrigger className="bg-slate-900 border-slate-800"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="manual">Manual Entry</SelectItem>
                                                        <SelectItem value="website">Website</SelectItem>
                                                        <SelectItem value="referral">Referral</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="pt-4">
                                                <Button size="sm" onClick={handleSaveLead} className="w-full bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="tasks" className="mt-0">
                                    <div className="text-center text-slate-500 py-10">
                                        <Calendar className="mx-auto mb-2 opacity-50" size={32} />
                                        <p>No tasks assigned yet.</p>
                                        <Button variant="link" className="text-blue-400">Create Task</Button>
                                    </div>
                                </TabsContent>
                            </div>
                        </ScrollArea>
                    </div>

                </Tabs>
            </DialogContent>
        </Dialog >
    );
}
