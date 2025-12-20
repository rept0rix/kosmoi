import { db, supabase } from "@/api/supabaseClient.js";

/**
 * Service to manage Agent Skills.
 * Adheres to the standard defined at agentskills.io.
 * 
 * Capability:
 * - Parse SKILL.md content
 * - Store skills in 'agent_skills' table
 * - Search skills by semantic match (or keyword for now)
 */
export const SkillService = {

    /**
     * Parses the markdown content of a SKILL.md file.
     * Expected format:
     * 
     * # [Skill Name]
     * [Description]
     * 
     * ## Instructions
     * ...
     * 
     * ## Tools
     * ...
     * 
     * @param {string} markdown 
     * @returns {Object} { name, description, instructions, toolsRaw }
     */
    parseSkill(markdown) {
        if (!markdown) return null;

        const lines = markdown.split('\n');
        let name = "Untitled Skill";
        let description = "";
        let instructions = "";
        let toolsRaw = "";

        let currentSection = 'meta'; // meta, instructions, tools

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('# ')) {
                // H1 - Skill Name
                if (currentSection === 'meta') {
                    name = line.replace('# ', '').trim();
                }
                continue;
            }

            if (line.startsWith('## ')) {
                const sectionHeader = line.toLowerCase();
                if (sectionHeader.includes('instruction')) {
                    currentSection = 'instructions';
                } else if (sectionHeader.includes('tool')) {
                    currentSection = 'tools';
                } else {
                    currentSection = 'other';
                }
                continue;
            }

            // Content parsing
            if (currentSection === 'meta') {
                if (line.trim() !== '') {
                    description += line + '\n';
                }
            } else if (currentSection === 'instructions') {
                instructions += line + '\n';
            } else if (currentSection === 'tools') {
                toolsRaw += line + '\n';
            }
        }

        return {
            name,
            description: description.trim(),
            instructions: instructions.trim(),
            toolsRaw: toolsRaw.trim()
        };
    },

    /**
     * Saves a parsed skill to the database.
     * @param {Object} skillData 
     * @param {string} userId 
     */
    async saveSkill(skillData, userId) {
        if (!skillData || !skillData.name) throw new Error("Invalid skill data.");

        try {
            // FALLBACK: If 'metadata' column doesn't exist, we skip it
            const payload = {
                category: 'imported',
                trigger_tags: [skillData.name.toLowerCase().replace(/\s+/g, '_')],
                problem_pattern: skillData.description,
                solution_pattern: skillData.instructions,
                confidence: 1.0,
                created_by: userId
                // OMIT metadata to avoid Schema Errors if column missing
            };

            const { data, error } = await supabase
                .from('agent_skills')
                .insert([payload])
                .select();

            if (error) throw error;
            return data[0];
        } catch (e) {
            console.error("SkillService: Failed to save skill", e);
            throw e;
        }
    },

    /**
     * Finds relevant skills based on a query (User Message).
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async findRelevantSkills(query) {
        if (!query) return [];

        try {
            // 1. Keyword search on problem_pattern (description) - Removed metadata query to be safe
            const { data, error } = await supabase
                .from('agent_skills')
                .select('*')
                .or(`problem_pattern.ilike.%${query}%`)
                .limit(3);

            if (error) throw error;

            return data.map(s => ({
                // Fallback name logic if metadata is missing
                name: (s.metadata && s.metadata.name) ? s.metadata.name : (s.trigger_tags ? s.trigger_tags[0] : "Skill"),
                instructions: s.solution_pattern,
                description: s.problem_pattern
            }));

        } catch (e) {
            console.error("SkillService: Search failed", e);
            return [];
        }
    }
};
