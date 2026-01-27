import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Target, Save, Loader2, Radar, Search, UserPlus } from "lucide-react";
import { supabase } from "@/api/supabaseClient";

export function SalesScoutConfig({ provider }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Simulation State
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    if (provider?.id) fetchConfig();
  }, [provider]);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase
        .from("agent_configurations")
        .select("*")
        .eq("provider_id", provider.id)
        .eq("agent_type", "sales_scout")
        .single();

      if (data) {
        setConfig(data);
      } else {
        // Initialize default state
        setConfig({
          provider_id: provider.id,
          agent_type: "sales_scout",
          is_active: false,
          target_niche: "",
          outreach_tone: "consultative",
          monthly_budget: 0,
          custom_instructions: "", // reused field for specific targeting rules
        });
      }
    } catch (err) {
      console.error("Error fetching sales config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("agent_configurations")
        .upsert(config, { onConflict: "provider_id, agent_type" });

      if (error) throw error;

      toast({
        title: "Scout Settings Saved",
        description: "AI Sales Scout configuration updated.",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateScout = async () => {
    if (!config.target_niche) {
      toast({
        variant: "destructive",
        title: "Missing Target",
        description: "Please define a Target Niche first.",
      });
      return;
    }

    setSimulating(true);
    setSimulationResult(null);

    // Fake AI processing delay
    setTimeout(() => {
      setSimulating(false);
      setSimulationResult({
        leadsFound: Math.floor(Math.random() * 5) + 1,
        topLead: `Potential client in "${config.target_niche}" nearby.`,
        action: "Drafted introduction email.",
      });
    }, 2000);
  };

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );
  if (!config) return null;

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-emerald-400" />
                Sales Scout Unit
              </CardTitle>
              <CardDescription className="text-slate-400">
                Autonomous agent that finds and engages potential leads.
              </CardDescription>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={(checked) =>
                setConfig({ ...config, is_active: checked })
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Niche */}
          <div className="space-y-3">
            <Label className="text-slate-200">Target Niche / Keywords</Label>
            <div className="relative">
              <Target className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="e.g. 'Luxury Villas', 'Coworking Spaces', 'Yacht Owners'"
                className="pl-9 bg-slate-800 border-slate-700 text-slate-200"
                value={config.target_niche || ""}
                onChange={(e) =>
                  setConfig({ ...config, target_niche: e.target.value })
                }
                disabled={!config.is_active}
              />
            </div>
            <p className="text-xs text-slate-500">
              The agent will scan for these businesses on the island.
            </p>
          </div>

          {/* Outreach Tone */}
          <div className="space-y-3">
            <Label className="text-slate-200">Outreach Strategy</Label>
            <Select
              value={config.outreach_tone}
              onValueChange={(val) =>
                setConfig({ ...config, outreach_tone: val })
              }
              disabled={!config.is_active}
            >
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Select strategy" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="consultative">
                  🤝 Consultative (Value First)
                </SelectItem>
                <SelectItem value="direct">
                  ⚡ Direct Offer (Promo Focused)
                </SelectItem>
                <SelectItem value="networker">
                  🕸️ Networker (Introduction Only)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Budget / Capacity (Mock for now) */}
          <div className="space-y-3">
            <Label className="text-slate-200">Max Leads Per Day</Label>
            <Select disabled={!config.is_active} defaultValue="5">
              <SelectTrigger className="w-full bg-slate-800 border-slate-700 text-slate-200">
                <SelectValue placeholder="Select limit" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                <SelectItem value="5">🌱 Starter (5 Leads/Day)</SelectItem>
                <SelectItem value="20">🚀 Scale (20 Leads/Day)</SelectItem>
                <SelectItem value="100">🔥 Dominate (Unlimited)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Simulation Zone */}
      {config.is_active && (
        <Card className="border-emerald-900/50 bg-emerald-950/10 border-dashed">
          <CardHeader>
            <CardTitle className="text-emerald-400 text-base flex items-center gap-2">
              <Search className="w-4 h-4" /> Live Scout Operations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Manually trigger a scout run to find potential leads now.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-700 text-emerald-400 hover:bg-emerald-900"
                onClick={handleSimulateScout}
                disabled={simulating}
              >
                {simulating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Find Leads
              </Button>
            </div>

            {simulationResult && (
              <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-800">
                <div className="text-xs text-emerald-400 mb-1 font-bold">
                  RESULT REPORT
                </div>
                <p className="text-slate-200 text-sm">
                  Found{" "}
                  <span className="font-bold text-white">
                    {simulationResult.leadsFound}
                  </span>{" "}
                  new leads matching "{config.target_niche}".
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Next Action: {simulationResult.action}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
