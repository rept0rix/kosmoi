
function extractToolRequest(text) {
    console.log("Testing text:", JSON.stringify(text));

    // Find the TOOL: prefix
    const prefixRegex = /TOOL:\s*(\w+)\s*/g;
    const match = prefixRegex.exec(text);
    if (!match) {
        console.log("No match for prefix");
        return null;
    }

    const name = match[1];
    const startIndex = prefixRegex.lastIndex;

    // Find the first opening brace
    const openBraceIndex = text.indexOf('{', startIndex);
    if (openBraceIndex === -1) {
        console.log("No open brace found");
        return null;
    }

    // Count balanced braces to find the end
    let balance = 0;
    let endIndex = -1;

    for (let i = openBraceIndex; i < text.length; i++) {
        if (text[i] === '{') balance++;
        else if (text[i] === '}') balance--;

        if (balance === 0) {
            endIndex = i + 1;
            break;
        }
    }

    if (endIndex === -1) {
        console.log("No end brace found (unbalanced)");
        return null;
    }

    const jsonString = text.substring(openBraceIndex, endIndex);
    console.log("Extracted JSON:", jsonString);

    try {
        const payload = JSON.parse(jsonString);
        return { name, payload };
    } catch (e) {
        console.error("Failed to parse tool payload:", e);
        return null;
    }
}

// Test cases
const cases = [
    'TOOL: execute_command { "command": "ls", "args": ["-la"] }',
    'Some text before\nTOOL: execute_command { "command": "ls" }\nSome text after',
    'TOOL: execute_command { "nested": { "a": 1 } }',
    'TOOL: execute_command { "command": "ls", "args": ["-la"] }  ',
    'TOOL:execute_command{"command":"ls"}',
    '```\nTOOL: execute_command { "command": "ls" }\n```'
];

cases.forEach(c => {
    console.log("---");
    console.log("Result:", extractToolRequest(c));
});
