import React, { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Clock } from 'lucide-react';

const DAYS = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
];

const DEFAULT_HOURS = {
    open: '09:00',
    close: '17:00',
    is_closed: false
};

export function HoursEditor({ value, onChange }) {
    const hours = value || {};

    const handleChange = (day, field, val) => {
        const currentDay = hours[day] || { ...DEFAULT_HOURS };
        const newDay = { ...currentDay, [field]: val };

        onChange({
            ...hours,
            [day]: newDay
        });
    };

    const copyToAll = (fromDay) => {
        const sourceHours = hours[fromDay] || DEFAULT_HOURS;
        const newHours = {};
        DAYS.forEach(d => {
            newHours[d.key] = { ...sourceHours };
        });
        onChange(newHours);
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Weekly Schedule</h3>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                {DAYS.map((day) => {
                    const dayData = hours[day.key] || DEFAULT_HOURS;
                    const isClosed = dayData.is_closed;

                    return (
                        <div key={day.key} className="flex items-center gap-2 p-2 rounded-md border bg-card/50 text-sm">
                            <div className="w-20 font-medium shrink-0 capitalize">
                                {day.label}
                            </div>

                            <Switch
                                className="scale-75 origin-left"
                                checked={!isClosed}
                                onCheckedChange={(checked) => handleChange(day.key, 'is_closed', !checked)}
                            />

                            {!isClosed ? (
                                <div className="flex items-center gap-1 ml-auto">
                                    <Input
                                        type="time"
                                        className="w-20 h-7 text-xs px-1"
                                        value={dayData.open}
                                        onChange={(e) => handleChange(day.key, 'open', e.target.value)}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        type="time"
                                        className="w-20 h-7 text-xs px-1"
                                        value={dayData.close}
                                        onChange={(e) => handleChange(day.key, 'close', e.target.value)}
                                    />
                                    {day.key === 'monday' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 ml-1 text-muted-foreground"
                                            title="Copy Monday to all"
                                            onClick={() => copyToAll('monday')}
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted-foreground ml-auto bg-slate-100 px-2 py-0.5 rounded text-xs">Closed</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
