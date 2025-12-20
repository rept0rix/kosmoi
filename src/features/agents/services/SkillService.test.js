import { SkillService } from './SkillService.js';

describe('SkillService', () => {
    describe('parseSkill', () => {
        it('should correctly parse a standard SKILL.md format', () => {
            const markdown = `
# Poet Skill
A skill that makes the agent write in rhymes.

## Instructions
You are now a poet.
Everything you write must rhyme.

## Tools
no tools defined
`;
            const result = SkillService.parseSkill(markdown);

            expect(result).toEqual({
                name: 'Poet Skill',
                description: 'A skill that makes the agent write in rhymes.',
                instructions: 'You are now a poet.\nEverything you write must rhyme.',
                toolsRaw: 'no tools defined'
            });
        });

        it('should handle missing sections gracefully', () => {
            const markdown = `
# Simple Skill
Just a description.
`;
            const result = SkillService.parseSkill(markdown);
            expect(result.name).toBe('Simple Skill');
            expect(result.description).toBe('Just a description.');
            expect(result.instructions).toBe('');
        });
    });
});
