import React, { useState, useEffect } from "react";
import { useData } from "@/app/providers/DataProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ClipboardList, Target } from "lucide-react";
import { 
  Button,
  Input,
  Label,
  Textarea,
  Checkbox,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue
} from "@/shared/ui/primitives/design-system-components";
import { createDrill, getDrills } from "@/api/functions";
import { User } from "@/api/entities";

export default function AddDrillDialog({ open, setOpen, refreshData, showConfirmation, categories, ageGroups }) {
  const { users } = useData();
  const [formData, setFormData] = useState({
    DrillName: "",
    Category: "",
    TargetAgeGroup: [],
    Description: "",
    VideoLink: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [layoutDataDraft, setLayoutDataDraft] = useState(null);

  const navigate = useNavigate();

  const exactCategories = categories || ["Dribbling", "Shooting", "Passing", "Defense", "Goalkeeping", "Warm-up"];
  const exactAgeGroups = ageGroups || ["U6-U8", "U8-U10", "U10-U12", "U12-U14", "U14-U16", "U16+"];

  useEffect(() => {
    if (open) {
      setFormData({
        DrillName: "",
        Category: "",
        TargetAgeGroup: [],
        Description: "",
        VideoLink: ""
      });
      setLayoutDataDraft(null);
      testAvailableFields();
    }
  }, [open]);

  useEffect(() => {
    const handleMessage = (event) => {
      console.log('[AddDrillDialog] Received message:', event.data);
      if (!event?.data || typeof event.data !== 'object') return;
      if (event.data.type === 'DRILL_LAB_SAVE' && event.data.data && Array.isArray(event.data.data.elements)) {
        console.log('[AddDrillDialog] Setting layoutDataDraft with', event.data.data.elements.length, 'elements');
        setLayoutDataDraft(event.data.data.elements);
        showConfirmation?.({
          type: 'success',
          title: 'Visual design captured',
          message: 'The diagram has been added to this drill form.'
        });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const testAvailableFields = async () => {
    try {
      const response = await getDrills();
      if (response.data?.records && response.data.records.length > 0) {
        const firstRecord = response.data.records[0];
        const fields = Object.keys(firstRecord).filter(key => !['id', 'createdTime'].includes(key));
        setAvailableFields(fields);
        console.log("Available fields in Drills table:", fields);
      } else {
        setAvailableFields(['DrillName', 'Category', 'TargetAgeGroup', 'Description', 'DrillDescription', 'VideoLink', 'Author']);
      }
    } catch (error) {
      console.error("Error testing fields:", error);
      setAvailableFields(['DrillName', 'Category', 'TargetAgeGroup', 'Description', 'DrillDescription', 'VideoLink', 'Author']);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateBasicInfo = () => {
    if (!formData.DrillName.trim()) {
      showConfirmation({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter a drill name.'
      });
      return false;
    }
    if (!formData.Category) {
      showConfirmation({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select a category.'
      });
      return false;
    }
    if (formData.TargetAgeGroup.length === 0) {
      showConfirmation({
        type: 'error',
        title: 'Missing Information',
        message: 'Please select at least one target age group.'
      });
      return false;
    }
    return true;
  };

  const handleCreateDrill = async (openTacticBoard) => {
    if (!validateBasicInfo()) {
      return;
    }

    setIsSaving(true);
    try {
      const currentUser = await User.me();
      const authorUserRecord = users.find(u =>
        u.Email && u.Email.toLowerCase() === currentUser.email.toLowerCase()
      );

      let descriptionFieldName = 'Description';
      if (availableFields.includes('Description')) {
        descriptionFieldName = 'Description';
      } else if (availableFields.includes('DrillDescription')) {
        descriptionFieldName = 'DrillDescription';
      } else if (availableFields.includes('Instructions')) {
        descriptionFieldName = 'Instructions';
      } else if (availableFields.includes('Details')) {
        descriptionFieldName = 'Details';
      }

      // Map frontend field names to backend field names
      const drillData = {
        drillName: formData.DrillName,
        category: formData.Category,
        targetAgeGroup: formData.TargetAgeGroup,
        videoLink: formData.VideoLink || null,
        author: authorUserRecord?._id
      };

      drillData.description = formData.Description || '';
      if (layoutDataDraft && Array.isArray(layoutDataDraft)) {
        drillData.layoutData = layoutDataDraft;
      }

      console.log(`Creating drill for ${openTacticBoard ? 'tactic board' : 'library'}:`, drillData);

      const response = await createDrill(drillData);

      if (response.data?.success && response.data.data?._id) {
        showConfirmation({
          type: 'success',
          title: openTacticBoard ? 'Drill Created! 🎯' : 'Drill Created Successfully! 🎯',
          message: openTacticBoard ? 'Now opening the tactic board to design your drill...' : `"${formData.DrillName}" has been added to your drill library.`
        });
        refreshData();
        setOpen(false);
      } else {
        throw new Error(response.data?.error || "Failed to create drill");
      }
    } catch (error) {
      console.error("Error adding/creating drill:", error);
      showConfirmation({
        type: 'error',
        title: 'Failed to Add Drill',
        message: `There was an issue: ${error.message}. Please check your connection and try again.`
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-slate-800/95 border-slate-600 backdrop-blur-sm shadow-2xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-cyan-600/20 rounded-lg border border-cyan-500/30">
              <ClipboardList className="w-6 h-6 text-cyan-400" />
            </div>
            Add New Drill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleCreateDrill(false); }} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="drillName" className="font-medium text-slate-100">Drill Name *</Label>
              <Input
                id="drillName"
                value={formData.DrillName}
                onChange={(e) => handleChange('DrillName', e.target.value)}
                required
                placeholder="Enter drill name"
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoLink" className="font-medium text-slate-100">Video Link</Label>
              <Input
                id="videoLink"
                type="url"
                value={formData.VideoLink}
                onChange={(e) => handleChange('VideoLink', e.target.value)}
                placeholder="Enter video URL (optional)"
                className="bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="font-medium text-slate-100">Category *</Label>
            <Select value={formData.Category} onValueChange={(value) => handleChange('Category', value)}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-100 focus:border-cyan-500 focus:ring-cyan-500/20">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600 text-slate-100">
                {exactCategories.map(category => (
                  <SelectItem key={category} value={category} className="text-slate-100 hover:bg-slate-700 focus:bg-slate-700">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-100">Target Age Group *</Label>
            <div className="p-4 border border-slate-600 rounded-md max-h-40 overflow-y-auto bg-slate-700/30">
              <div className="grid grid-cols-2 gap-4">
                {exactAgeGroups.map(age => (
                  <div key={age} className="flex items-center gap-2">
                    <Checkbox
                      id={`age-${age}`}
                      checked={formData.TargetAgeGroup.includes(age)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleChange('TargetAgeGroup', [...formData.TargetAgeGroup, age]);
                        } else {
                          handleChange('TargetAgeGroup', formData.TargetAgeGroup.filter(item => item !== age));
                        }
                      }}
                      className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-500"
                    />
                    <Label htmlFor={`age-${age}`} className="font-normal text-slate-100 cursor-pointer">{age}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-slate-100">Visual Design</Label>
            <div className="p-4 border border-slate-600 rounded-lg bg-slate-700/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">
                    Create a visual representation of your drill on the tactic board
                  </p>
                  <p className="text-xs text-cyan-400 mt-1">
                    Note: This will save your drill and open the design board
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    console.log('[AddDrillDialog] Opening design drill. layoutDataDraft:', layoutDataDraft);
                    const layoutParam = Array.isArray(layoutDataDraft) && layoutDataDraft.length > 0
                      ? `&layout=${encodeURIComponent(JSON.stringify(layoutDataDraft))}`
                      : '';
                    console.log('[AddDrillDialog] Layout param length:', layoutParam.length);
                    const url = createPageUrl(`DrillDesigner?mode=create&returnTo=drillLibrary${layoutParam}`);
                    console.log('[AddDrillDialog] Opening URL:', url);
                    const win = window.open(url, '_blank');
                    if (!win) {
                      showConfirmation?.({ type: 'error', title: 'Popup blocked', message: 'Allow popups to design the drill.' });
                    }
                  }}
                  disabled={isSaving || !formData.DrillName || !formData.Category || formData.TargetAgeGroup.length === 0}
                  variant="default"
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-600 disabled:text-slate-400"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Design Drill
                </Button>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {Array.isArray(layoutDataDraft) && layoutDataDraft.length > 0 ? 'Visual design attached to this drill.' : 'No visual design attached yet.'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium text-slate-100">Description</Label>
            <Textarea
              id="description"
              value={formData.Description}
              onChange={(e) => handleChange('Description', e.target.value)}
              className="h-32 bg-slate-700/50 border-slate-600 text-slate-100 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-cyan-500/20"
              placeholder="Enter drill description and instructions (optional for visual drills)"
            />
          </div>

          <DialogFooter className="gap-3 pt-6 border-t border-slate-700">
            <DialogClose asChild>
              <Button 
                type="button" 
                variant="outline" 
                className="bg-slate-700 border-slate-500 text-slate-200 hover:bg-slate-600 hover:text-slate-100 hover:border-slate-400 px-6 py-2 font-medium"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !formData.DrillName || !formData.Category || formData.TargetAgeGroup.length === 0}
              className="bg-cyan-600 hover:bg-cyan-700 text-white disabled:bg-slate-600 disabled:text-slate-400 px-6 py-2 font-medium"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : "Save Drill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
