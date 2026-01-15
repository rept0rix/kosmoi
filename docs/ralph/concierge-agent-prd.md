# PRD: Concierge Agent Logic (Ralph Loop)

## Overview
We need to upgrade the "Concierge Agent" from a simple responder to a proactive, tool-using expert that follows the "Ralph Loop" (Thought -> Action -> Observation -> Response).

## Requirements

### 1. Core Logic (The Brain)
- **Role**: Koh Samui Local Expert ("The Local Friend").
- **Constraint**: MUST strictly follow the `Thought -> Action -> Observation` cycle before answering.
- **Personality**: High energy, opinionated, helpful. not a robot.

### 2. Capabilities (Tools)
The agent needs to effectively use the following tools:
- **`search_services`**: To find restaurants, tours, etc.
- **`search_knowledge_base`**: To answer questions about history, culture, or tips.
- **`suggest_itinerary`** (New): To organize recommendations into a day plan.

### 3. Test Scenarios (Red -> Green)

#### Scenario A: Simple Recommendation
- **User**: "Where can I get good pizza?"
- **Expected Flow**:
    1.  **Thought**: User wants pizza. I need to search for highly-rated pizza places.
    2.  **Action**: `search_services({ query: "pizza", location: "samui" })`
    3.  **Observation**: [List of 3 pizza places: Prego, Cafe 69, etc.]
    4.  **Response**: "Oh, for pizza you HAVE to try **Prego** if you want fancy, or..."

#### Scenario B: Itinerary Planning
- **User**: "Plan a day for me in Fisherman's Village."
- **Expected Flow**:
    1.  **Thought**: User wants a full day plan for Fisherman's Village.
    2.  **Action**: `search_services({ location: "Fisherman's Village" })`
    3.  **Observation**: [List of shops, cafes, beach bars]
    4.  **Response**: Returns a structured itinerary (Morning: Coffee, Afternoon: Beach, Evening: Night Market).

### 4. Technical Goals
1.  **Refactor `ConciergeAgent.js`**: Ensure the system prompt enforces the JSON structure for the loop.
2.  **Unit Tests**: Write tests that simulate the conversation loop and assert correct tool usage.
