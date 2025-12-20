import React, { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { SkillService } from '@/features/agents/services/SkillService';

const AdminSkills = () => {
    const [skills, setSkills] = useState([]);
    const [markdownInput, setMarkdownInput] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        const { data } = await supabase.from('agent_skills').select('*').order('created_at', { ascending: false });
        setSkills(data || []);
    };

    const handleImport = async () => {
        try {
            setStatus('Parsing...');
            const parsed = SkillService.parseSkill(markdownInput);
            if (!parsed.name) throw new Error("Could not parse name");

            setStatus('Saving...');
            // In a real app we would get the actual user ID
            await SkillService.saveSkill(parsed, '2ff0dcb1-37f2-4338-bb3b-f71fb6dd444e');

            setStatus('Success! Skill Imported.');
            setMarkdownInput('');
            fetchSkills();
        } catch (e) {
            setStatus('Error: ' + e.message);
        }
    };

    return (
        <div className="p-6 bg-slate-900 min-h-screen text-white">
            <h1 className="text-3xl font-bold mb-6 text-emerald-400">Agent Skills Directory</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Import Panel */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Import New Skill</h2>
                    <p className="text-sm text-slate-400 mb-2">Paste SKILL.md content here:</p>
                    <textarea
                        className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-4 font-mono text-sm"
                        value={markdownInput}
                        onChange={(e) => setMarkdownInput(e.target.value)}
                        placeholder="# Skill Name..."
                    />
                    <div className="mt-4 flex justify-between items-center">
                        <span className="text-amber-400 text-sm">{status}</span>
                        <button
                            onClick={handleImport}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-medium transition-colors"
                        >
                            Import Skill
                        </button>
                    </div>
                </div>

                {/* Skills List */}
                <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
                    <h2 className="text-xl font-semibold mb-4">Installed Skills</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {skills.map(skill => (
                            <div key={skill.id} className="bg-slate-900 p-4 rounded border border-slate-700 hover:border-emerald-500/50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-emerald-300">
                                        {skill.metadata?.name || skill.id.slice(0, 8)}
                                    </h3>
                                    <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">
                                        {new Date(skill.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                                    {skill.problem_pattern}
                                </p>
                                <div className="mt-3 text-xs font-mono text-slate-500">
                                    Tags: {skill.trigger_tags?.join(', ') || 'none'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSkills;
