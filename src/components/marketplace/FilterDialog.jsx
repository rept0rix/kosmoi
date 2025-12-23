import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw } from 'lucide-react';

export function FilterDialog({ open, onOpenChange, filters, onApplyFilters }) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        onApplyFilters(localFilters);
        onOpenChange(false);
    };

    const handleReset = () => {
        const reset = { minPrice: '', maxPrice: '', location: '', sort: 'newest' };
        setLocalFilters(reset);
        onApplyFilters(reset);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Filter & Sort</DialogTitle>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    {/* Sort */}
                    <div className="grid gap-2">
                        <Label>Sort By</Label>
                        <Select
                            value={localFilters.sort}
                            onValueChange={(val) => setLocalFilters({ ...localFilters, sort: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Sort order" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Price Range */}
                    <div className="grid gap-2">
                        <Label>Price Range (THB)</Label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={localFilters.minPrice}
                                onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                            />
                            <span>-</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={localFilters.maxPrice}
                                onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="grid gap-2">
                        <Label>Location</Label>
                        <Select
                            value={localFilters.location}
                            onValueChange={(val) => setLocalFilters({ ...localFilters, location: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Any Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Any Location</SelectItem>
                                <SelectItem value="Chaweng">Chaweng</SelectItem>
                                <SelectItem value="Lamai">Lamai</SelectItem>
                                <SelectItem value="Bophut">Bophut</SelectItem>
                                <SelectItem value="Maenam">Maenam</SelectItem>
                                <SelectItem value="Fisherman Village">Fisherman Village</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="ghost" onClick={handleReset} className="text-gray-500">
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </Button>
                    <Button onClick={handleApply} className="bg-indigo-600 hover:bg-indigo-700">
                        Apply Filters
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
