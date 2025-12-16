import React from 'react';
import MemoryInspector from '@/components/admin/evolution/MemoryInspector';

export default function AdminMemory() {
    return (
        <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-slate-950">
            <MemoryInspector />
        </div>
    );
}
