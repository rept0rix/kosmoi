import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Trophy,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { OrganizerService } from "@/features/organizer/services/OrganizerService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner";

export default function GoalsTab() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const data = await OrganizerService.getGoals();
      setGoals(data || []);
    } catch (error) {
      console.error("Failed to load goals", error);
      toast.error("Failed to sync goals");
    } finally {
      setLoading(false);
    }
  };

  const toggleGoal = async (id, currentStatus) => {
    // Optimistic update
    const previousGoals = [...goals];
    setGoals(
      goals.map((g) => (g.id === id ? { ...g, completed: !currentStatus } : g)),
    );

    try {
      await OrganizerService.updateGoal(id, { completed: !currentStatus });
    } catch (error) {
      // Revert on failure
      setGoals(previousGoals);
      toast.error("Failed to update goal");
    }
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!newGoal.trim() || !user) return;

    // Optimistic update
    const tempGoal = {
      id: "temp-" + Date.now(),
      text: newGoal,
      completed: false,
      category: "Personal",
      user_id: user.id,
    };

    setGoals([tempGoal, ...goals]);
    setNewGoal("");

    try {
      const created = await OrganizerService.createGoal({
        text: newGoal,
        category: "Personal",
        user_id: user.id,
      });
      // Replace temp with real
      setGoals((prev) => [
        created[0],
        ...prev.filter((g) => g.id !== tempGoal.id),
      ]);
      toast.success("Goal added!");
    } catch (error) {
      setGoals(goals); // Revert
      toast.error("Failed to create goal");
      console.error(error);
    }
  };

  const removeGoal = async (id) => {
    const previousGoals = [...goals];
    setGoals(goals.filter((g) => g.id !== id));

    try {
      await OrganizerService.deleteGoal(id);
      toast.success("Goal deleted");
    } catch (error) {
      setGoals(previousGoals);
      toast.error("Failed to delete goal");
    }
  };

  const completedCount = goals.filter((g) => g.completed).length;
  const progress =
    goals.length === 0 ? 0 : (completedCount / goals.length) * 100;

  if (loading && goals.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-900 border-white/5">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Samui Bucket List
            </CardTitle>
            <Badge variant="secondary" className="bg-white/50 backdrop-blur-sm">
              {completedCount}/{goals.length} Completed
            </Badge>
          </div>
          <CardDescription>track your island adventures</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress
            value={progress}
            className="h-2 bg-white/50"
            indicatorClassName="bg-gradient-to-r from-blue-500 to-indigo-500"
          />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <form onSubmit={addGoal} className="flex gap-2">
          <Input
            placeholder="Add a new goal..."
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            className="bg-white dark:bg-slate-950"
          />
          <Button type="submit" size="icon" disabled={!newGoal.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </form>

        <div className="space-y-2">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                goal.completed
                  ? "bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                  : "bg-white border-slate-100 hover:border-blue-200 dark:bg-slate-950 dark:border-slate-800"
              }`}
            >
              <button
                onClick={() => toggleGoal(goal.id, goal.completed)}
                className="flex-shrink-0"
              >
                {goal.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-blue-500" />
                )}
              </button>

              <span
                className={`flex-1 text-sm font-medium ${
                  goal.completed
                    ? "text-slate-500 line-through decoration-slate-400"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {goal.text}
              </span>

              <Badge
                variant="outline"
                className="text-[10px] text-slate-400 font-normal"
              >
                {goal.category}
              </Badge>

              <button
                onClick={() => removeGoal(goal.id)}
                className="text-slate-300 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {goals.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No goals yet. Add one to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
