
import React from 'react';
import SupportChat from './SupportChat';

/**
 * Legacy Support Page - Now renders the new Support Chat directly
 * to avoid redirect loops if this is mounted on /support
 */
export default function Support() {
    return <SupportChat />;
}
