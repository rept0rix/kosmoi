import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { supabase } from '../../api/supabaseClient';

const CRMDashboard = () => {
    const [stages, setStages] = useState([]);
    const [leads, setLeads] = useState({});
    const [loading, setLoading] = useState(true);

    // Fetch Pipeline and Stages
    useEffect(() => {
        fetchCRMData();
    }, []);

    const fetchCRMData = async () => {
        try {
            setLoading(true);
            // 1. Get Stages (assuming 'General Sales' pipeline for now)
            // To make dynamic: fetch pipelines first, let user select.
            // Optimizing: fetching stages directly where pipeline name = 'General Sales' (or first one)
            const { data: pipelineData } = await supabase.from('crm_pipelines').select('id').eq('name', 'General Sales').single();
            const pipelineId = pipelineData?.id;

            if (!pipelineId) {
                console.error("Default pipeline not found");
                return;
            }

            const { data: stagesData, error: stagesError } = await supabase
                .from('crm_stages')
                .select('*')
                .eq('pipeline_id', pipelineId)
                .order('position');

            if (stagesError) throw stagesError;

            // 2. Get Leads
            const { data: leadsData, error: leadsError } = await supabase
                .from('crm_leads')
                .select('*');

            if (leadsError) throw leadsError;

            // Organize leads by stage
            const leadsByStage = {};
            stagesData.forEach(stage => {
                leadsByStage[stage.id] = leadsData.filter(lead => lead.stage_id === stage.id);
            });

            setStages(stagesData);
            setLeads(leadsByStage);
        } catch (error) {
            console.error("Error fetching CRM data:", error);
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

        const newSourceLeads = Array.from(leads[sourceStageId]);
        newSourceLeads.splice(source.index, 1);

        const newDestLeads = Array.from(leads[destStageId] || []); // Handle empty dest
        if (sourceStageId === destStageId) {
            newDestLeads.splice(source.index, 1); // If same col, remove first (already done above but clean var needed)
            // actually if same col, newSourceLeads is mostly correct, just need insert
            // simpler logic:
            const updatedList = Array.from(leads[sourceStageId]);
            const [removed] = updatedList.splice(source.index, 1);
            updatedList.splice(destination.index, 0, removed);
            setLeads({ ...leads, [sourceStageId]: updatedList });
        } else {
            newDestLeads.splice(destination.index, 0, { ...movedLead, stage_id: destStageId });
            setLeads({
                ...leads,
                [sourceStageId]: newSourceLeads,
                [destStageId]: newDestLeads
            });

            // Update DB
            const { error } = await supabase
                .from('crm_leads')
                .update({ stage_id: destStageId })
                .eq('id', draggableId);

            if (error) {
                console.error("Failed to move lead:", error);
                fetchCRMData(); // Revert on error
            }
        }
    };

    // Quick Add Lead (Demo feature)
    const addDemoLead = async () => {
        const firstName = prompt("Lead First Name:");
        if (!firstName) return;

        // Default to first stage
        const firstStage = stages[0];
        if (!firstStage) return;

        const { data, error } = await supabase.from('crm_leads').insert({
            first_name: firstName,
            stage_id: firstStage.id,
            source: 'manual',
            status: 'new'
        }).select().single();

        if (data) {
            setLeads(prev => ({
                ...prev,
                [firstStage.id]: [...(prev[firstStage.id] || []), data]
            }));
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading CRM...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-900 text-white overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        CRM Pipeline
                    </h1>
                    <p className="text-slate-400 text-sm">Manage your leads and deals.</p>
                </div>
                <button
                    onClick={addDemoLead}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
                >
                    + New Lead
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex h-full gap-6">
                        {stages.map(stage => (
                            <div key={stage.id} className="min-w-[300px] flex flex-col bg-slate-800/50 rounded-xl border border-slate-700/50">
                                {/* Column Header */}
                                <div className="p-4 border-b border-slate-700/50 flex justify-between items-center sticky top-0 bg-slate-800/90 rounded-t-xl backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }}></div>
                                        <span className="font-semibold">{stage.name}</span>
                                    </div>
                                    <span className="bg-slate-700 text-xs px-2 py-1 rounded-full">
                                        {leads[stage.id]?.length || 0}
                                    </span>
                                </div>

                                {/* Droppable Area */}
                                <Droppable droppableId={stage.id}>
                                    {(provided, snapshot) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className={`flex-1 p-3 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-700/30' : ''
                                                }`}
                                        >
                                            {leads[stage.id]?.map((lead, index) => (
                                                <Draggable key={lead.id} draggableId={lead.id} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-4 bg-slate-700 rounded-lg shadow-sm border border-slate-600 hover:border-blue-500/50 group transition-all ${snapshot.isDragging ? 'shadow-2xl ring-2 ring-blue-500 rotate-2' : ''
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <h3 className="font-medium text-slate-100">{lead.first_name} {lead.last_name}</h3>
                                                                {lead.value && (
                                                                    <span className="text-xs font-mono text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                                                                        ฿{lead.value}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-3 truncate">{lead.company || lead.email || 'No contact info'}</p>

                                                            <div className="flex gap-2 text-[10px] text-slate-500 uppercase tracking-wider">
                                                                <span>{lead.source}</span>
                                                                {/* Could add days in stage here */}
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
        </div>
    );
};

export default CRMDashboard;
