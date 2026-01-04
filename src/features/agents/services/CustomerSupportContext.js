/**
 * Customer Support Context Service
 *
 * Prepares and injects provider-specific context into agent prompts
 * for customer-facing chatbot interactions.
 */

/**
 * Builds a formatted context string from provider data
 * @param {Object} provider - Service provider data
 * @returns {string} Formatted context for AI consumption
 */
export function buildProviderContext(provider) {
  if (!provider) return '';

  const parts = [];

  // Business basics
  parts.push(`CUSTOMER SUPPORT CONTEXT:`);
  parts.push(`You are currently assisting a customer viewing: "${provider.business_name || 'Unknown Business'}"`);

  if (provider.category) {
    parts.push(`Category: ${provider.category}`);
  }

  if (provider.location) {
    parts.push(`Location: ${provider.location}`);
  }

  // Rating and reviews
  if (provider.average_rating) {
    const reviewCount = provider.total_reviews || 'several';
    parts.push(`Rating: ${provider.average_rating}/5 (${reviewCount} reviews)`);
  }

  // Description (truncated to avoid context bloat)
  if (provider.description) {
    const truncatedDesc = provider.description.substring(0, 300);
    const desc = provider.description.length > 300 ? `${truncatedDesc}...` : truncatedDesc;
    parts.push(`Description: ${desc}`);
  }

  // Operating hours
  if (provider.available_hours) {
    parts.push(`Available Hours: ${provider.available_hours}`);
  }

  // Languages spoken
  if (provider.languages && provider.languages.length > 0) {
    parts.push(`Languages: ${provider.languages.join(', ')}`);
  }

  // Contact info
  if (provider.phone) {
    parts.push(`Phone: ${provider.phone}`);
  }

  if (provider.website) {
    parts.push(`Website: ${provider.website}`);
  }

  if (provider.whatsapp) {
    parts.push(`WhatsApp Available: Yes`);
  }

  // Important instruction
  parts.push('');
  parts.push('PRIORITY: Answer questions about THIS provider specifically. If asked about booking, hours, services, or location, refer to the above context first.');
  parts.push('');

  return parts.join('\n');
}

/**
 * Enhances an agent's system prompt with provider-specific context
 * @param {Object} agent - Agent configuration object
 * @param {Object} provider - Service provider data
 * @returns {Object} Agent with enhanced system prompt
 */
export function enhanceAgentPrompt(agent, provider) {
  if (!agent || !provider) return agent;

  const providerContext = buildProviderContext(provider);

  return {
    ...agent,
    systemPrompt: `${agent.systemPrompt}\n\n${providerContext}`
  };
}

/**
 * Detects booking intent in customer messages
 * @param {string} message - Customer message text
 * @returns {boolean} True if booking intent detected
 */
export function extractBookingIntent(message) {
  if (!message) return false;

  const bookingKeywords = [
    'book',
    'booking',
    'reserve',
    'reservation',
    'appointment',
    'schedule',
    'תור',      // Hebrew: appointment
    'הזמנה',    // Hebrew: booking/order
    'קביעת',    // Hebrew: setting (appointment)
  ];

  const lowerMessage = message.toLowerCase();

  return bookingKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Formats provider data for display in chat messages
 * @param {Object} provider - Service provider data
 * @returns {Object} Formatted provider card data
 */
export function formatProviderCard(provider) {
  if (!provider) return null;

  return {
    id: provider.id,
    name: provider.business_name,
    category: provider.category,
    rating: provider.average_rating,
    location: provider.location,
    image: provider.image_url || provider.images?.[0],
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    website: provider.website,
    isOpen: checkIfOpen(provider.available_hours),
  };
}

/**
 * Simple check if provider is currently open
 * @param {string} hours - Available hours string
 * @returns {boolean} True if likely open
 */
function checkIfOpen(hours) {
  if (!hours) return null;

  // Simple heuristic: check if "24/7" or contains current day
  if (hours.includes('24/7') || hours.includes('24 hours')) {
    return true;
  }

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[now.getDay()];

  // Check if hours mention today
  const hoursLower = hours.toLowerCase();
  if (hoursLower.includes(today)) {
    // Very simple check - in production would need proper parsing
    return true;
  }

  // Default to unknown
  return null;
}

/**
 * Extracts action from message content
 * @param {string} content - Message content
 * @returns {Object|null} Action object if detected
 */
export function extractMessageAction(content) {
  if (!content) return null;

  // Detect [BOOK_NOW:providerId] pattern
  const bookNowMatch = content.match(/\[BOOK_NOW:([^\]]+)\]/);
  if (bookNowMatch) {
    return {
      type: 'book_now',
      providerId: bookNowMatch[1]
    };
  }

  // Detect [SHOW_MAP] pattern
  if (content.includes('[SHOW_MAP]')) {
    return {
      type: 'show_map'
    };
  }

  // Detect [CALL:phone] pattern
  const callMatch = content.match(/\[CALL:([^\]]+)\]/);
  if (callMatch) {
    return {
      type: 'call',
      phone: callMatch[1]
    };
  }

  return null;
}
