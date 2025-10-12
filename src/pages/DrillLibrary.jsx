
import React, { useState, useEffect, useMemo } from "react";
import { useData } from "../components/DataContext";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Search,
  Plus,
  ClipboardList,
  Tag,
  Users,
  Video,
  Eye,
  Target,
  Loader2, // Keep Loader2 for the spinner
} from "lucide-react";
import { 
  Button,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Badge,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
  Label,
  Textarea,
  Checkbox 
} from "@/components/ui/design-system-components";
import { PageLayout, PageHeader, SearchFilter, DataCard, StandardButton } from "@/components/ui/design-system-components";
import { createDrill, getDrills } from "@/api/functions"; // Updated to MongoDB functions
import { User } from "@/api/entities"; // Updated import path
import ConfirmationToast from "../components/ConfirmationToast";

const AddDrillModal = ({ open, setOpen, refreshData, showConfirmation, categories, ageGroups }) => {
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
      console.log('[AddDrillModal] Received message:', event.data);
      if (!event?.data || typeof event.data !== 'object') return;
      if (event.data.type === 'DRILL_LAB_SAVE' && event.data.data && Array.isArray(event.data.data.elements)) {
        console.log('[AddDrillModal] Setting layoutDataDraft with', event.data.data.elements.length, 'elements');
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

        // In draft flow, we don't auto-open the board after save
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
                    console.log('[AddDrillModal] Opening design drill. layoutDataDraft:', layoutDataDraft);
                    const layoutParam = Array.isArray(layoutDataDraft) && layoutDataDraft.length > 0
                      ? `&layout=${encodeURIComponent(JSON.stringify(layoutDataDraft))}`
                      : '';
                    console.log('[AddDrillModal] Layout param length:', layoutParam.length);
                    const url = createPageUrl(`DrillLab?mode=create&returnTo=drillLibrary${layoutParam}`);
                    console.log('[AddDrillModal] Opening URL:', url);
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
};

const DrillDetailModal = ({ drill, open, setOpen }) => {
  if (!drill) return null;

  const displayAgeGroups = (ageGroups) => {
    if (Array.isArray(ageGroups)) {
      return ageGroups.join(', ');
    }
    return ageGroups || 'Not specified';
  };

  const getYouTubeVideoId = (url) => {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url?.match(youtubeRegex);
    return match ? match[1] : null;
  };

  // const videoId = getYouTubeVideoId(drill.VideoLink); // This variable is not directly used after the function call

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-slate-800/95 border-slate-600 backdrop-blur-sm shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">{drill?.drillName || drill?.DrillName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Tag className="w-4 h-4 mr-2" /> {drill?.category || drill?.Category}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium bg-slate-700 text-slate-300 border border-slate-600">
              <Users className="w-4 h-4 mr-2" /> {displayAgeGroups(drill?.targetAgeGroup || drill?.TargetAgeGroup)}
            </span>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h3 className="font-semibold text-slate-100 mb-3 text-lg">Description</h3>
            <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">{drill?.description || drill?.DrillDescription || drill?.Description || drill?.Instructions || drill?.Details || "No description available."}</p>
          </div>

          {(drill?.layoutData || drill?.DrillLayoutData) && (
             <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <h3 className="font-semibold text-slate-100 mb-3 text-lg">Tactic Board</h3>
                <Link to={`/drilllab?drillId=${drill._id || drill.id}&readOnly=true`}>
                    <button className="w-full bg-slate-600 hover:bg-cyan-600 text-slate-100 hover:text-white px-4 py-3 rounded-lg border border-slate-500 hover:border-cyan-500 transition-all duration-300 flex items-center justify-center gap-2 font-medium">
                        <Eye className="w-4 h-4" /> Show Tactic Board
                    </button>
                </Link>
             </div>
          )}

          {(drill?.videoLink || drill?.VideoLink) && (
             <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h3 className="font-semibold text-slate-100 mb-3 text-lg">Video</h3>
              {getYouTubeVideoId(drill.videoLink || drill.VideoLink) ? (
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(drill.videoLink || drill.VideoLink)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              ) : (
                <div
                  onClick={() => window.open(drill.videoLink || drill.VideoLink, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-4 p-4 bg-slate-600/50 rounded-lg border border-slate-500 cursor-pointer hover:bg-slate-600 hover:border-cyan-500 transition-all duration-300 group"
                >
                  <div className="bg-cyan-600 rounded-full p-3 group-hover:bg-cyan-500 transition-colors duration-300">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-100">Watch Video Guide</p>
                    <p className="text-sm text-slate-400">Click to open in new tab</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <button 
            onClick={() => setOpen(false)} 
            className="bg-slate-600 hover:bg-cyan-600 text-slate-100 hover:text-white px-6 py-2 rounded-lg border border-slate-500 hover:border-cyan-500 transition-all duration-300 font-medium"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function DrillLibrary() {
  const { drills, users, isLoading: isDataLoading, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState("all");
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationConfig, setConfirmationConfig] = useState({});

  const exactCategories = ["Dribbling", "Shooting", "Passing", "Defense", "Goalkeeping", "Warm-up"];
  const exactAgeGroups = ["U6-U8", "U8-U10", "U10-U12", "U12-U14", "U14-U16", "U16+"];

  const getAuthorName = (authorIds) => {
    if (!authorIds || !Array.isArray(authorIds) || authorIds.length === 0) {
      return 'Unknown';
    }
    const authorId = authorIds[0];
    const author = users.find(user => user.id === authorId);
    return author?.FullName || author?.Email || 'Unknown';
  };

  const filteredDrills = useMemo(() => {
    return drills.filter(drill => {
      const drillName = (drill.drillName || drill.DrillName || '').toLowerCase();
      const nameMatch = drillName.includes(searchTerm.toLowerCase());

      const category = drill.category || drill.Category;
      const categoryMatch = categoryFilter === 'all' || category === categoryFilter;

      const ageGroups = drill.targetAgeGroup || drill.TargetAgeGroup;
      const ageGroupMatch = ageGroupFilter === 'all' || (() => {
        if (Array.isArray(ageGroups)) {
          return ageGroups.includes(ageGroupFilter);
        }
        return ageGroups === ageGroupFilter;
      })();

      return nameMatch && categoryMatch && ageGroupMatch;
    });
  }, [drills, searchTerm, categoryFilter, ageGroupFilter]);

  const handleDrillClick = (drill) => {
    console.log('[DrillLibrary] Opening drill detail:', drill);
    console.log('[DrillLibrary] Drill layoutData:', drill?.layoutData);
    console.log('[DrillLibrary] Drill DrillLayoutData:', drill?.DrillLayoutData);
    setSelectedDrill(drill);
    setIsDetailModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const displayAgeGroups = (ageGroups) => {
    if (Array.isArray(ageGroups)) {
      return ageGroups.join(', ');
    }
    return ageGroups || 'Not specified';
  };

  const showConfirmationMessage = (config) => {
    console.log("Showing confirmation:", config);
    setConfirmationConfig(config);
    setShowConfirmation(true);
  };

  if (isDataLoading) {
    return (
      <div className="p-6 md:p-8 bg-bg-primary min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-bg-secondary rounded w-1/3"></div>
            <div className="h-16 bg-bg-secondary rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-48 bg-bg-secondary rounded-xl"></div>)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageLayout>
        {/* Header */}
        <PageHeader
          title="Drill"
          accentWord="Library"
          subtitle="Browse and manage training drills"
          actionButton={
            <StandardButton 
              onClick={handleOpenAddModal}
              variant="primary"
              icon={<Plus className="w-5 h-5" />}
            >
              Add Drill
            </StandardButton>
          }
        />

          {/* Filters */}
          <SearchFilter
            searchValue={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search drills by name..."
            filters={[
              {
                value: categoryFilter,
                onChange: setCategoryFilter,
                placeholder: "All Categories",
                options: [
                  { value: "all", label: "All Categories" },
                  ...exactCategories.map(cat => ({ value: cat, label: cat }))
                ]
              },
              {
                value: ageGroupFilter,
                onChange: setAgeGroupFilter,
                placeholder: "All Age Groups",
                options: [
                  { value: "all", label: "All Age Groups" },
                  ...exactAgeGroups.map(age => ({ value: age, label: age }))
                ]
              }
            ]}
          />

          {/* Drills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDrills.length > 0 ? (
              filteredDrills.map((drill) => (
                <div
                  key={drill._id || drill.id}
                  className="bg-slate-800/70 border-slate-700 rounded-xl border hover:bg-slate-800/90 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition-all duration-300 group cursor-pointer overflow-hidden flex flex-col"
                  onClick={() => handleDrillClick(drill)}
                >
                  <div className="p-6 flex-grow">
                    <h3 className="text-lg font-bold text-slate-100 truncate mb-2 group-hover:text-cyan-400 transition-colors">
                      {drill.drillName || drill.DrillName}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden">
                      {drill.description || drill.DrillDescription || drill.Description || drill.Instructions || drill.Details || "No description available."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Tag className="w-3 h-3 mr-1" /> {drill.category || drill.Category}
                      </span>
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-slate-700 text-slate-300 border border-slate-600">
                        <Users className="w-3 h-3 mr-1" /> {displayAgeGroups(drill.targetAgeGroup || drill.TargetAgeGroup)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 border-t border-slate-700">
                    <button 
                      className="w-full bg-slate-700 hover:bg-cyan-600 text-slate-100 hover:text-white px-4 py-2 rounded-lg border border-slate-600 hover:border-cyan-500 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDrillClick(drill);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full">
                <div className="bg-slate-800/70 border-slate-700 rounded-xl border shadow-2xl">
                  <div className="p-12 text-center">
                    <ClipboardList className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-slate-100 mb-2">No Drills Found</h3>
                    <p className="text-slate-400">Try adjusting your filters or add a new drill.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
      </PageLayout>

      <AddDrillModal
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        refreshData={refreshData}
        showConfirmation={showConfirmationMessage}
        categories={exactCategories}
        ageGroups={exactAgeGroups}
      />

      <DrillDetailModal drill={selectedDrill} open={isDetailModalOpen} setOpen={setIsDetailModalOpen} />

      <ConfirmationToast
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title={confirmationConfig.title}
        message={confirmationConfig.message}
        type={confirmationConfig.type}
      />
    </>
  );
}
