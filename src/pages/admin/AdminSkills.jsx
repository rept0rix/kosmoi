import React, { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import { SkillService } from "@/features/agents/services/SkillService";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Brain,
  Code,
  Trash2,
  Edit,
  Save,
  Plus,
  Terminal,
  Play,
  Search,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

const AdminSkills = () => {
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [markdownInput, setMarkdownInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("agent_skills")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load skills");
    } else {
      setSkills(data || []);
    }
    setIsLoading(false);
  };

  const handleImport = async () => {
    try {
      if (!markdownInput.trim()) return;

      const parsed = SkillService.parseSkill(markdownInput);
      if (!parsed.name)
        throw new Error("Could not parse skill name from markdown");

      await SkillService.saveSkill(parsed, "SYSTEM"); // Using SYSTEM default user

      toast.success(`Skill "${parsed.name}" imported successfully!`);
      setMarkdownInput("");
      fetchSkills();
    } catch (e) {
      toast.error("Import Failed: " + e.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this skill?")) return;

    const { error } = await supabase.from("agent_skills").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete skill");
    } else {
      toast.success("Skill deleted");
      if (selectedSkill?.id === id) setSelectedSkill(null);
      fetchSkills();
    }
  };

  const filteredSkills = skills.filter(
    (s) =>
      (s.metadata?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (s.problem_pattern || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="p-6 bg-[#030712] min-h-screen text-slate-200 font-sans">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Header */}
        <div className="col-span-12 flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-3">
              <Brain className="w-8 h-8 text-emerald-400" />
              Agent Skills Matrix
            </h1>
            <p className="text-slate-400 mt-1">
              Teach your autonomous workforce new capabilities via Markdown
              instructions.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={fetchSkills}
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Refresh Skills"}
            </Button>
          </div>
        </div>

        {/* Left Sidebar: Skills List */}
        <div className="col-span-4 space-y-4">
          <GlassCard className="p-4 flex gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search skills..."
              className="bg-transparent border-none focus:outline-none text-white w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </GlassCard>

          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
            {filteredSkills.map((skill) => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`
                                    p-4 rounded-xl border cursor-pointer transition-all duration-200 group
                                    ${
                                      selectedSkill?.id === skill.id
                                        ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                                    }
                                `}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3
                    className={`font-bold ${selectedSkill?.id === skill.id ? "text-emerald-300" : "text-slate-200"}`}
                  >
                    {skill.metadata?.name || "Untitled Skill"}
                  </h3>
                  {selectedSkill?.id === skill.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(skill.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">
                  {skill.problem_pattern || "No description provided"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {(skill.trigger_tags || []).slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-[10px] h-5 bg-white/10 text-slate-300 border-none"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}

            {filteredSkills.length === 0 && (
              <div className="text-center py-10 text-slate-500">
                <Brain className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p>No skills found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor / Details */}
        <div className="col-span-8">
          {selectedSkill ? (
            <GlassCard className="h-full flex flex-col p-0 overflow-hidden">
              {/* Skill Header */}
              <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {selectedSkill.metadata?.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Code className="w-4 h-4" />
                    <span>v{selectedSkill.metadata?.version || "1.0.0"}</span>
                    <span className="mx-2">•</span>
                    <Clock className="w-4 h-4" />
                    <span>
                      Updated{" "}
                      {new Date(
                        selectedSkill.updated_at || selectedSkill.created_at,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button onClick={() => setSelectedSkill(null)} variant="ghost">
                  Close
                </Button>
              </div>

              {/* Skill Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h3 className="text-sm font-uppercase text-slate-500 font-bold mb-2 tracking-wider">
                    PROBLEM PATTERN
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-lg border border-white/10 text-slate-300 font-mono text-sm">
                    {selectedSkill.problem_pattern}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-uppercase text-slate-500 font-bold mb-2 tracking-wider">
                    INSTRUCTIONS
                  </h3>
                  <div className="bg-slate-950 p-4 rounded-lg border border-white/10 text-emerald-300 font-mono text-sm whitespace-pre-wrap">
                    {selectedSkill.solution_instructions}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-uppercase text-slate-500 font-bold mb-2 tracking-wider">
                    TRIGGERS
                  </h3>
                  <div className="flex gap-2">
                    {(selectedSkill.trigger_tags || []).map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-blue-500/20 text-blue-300 border-blue-500/30"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="h-full p-6 flex flex-col">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                Add New Skill
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Paste standard <code>SKILL.md</code> content below. The system
                will automatically parse metadata, patterns, and instructions.
              </p>
              <Textarea
                className="flex-1 bg-slate-950/50 border-white/10 font-mono text-sm text-slate-300 focus:border-emerald-500/50"
                placeholder="# Skill Name&#10;&#10;Description of what this skill does...&#10;&#10;## Instructions&#10;1. Do this...&#10;2. Then do that..."
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={handleImport}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Skill
                </Button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

// Clock icon helper since I missed importing it above
const Clock = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default AdminSkills;
