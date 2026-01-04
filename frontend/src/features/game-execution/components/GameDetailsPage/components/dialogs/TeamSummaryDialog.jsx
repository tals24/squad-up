import React, { useState, useEffect } from "react";
import { BaseDialog } from "@/shared/ui/composed";
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
    <BaseDialog
      open={open}
      onOpenChange={onOpenChange}
      title={config.title}
      titleIcon={<Icon className={config.iconColor} />}
      size="sm"
      actions={{
        cancel: {
          label: "Cancel",
          onClick: handleCancel,
          disabled: isSaving,
        },
        confirm: {
          label: "Save",
          onClick: handleSave,
          disabled: isSaving,
          loading: isSaving,
        },
      }}
    >
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
    </BaseDialog>
  );
}
