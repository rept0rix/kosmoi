import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SalesService } from '../../services/SalesService';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadDetailsDialog } from '../../components/crm/LeadDetailsDialog';
import { toast } from "@/components/ui/use-toast";

const CRMDashboard = ({ pipelineId }) => {
    // ... existing wrapper not needed if we just export Internal as default or whatever
    // But keeping existing structure.
    return <CRMDashboardWrapper pipelineId={pipelineId} />;
};

export default function CRMDashboardWrapper({ pipelineId, isAddLeadOpen, setIsAddLeadOpen, refreshTrigger }) {
    return (
        <CRMDashboardInternal
            pipelineId={pipelineId}
            externalAddLead={{ isOpen: isAddLeadOpen, setIsOpen: setIsAddLeadOpen }}
            refreshTrigger={refreshTrigger}
        />
    )
}

function CRMDashboardInternal({ pipelineId, externalAddLead, refreshTrigger }) {
    const [stages, setStages] = useState([]);
    const [leads, setLeads] = useState({});
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);

    // Internal state if external is not provided
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isAddLeadOpen = externalAddLead?.isOpen !== undefined ? externalAddLead.isOpen : internalIsOpen;
    const setIsAddLeadOpen = externalAddLead?.setIsOpen || setInternalIsOpen;

    const [newLead, setNewLead] = useState({ first_name: '', last_name: '', email: '', company: '', value: '' });

    // Fetch Pipeline and Stages
    useEffect(() => {
        fetchCRMData();
    }, [pipelineId, refreshTrigger]);

    const fetchCRMData = async () => {
        try {
            setLoading(true);
            const { stages, leadsByStage } = await SalesService.getPipelineData(pipelineId);
            setStages(stages);
            setLeads(leadsByStage);
        } catch (error) {
            console.error("Error fetching CRM data:", error);
            // toast({ title: "Error loading CRM", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistic UI Update
        const sourceStageId = source.droppableId;
        const destStageId = destination.droppableId;
        const movedLead = leads[sourceStageId].find(l => l.id === draggableId);

        if (!movedLead) return;

        // Create new objects to avoid mutation
        const newSourceLeads = Array.from(leads[sourceStageId]);
        const newDestLeads = sourceStageId === destStageId ? newSourceLeads : Array.from(leads[destStageId] || []);

        // Remove from source
        newSourceLeads.splice(source.index, 1);

        // Add to destination
        if (sourceStageId === destStageId) {
            newSourceLeads.splice(destination.index, 0, movedLead);
            setLeads({ ...leads, [sourceStageId]: newSourceLeads });
        } else {
            const updatedLead = { ...movedLead, stage_id: destStageId };
            newDestLeads.splice(destination.index, 0, updatedLead);
            setLeads({
                ...leads,
                [sourceStageId]: newSourceLeads,
                [destStageId]: newDestLeads
            });

            // Update DB via Service
            try {
                await SalesService.updateLeadStage(draggableId, destStageId);
            } catch (error) {
                console.error("Failed to move lead:", error);
                toast({ title: "Move failed", description: "Reverting changes...", variant: "destructive" });
                fetchCRMData(); // Revert on error
            }
        }
    };

    const handleAddLead = async () => {
        if ((!newLead.first_name && !newLead.company) || !stages.length) {
            toast({ title: "Missing Info", description: "Name or Company required", variant: "destructive" });
            return;
        }

        try {
            const leadData = {
                ...newLead,
                stage_id: stages[0].id, // Default to first stage
                source: 'manual',
                status: 'new',
                value: newLead.value ? parseFloat(newLead.value) : 0
            };

            await SalesService.createLead(leadData);

            toast({ title: "Lead Created", description: `${newLead.first_name || newLead.company} added to pipeline.` });
            setIsAddLeadOpen(false);
            setNewLead({ first_name: '', last_name: '', email: '', company: '', value: '' });
            fetchCRMData(); // Refresh board
        } catch (error) {
            console.error("Failed to create lead:", error);
            toast({ title: "Error", description: "Failed to create lead.", variant: "destructive" });
        }
    };

    if (loading && !stages.length) return <div className="p-10 text-center text-slate-400 animate-pulse">Loading Pipeline...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-900/50 text-white overflow-hidden rounded-xl border border-slate-800">
            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-6">
                        {stages.map(stage => (
                            <div key={stage.id} className="min-w-[300px] flex flex-col bg-slate-800/50 rounded-xl border border-slate-700/50">
                                {/* Column Header */}
                                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-800/90 rounded-t-xl backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color || '#94a3b8' }}></div>
                                        <span className="font-semibold text-slate-200">{stage.name}</span>
                                    </div>
                                    <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-600">
                                        {leads[stage.id]?.length || 0}
                                    </span>
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors scrollbar-thin scrollbar-thumb-slate-700 ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''
                                                }`}
                                        >
                                            {leads[stage.id]?.map((lead, index) => (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            onClick={() => setSelectedLead(lead)}
                                                            className={`p-4 bg-slate-700 rounded-lg shadow-sm border border-slate-600 hover:border-blue-500/50 group transition-all cursor-pointer ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-2 z-50' : 'hover:-translate-y-1'
                                                                }`}
                                                            style={provided.draggableProps.style}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-medium text-slate-100 truncate pr-2">
                                                                    {lead.business_name || lead.company || `${lead.first_name} ${lead.last_name}`}
                                                                </h3>
                                                                {lead.value > 0 && (
                                                                    <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
                                                                        ฿{lead.value.toLocaleString()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-3 truncate">
                                                                {lead.email || 'No email provided'}
                                                            </p>

                                                            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                                                                <span className="bg-slate-800 px-1.5 py-0.5 rounded">{lead.source}</span>
                                                            </div>
                                                        </div>
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
            </div>

            {/* Add Lead Dialog */}
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Add New Lead</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>First Name</Label>
                                <Input
                                    value={newLead.first_name}
                                    onChange={e => setNewLead({ ...newLead, first_name: e.target.value })}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Last Name</Label>
                                <Input
                                    value={newLead.last_name}
                                    onChange={e => setNewLead({ ...newLead, last_name: e.target.value })}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Company / Business Name</Label>
                            <Input
                                value={newLead.company}
                                onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={newLead.email}
                                onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estimated Value (฿)</Label>
                            <Input
                                type="number"
                                value={newLead.value}
                                onChange={e => setNewLead({ ...newLead, value: e.target.value })}
                                className="bg-slate-800 border-slate-700"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLeadOpen(false)} className="border-slate-700 hover:bg-slate-800 text-slate-200">Cancel</Button>
                        <Button onClick={handleAddLead} className="bg-blue-600 hover:bg-blue-700 text-white">Create Lead</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lead Details Dialog */}
            <LeadDetailsDialog
                lead={selectedLead}
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                onUpdate={fetchCRMData}
                allStages={stages}
            />
        </div>
    );
};
