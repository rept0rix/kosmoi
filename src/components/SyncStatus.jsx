import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import {
    getSyncStatus,
    downloadAllProviders,
    syncUpdates,
    onSyncStatusChange,
    hasLocalData
} from '@/services/syncService';

export default function SyncStatus() {
    const [status, setStatus] = useState(getSyncStatus());
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [hasData, setHasData] = useState(false);

    useEffect(() => {
        // Subscribe to sync status changes
        const unsubscribe = onSyncStatusChange(setStatus);

        // Check if we have local data
        hasLocalData().then(setHasData);

        // Listen to online/offline events
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            unsubscribe();
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleSync = async () => {
        try {
            if (hasData) {
                await syncUpdates();
            } else {
                await downloadAllProviders();
            }
            setHasData(true);
        } catch (error) {
            console.error('Sync failed:', error);
        }
    };

    const progressPercent = status.total > 0
        ? Math.round((status.progress / status.total) * 100)
        : 0;

    const formatLastSync = (timestamp) => {
        if (!timestamp) return 'Never';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    };

    // Don't show if syncing is in progress or if we have data and are online
    if (!status.isSyncing && hasData && isOnline && !status.error) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wifi className="w-4 h-4 text-green-600" />
                <span>Last sync: {formatLastSync(status.lastSyncTime)}</span>
                <Button
                    onClick={handleSync}
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                >
                    <RefreshCw className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    return (
        <Card className="p-4 mb-4">
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isOnline ? (
                            <Wifi className="w-5 h-5 text-green-600" />
                        ) : (
                            <WifiOff className="w-5 h-5 text-orange-600" />
                        )}
                        <h3 className="font-semibold">
                            {status.isSyncing ? 'Syncing Data...' :
                                !hasData ? 'Download Data for Offline Use' :
                                    !isOnline ? 'Offline Mode' :
                                        status.error ? 'Sync Error' : 'Data Synced'}
                        </h3>
                    </div>

                    {status.isSyncing && (
                        <span className="text-sm text-gray-600">
                            {status.progress} / {status.total}
                        </span>
                    )}
                </div>

                {/* Progress bar */}
                {status.isSyncing && (
                    <div className="space-y-1">
                        <Progress value={progressPercent} className="h-2" />
                        <p className="text-xs text-gray-500 text-center">
                            {progressPercent}% complete
                        </p>
                    </div>
                )}

                {/* Error message */}
                {status.error && (
                    <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-red-900">Sync Failed</p>
                            <p className="text-xs text-red-700 mt-1">{status.error}</p>
                        </div>
                    </div>
                )}

                {/* Info message for first-time users */}
                {!hasData && !status.isSyncing && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Download className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900">
                                Download data to use the app offline
                            </p>
                            <p className="text-xs text-blue-700 mt-1">
                                This will download all service providers to your device. You'll be able to browse and search even without internet.
                            </p>
                        </div>
                    </div>
                )}

                {/* Offline mode info */}
                {!isOnline && hasData && !status.isSyncing && (
                    <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <WifiOff className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-900">
                                You're offline
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                                Using cached data. Last synced: {formatLastSync(status.lastSyncTime)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                {!status.isSyncing && isOnline && (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSync}
                            className="flex-1"
                            variant={hasData ? "outline" : "default"}
                        >
                            {hasData ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Sync Now
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Data
                                </>
                            )}
                        </Button>
                    </div>
                )}

                {/* Success message */}
                {!status.isSyncing && !status.error && status.lastSyncTime && hasData && (
                    <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span>
                            {status.total} providers synced • {formatLastSync(status.lastSyncTime)}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
}
