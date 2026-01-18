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

            <div className="space-y-3">
                {DAYS.map((day) => {
                    const dayData = hours[day.key] || DEFAULT_HOURS;
                    const isClosed = dayData.is_closed;

                    return (
                        <div key={day.key} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border bg-card/50">
                            <div className="w-24 font-medium flex-shrink-0">
                                {day.label}
                            </div>

                            <div className="flex items-center gap-2 mr-auto">
                                <Switch
                                    checked={!isClosed}
                                    onCheckedChange={(checked) => handleChange(day.key, 'is_closed', !checked)}
                                />
                                <span className="text-sm text-muted-foreground w-16">
                                    {isClosed ? 'Closed' : 'Open'}
                                </span>
                            </div>

                            {!isClosed && (
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        className="w-32"
                                        value={dayData.open}
                                        onChange={(e) => handleChange(day.key, 'open', e.target.value)}
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        type="time"
                                        className="w-32"
                                        value={dayData.close}
                                        onChange={(e) => handleChange(day.key, 'close', e.target.value)}
                                    />

                                    {day.key === 'monday' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Copy Monday hours to all days"
                                            onClick={() => copyToAll('monday')}
                                            className="ml-2 text-muted-foreground hover:text-primary"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
