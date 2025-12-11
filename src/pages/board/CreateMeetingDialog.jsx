import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function CreateMeetingDialog({
    open,
    onOpenChange,
    title,
    setTitle,
    onConfirm,
    isRTL
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isRTL ? 'צור חדר ישיבות חדש' : 'Create New Board Room'}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        placeholder={isRTL ? "שם הפגישה..." : "Meeting title..."}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && onConfirm()}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {isRTL ? 'ביטול' : 'Cancel'}
                    </Button>
                    <Button onClick={onConfirm}>
                        {isRTL ? 'צור' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
