import React from 'react';
import SchemaMap from '@/components/admin/evolution/SchemaMap';

export default function AdminSchema() {
    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-950">
            <SchemaMap />
        </div>
    );
}
