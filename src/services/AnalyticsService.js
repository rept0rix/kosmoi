import { supabase } from "../api/supabaseClient.js";
import posthog from "posthog-js";

// ============================================
// POSTHOG INITIALIZATION
// ============================================

let posthogInitialized = false;

/**
 * Initialize PostHog analytics (call once on app start)
 */
export const initPostHog = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY;

  if (!posthogKey) {
    console.warn("[Analytics] VITE_POSTHOG_KEY not set - PostHog disabled");
    return false;
  }

  if (posthogInitialized) return true;

  posthog.init(posthogKey, {
    api_host: "https://us.i.posthog.com",
    autocapture: true,
    capture_pageview: true,
    persistence: "localStorage",
    loaded: () => {
      console.log("[Analytics] PostHog initialized");
      posthogInitialized = true;
    },
  });

  return true;
};

/**
 * Identify user in PostHog (call after login)
 */
export const identifyUser = (userId, properties = {}) => {
  if (posthogInitialized) {
    posthog.identify(userId, {
      ...properties,
      last_identified_at: new Date().toISOString(),
    });
  }
};

/**
 * Reset PostHog user (call on logout)
 */
export const resetPostHogUser = () => {
  if (posthogInitialized) {
    posthog.reset();
  }
};

// ============================================
// DUAL TRACKING (PostHog + Supabase)
// ============================================

/**
 * Track event to both PostHog and Supabase
 */
const trackDual = async (eventName, properties = {}, userId = null) => {
  // PostHog tracking (immediate)
  if (posthogInitialized) {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }

  // Supabase tracking (for internal analytics)
  try {
    if (!userId) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      userId = session?.user?.id || null;
    }

    const payload = {
      event_name: eventName,
      user_id: userId,
      properties: {
        ...properties,
        page_url:
          typeof window !== "undefined" ? window.location.pathname : null,
      },
    };

    // Fire and forget
    supabase
      .from("analytics_events")
      .insert([payload])
      .then(({ error }) => {
        if (error) console.warn("Analytics logging failed:", error);
      });
  } catch (err) {
    console.warn("Supabase analytics error:", err);
  }
};

// ============================================
// ANALYTICS SERVICE (Original + Enhanced)
// ============================================

export const AnalyticsService = {
  // Initialize PostHog
  init: initPostHog,
  identify: identifyUser,
  reset: resetPostHogUser,

  /**
   * Log an event to both PostHog and Supabase
   */
  logEvent: async (eventName, properties = {}, userId = null) => {
    await trackDual(eventName, properties, userId);
  },

  /**
   * Track a page view
   */
  trackPageView: (pageName) => {
    trackDual("page_view", { page_name: pageName });
  },

  // ============================================
  // PREDEFINED EVENTS
  // ============================================

  // === OneDollar Flow ===
  oneDollar: {
    pageViewed: () =>
      trackDual("onedollar_page_viewed", {
        page: "OneDollar",
        source:
          typeof document !== "undefined"
            ? document.referrer || "direct"
            : "unknown",
      }),

    checkoutClicked: () =>
      trackDual("onedollar_checkout_clicked", {
        price: 35,
        currency: "THB",
      }),

    paymentSuccess: (subscriptionId) =>
      trackDual("onedollar_payment_success", {
        subscription_id: subscriptionId,
        price: 35,
        currency: "THB",
      }),
  },

  // === User Lifecycle ===
  user: {
    signup: (method = "email") =>
      trackDual("user_signup", {
        method,
        source:
          typeof document !== "undefined"
            ? document.referrer || "direct"
            : "unknown",
      }),

    login: (method = "email") => trackDual("user_login", { method }),

    logout: () => trackDual("user_logout"),
  },

  // === Business Events ===
  business: {
    claimed: (businessId, category) =>
      trackDual("business_claimed", {
        business_id: businessId,
        category,
      }),

    updated: (businessId, fieldsUpdated) =>
      trackDual("business_profile_updated", {
        business_id: businessId,
        fields_updated: fieldsUpdated,
      }),
  },

  // === Lead Events ===
  lead: {
    received: (leadId, source) =>
      trackDual("lead_received", {
        lead_id: leadId,
        source,
      }),

    contacted: (leadId, method) =>
      trackDual("lead_contacted", {
        lead_id: leadId,
        contact_method: method,
      }),
  },

  // === Subscription Events ===
  subscription: {
    trialStarted: (planName) =>
      trackDual("trial_started", {
        plan: planName,
        trial_days: 14,
      }),

    upgraded: (planName, price) =>
      trackDual("trial_upgraded", {
        plan: planName,
        price,
        currency: "THB",
      }),

    churned: (reason = "unknown") => trackDual("trial_churned", { reason }),
  },

  // === Onboarding Events ===
  onboarding: {
    stepCompleted: (step, totalSteps) =>
      trackDual("onboarding_step_completed", {
        step,
        total_steps: totalSteps,
        progress: Math.round((step / totalSteps) * 100),
      }),

    completed: () => trackDual("onboarding_completed"),
  },

  // === Feature Usage ===
  feature: (featureName, properties = {}) =>
    trackDual("feature_used", {
      feature: featureName,
      ...properties,
    }),

  // === Search Events ===
  search: (query, resultsCount) =>
    trackDual("search_performed", {
      query,
      results_count: resultsCount,
    }),

  // === Booking Events ===
  booking: {
    started: (providerId, serviceType) =>
      trackDual("booking_started", {
        provider_id: providerId,
        service_type: serviceType,
      }),

    completed: (bookingId, providerId, amount) =>
      trackDual("booking_completed", {
        booking_id: bookingId,
        provider_id: providerId,
        amount,
        currency: "THB",
      }),
  },

  // === AI/Agent Events ===
  agent: {
    interaction: (agentId, action) =>
      trackDual("agent_interaction", {
        agent_id: agentId,
        action,
      }),

    chat: (meetingId) =>
      trackDual("chat_message_sent", {
        meeting_id: meetingId,
      }),
  },
};

export default AnalyticsService;
