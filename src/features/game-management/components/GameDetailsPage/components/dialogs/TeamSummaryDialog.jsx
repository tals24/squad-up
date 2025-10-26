import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/primitives/dialog";
import { Button } from "@/shared/ui/primitives/button";
import { Textarea } from "@/shared/ui/primitives/textarea";
import { Shield, Zap, Target, FileText } from "lucide-react";

export default function TeamSummaryDialog({
  open,
  onOpenChange,
  summaryType,
  currentValue,
  onSave,
  isSaving = false,
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(currentValue || "");
  }, [currentValue, open]);

  const getSummaryConfig = () => {
    switch (summaryType) {
      case "defense":
        return {
          title: "Defense Summary",
          icon: Shield,
          iconColor: "text-blue-400",
          placeholder: "Describe the defensive performance...",
          label: "Defense"
        };
      case "midfield":
        return {
          title: "Midfield Summary", 
          icon: Zap,
          iconColor: "text-green-400",
          placeholder: "Describe the midfield performance...",
          label: "Midfield"
        };
      case "attack":
        return {
          title: "Attack Summary",
          icon: Target,
          iconColor: "text-red-400", 
          placeholder: "Describe the attacking performance...",
          label: "Attack"
        };
      case "general":
        return {
          title: "General Summary",
          icon: FileText,
          iconColor: "text-purple-400",
          placeholder: "Describe the overall game performance...",
          label: "General"
        };
      default:
        return {
          title: "Team Summary",
          icon: FileText,
          iconColor: "text-slate-400",
          placeholder: "Describe the team performance...",
          label: "Summary"
        };
    }
  };

  const config = getSummaryConfig();
  const Icon = config.icon;

  const handleSave = () => {
    onSave(summaryType, value);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setValue(currentValue || "");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
            {config.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">
              {config.label} Performance
            </label>
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={config.placeholder}
              className="min-h-[120px] bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
