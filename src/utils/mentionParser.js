/**
 * Parses a message content for @mentions and returns the matching agent from the active list.
 * 
 * @param {string} content - The message text.
 * @param {Array} activeAgents - List of active agent objects [{id, role, name}, ...].
 * @returns {Object|null} - The matched agent object or null.
 */
export function findMentionedAgent(content, activeAgents) {
    if (!content || !activeAgents) return null;

    const mentionMatch = content.match(/@([a-zA-Z0-9_-]+)/);
    if (mentionMatch) {
        const mentionedName = mentionMatch[1].toLowerCase();

        return activeAgents.find(a => {
            const id = (a.id || '').toLowerCase();
            const role = (a.role || '').toLowerCase();
            const name = (a.name || '').toLowerCase();

            // Direct match
            if (id.includes(mentionedName) || role.includes(mentionedName) || name.includes(mentionedName)) return true;

            // Match with spaces removed (e.g. @TechLead -> "Tech Lead")
            const roleNoSpaces = role.replace(/\s+/g, '');
            const nameNoSpaces = name.replace(/\s+/g, '');

            if (roleNoSpaces.includes(mentionedName)) return true;
            if (nameNoSpaces.includes(mentionedName)) return true;

            return false;
        }) || null;
    }
    return null;
}
