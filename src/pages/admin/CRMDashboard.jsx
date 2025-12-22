import React, { useState, useEffect } from 'react';
import KanbanBoard from '@/components/board/KanbanBoard';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadDetailsDialog } from '@/features/leads/components/LeadDetailsDialog';
import { toast } from "@/components/ui/use-toast";
import { useRxQuery } from '@/shared/hooks/useRxQuery';
import { DatabaseService } from '@/core/db/database';
import { v4 as uuidv4 } from 'uuid';

export default function CRMDashboardWrapper({ pipelineId, isAddLeadOpen, setIsAddLeadOpen, refreshTrigger }) {
    return (
        <CRMDashboardInternal
            pipelineId={pipelineId}
            externalAddLead={{ isOpen: isAddLeadOpen, setIsOpen: setIsAddLeadOpen }}
        />
    )
}

function CRMDashboardInternal({ pipelineId, externalAddLead }) {
    // --- RxDB Hooks ---
    // 1. Fetch Stages
    const { data: stagesData, loading: stagesLoading } = useRxQuery('stages',
        collection => collection.find().sort({ position: 'asc' })
    );

    // 2. Fetch Contacts (Leads)
    const { data: leadsData, loading: leadsLoading } = useRxQuery('contacts',
        collection => collection.find().sort({ updated_at: 'desc' })
    );

    // --- State Management ---
    const [stages, setStages] = useState([]);
    const [leadsByStage, setLeadsByStage] = useState({});
    const [selectedLead, setSelectedLead] = useState(null);

    // Internal state if external is not provided
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isAddLeadOpen = externalAddLead?.isOpen !== undefined ? externalAddLead.isOpen : internalIsOpen;
    const setIsAddLeadOpen = externalAddLead?.setIsOpen || setInternalIsOpen;

    const [newLead, setNewLead] = useState({ first_name: '', last_name: '', email: '', company: '', value: '' });

    // --- Data Processing ---
    useEffect(() => {
        if (stagesData) {
            // Filter by pipelineId if provided, otherwise generic behavior (or default pipeline logic if needed)
            // For now, we use all stages or filter if pipelineId exists in schema (it does)
            const filteredStages = pipelineId
                ? stagesData.filter(s => s.pipeline_id === pipelineId)
                : stagesData;
            setStages(filteredStages);

            // Seeding Logic: If loaded but empty, create defaults
            if (!stagesLoading && stagesData.length === 0) {
                const seedStages = async () => {
                    console.log("Seeding default stages...");
                    const db = await DatabaseService.get();
                    const defaults = [
                        { name: 'New', color: 'blue', position: 0 },
                        { name: 'Qualified', color: 'purple', position: 1 },
                        { name: 'Proposal', color: 'yellow', position: 2 },
                        { name: 'Negotiation', color: 'orange', position: 3 },
                        { name: 'Closed Won', color: 'green', position: 4 },
                        { name: 'Closed Lost', color: 'red', position: 5 }
                    ];

                    const pipeline = pipelineId || 'default-pipeline';
                    await Promise.all(defaults.map(s => db.stages.insert({
                        id: `stage-${s.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`, // Simple unique ID
                        name: s.name,
                        color: s.color,
                        position: s.position,
                        pipeline_id: pipeline,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })));
                    toast({ title: "System", description: "Default CRM stages created." });
                };
                seedStages();
            }
        }
    }, [stagesData, pipelineId, stagesLoading]);

    useEffect(() => {
        if (leadsData && stages.length > 0) {
            const grouped = {};
            stages.forEach(s => grouped[s.id] = []);

            leadsData.forEach(lead => {
                // If lead has a valid stage, add it. Otherwise fallback to first stage?
                if (grouped[lead.stage_id]) {
                    grouped[lead.stage_id].push(lead);
                } else if (stages[0]) {
                    // Fallback or ignore. Let's ignore for now or put in backlog if we had one.
                }
            });
            setLeadsByStage(grouped);
        }
    }, [leadsData, stages]);


    const onDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Optimistic UI handled by RxDB automatically if we write cleanly
        const destStageId = destination.droppableId;

        try {
            const db = await DatabaseService.get();
            const leadDoc = await db.contacts.findOne(draggableId).exec();
            if (leadDoc) {
                await leadDoc.patch({
                    stage_id: destStageId,
                    updated_at: new Date().toISOString() // Ensure sync picks it up
                });
            }
        } catch (error) {
            console.error("Failed to move lead:", error);
            toast({ title: "Move failed", description: "Could not update database.", variant: "destructive" });
        }
    };

    const handleAddLead = async () => {
        if ((!newLead.first_name && !newLead.company) || !stages.length) {
            toast({ title: "Missing Info", description: "Name or Company required", variant: "destructive" });
            return;
        }

        try {
            const db = await DatabaseService.get();
            const newId = uuidv4();

            await db.contacts.insert({
                id: newId, // UUID
                ...newLead,
                stage_id: stages[0].id,
                source: 'manual',
                status: 'new',
                value: newLead.value ? parseFloat(newLead.value) : 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            toast({ title: "Lead Created", description: `${newLead.first_name || newLead.company} added to pipeline.` });
            setIsAddLeadOpen(false);
            setNewLead({ first_name: '', last_name: '', email: '', company: '', value: '' });
        } catch (error) {
            console.error("Failed to create lead:", error);
            toast({ title: "Error", description: "Failed to create lead locally.", variant: "destructive" });
        }
    };

    if (stagesLoading && !stages.length) return (
        <div className="flex h-full items-center justify-center space-y-4 flex-col opacity-50">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading Pipeline...</p>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-background/40 backdrop-blur-sm overflow-hidden rounded-2xl border border-border shadow-inner">
            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-0">
                {stagesLoading && !stages.length ? (
                    <div className="p-10 text-center text-muted-foreground animate-pulse">Loading Pipeline...</div>
                ) : (
                    <KanbanBoard
                        tasks={leadsData || []}
                        columns={stages.map(s => ({
                            id: s.id,
                            label: s.name,
                            // Use semantic colors mapped to specific stage logic if needed, or default
                            color: undefined
                        }))}
                        onUpdateTaskStatus={onDragEnd}
                        taskAdapter={(lead) => ({
                            id: lead.id,
                            title: lead.business_name || lead.company || `${lead.first_name} ${lead.last_name}`,
                            status: lead.stage_id,
                            value: lead.value,
                            company: lead.company,
                            assigned_to: lead.assigned_to,
                            tags: lead.source ? [lead.source] : [],
                            priority: lead.value > 10000 ? 'high' : lead.value > 5000 ? 'medium' : 'low', // Auto-priority example
                            ...lead
                        })}
                        isRTL={false}
                    />
                )}
            </div>

            {/* Add Lead Dialog */}
            <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                <DialogContent className="bg-background border-border sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-outfit font-bold text-foreground">Add New Lead</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 py-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Contact Name</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        placeholder="First"
                                        value={newLead.first_name}
                                        onChange={e => setNewLead({ ...newLead, first_name: e.target.value })}
                                        className="bg-muted/30 border-border focus:ring-primary/20"
                                    />
                                    <Input
                                        placeholder="Last"
                                        value={newLead.last_name}
                                        onChange={e => setNewLead({ ...newLead, last_name: e.target.value })}
                                        className="bg-muted/30 border-border focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="client@company.com"
                                    value={newLead.email}
                                    onChange={e => setNewLead({ ...newLead, email: e.target.value })}
                                    className="bg-muted/30 border-border focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Company</Label>
                                <Input
                                    placeholder="Business Name"
                                    value={newLead.company}
                                    onChange={e => setNewLead({ ...newLead, company: e.target.value })}
                                    className="bg-muted/30 border-border focus:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-muted-foreground">Estimated Value</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">฿</span>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={newLead.value}
                                        onChange={e => setNewLead({ ...newLead, value: e.target.value })}
                                        className="pl-8 bg-muted/30 border-border focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddLeadOpen(false)} className="border-border hover:bg-muted text-muted-foreground">Cancel</Button>
                        <Button onClick={handleAddLead} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">Create Lead</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Lead Details Dialog */}
            {/* Note: LeadDetailsDialog might need updates if it pulls data internally. For now we pass the object so it should display ok. Updates inside it will need similar refactor if they don't use the onUpdate callback properly. */}
            <LeadDetailsDialog
                lead={selectedLead}
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                // onUpdate prop was used to trigger fetchCRMData. Since we use RxDB, we don't need manual fetch.
                // However, LeadDetailsDialog likely calls SalesService.updateLead. We should inspect that next if we want Full Offline there too.
                onUpdate={() => { }}
                allStages={stages}
            />
        </div>
    );
};
