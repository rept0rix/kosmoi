import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, ArrowRight, Calendar } from "lucide-react";
import TaskBoard from "@/components/dashboard/TaskBoard";
import { supabase } from "@/api/supabaseClient";
import KosmoiLoader from "@/components/ui/KosmoiLoader";

const RoadmapItem = ({ title, status, date, description }) => (
  <div className="flex gap-4 mb-8 relative">
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center z-10 
                ${
                  status === "completed"
                    ? "bg-green-100 text-green-600"
                    : status === "in-progress"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-400"
                }`}
      >
        {status === "completed" ? (
          <CheckCircle className="w-5 h-5" />
        ) : status === "in-progress" ? (
          <ArrowRight className="w-5 h-5" />
        ) : (
          <Circle className="w-5 h-5" />
        )}
      </div>
      <div className="w-0.5 h-full bg-gray-200 absolute top-8 bottom-[-2rem] last:hidden"></div>
    </div>
    <div className="flex-1 pb-2">
      <Card
        className={`${status === "in-progress" ? "border-blue-200 shadow-md ring-1 ring-blue-100" : "border-gray-200"}`}
      >
        <CardHeader className="py-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">
                {title}
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {date || "TBD"}
              </CardDescription>
            </div>
            <Badge
              variant={
                status === "completed"
                  ? "default"
                  : status === "in-progress"
                    ? "secondary"
                    : "outline"
              }
            >
              {status === "completed"
                ? "Done"
                : status === "in-progress"
                  ? "Active"
                  : "Planned"}
            </Badge>
          </div>
        </CardHeader>
        {description && (
          <CardContent className="py-2 pt-0 text-sm text-gray-600">
            {description}
          </CardContent>
        )}
      </Card>
    </div>
  </div>
);

export default function AdminRoadmap() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching roadmap:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Project Roadmap & Dev Log
          </h1>
          <p className="text-gray-500 mt-2">
            Tracking our journey from Zero to IPO (Realtime Phase Tracking).
          </p>
        </div>
        <div className="text-right">
          <Badge variant="outline" className="text-xs px-3 py-1 bg-slate-100">
            Project Started: Dec 2024
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Roadmap Column */}
        <div className="lg:col-span-2 space-y-2">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-purple-500" />
            Milestones
          </h2>

          {loading ? (
            <div className="py-10 flex justify-center">
              <KosmoiLoader />
            </div>
          ) : (
            <div className="relative">
              {items.length === 0 ? (
                <div className="text-slate-500 italic">
                  No milestones defined yet.
                </div>
              ) : (
                items.map((item) => (
                  <RoadmapItem
                    key={item.id}
                    title={item.title}
                    status={item.status}
                    date={item.date_range}
                    description={item.description}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Live Task Board Column */}
        <div className="space-y-6">
          <TaskBoard />
        </div>
      </div>
    </div>
  );
}
