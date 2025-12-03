import React from 'react';
import { LanguageProvider } from './LanguageContext';

export default function AppWrapper({ children }) {
  return (
    <LanguageProvider>
      {children}
    </LanguageProvider>
  );
}