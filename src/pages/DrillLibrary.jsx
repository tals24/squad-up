
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
import { airtableSync } from "@/api/functions"; // Updated import path
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
      testAvailableFields();
    }
  }, [open]);

  const testAvailableFields = async () => {
    try {
      const response = await airtableSync({ action: 'fetch', tableName: 'Drills' });
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

      let recordData = {
        DrillName: formData.DrillName,
        Category: formData.Category,
        TargetAgeGroup: formData.TargetAgeGroup,
        VideoLink: formData.VideoLink || undefined,
        Author: authorUserRecord ? [authorUserRecord.id] : undefined
      };

      if (openTacticBoard) {
        recordData[descriptionFieldName] = formData.Description || `Visual drill design for ${formData.DrillName}`;
      } else {
        recordData[descriptionFieldName] = formData.Description;
      }

      console.log(`Creating drill for ${openTacticBoard ? 'tactic board' : 'library'}:`, recordData);

      const response = await airtableSync({
        action: 'create',
        tableName: 'Drills',
        recordData: recordData
      });

      if (response.data?.success && response.data.record?.id) {
        showConfirmation({
          type: 'success',
          title: openTacticBoard ? 'Drill Created! 🎯' : 'Drill Created Successfully! 🎯',
          message: openTacticBoard ? 'Now opening the tactic board to design your drill...' : `"${formData.DrillName}" has been added to your drill library.`
        });
        refreshData();
        setOpen(false);

        if (openTacticBoard) {
          const drillId = response.data.record.id;
          setTimeout(() => {
            navigate(createPageUrl(`DrillLab?drillId=${drillId}&returnTo=drillLibrary`));
          }, 1000);
        }
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
      <DialogContent className="sm:max-w-2xl bg-bg-secondary border-border-custom">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-accent-primary" />
            Add New Drill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleCreateDrill(false); }} className="space-y-6 pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="drillName" className="font-medium text-text-primary">Drill Name *</Label>
              <Input
                id="drillName"
                value={formData.DrillName}
                onChange={(e) => handleChange('DrillName', e.target.value)}
                required
                placeholder="Enter drill name"
                className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="videoLink" className="font-medium text-text-primary">Video Link</Label>
              <Input
                id="videoLink"
                type="url"
                value={formData.VideoLink}
                onChange={(e) => handleChange('VideoLink', e.target.value)}
                placeholder="Enter video URL (optional)"
                className="bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="font-medium text-text-primary">Category *</Label>
            <Select value={formData.Category} onValueChange={(value) => handleChange('Category', value)}>
              <SelectTrigger className="bg-bg-secondary border-border-custom text-text-primary focus:border-accent-primary">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-bg-secondary border-border-custom text-text-primary">
                {exactCategories.map(category => (
                  <SelectItem key={category} value={category} className="focus:bg-bg-secondary">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-text-primary">Target Age Group *</Label>
            <div className="p-4 border border-border-custom rounded-md max-h-40 overflow-y-auto bg-bg-secondary/50">
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
                    />
                    <Label htmlFor={`age-${age}`} className="font-normal text-text-primary cursor-pointer">{age}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-medium text-text-primary">Visual Design</Label>
            <div className="p-4 border border-border-custom rounded-md bg-bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-secondary">
                    Create a visual representation of your drill on the tactic board
                  </p>
                  <p className="text-xs text-accent-primary mt-1">
                    Note: This will save your drill and open the design board
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={() => handleCreateDrill(true)}
                  disabled={isSaving || !formData.DrillName || !formData.Category || formData.TargetAgeGroup.length === 0}
                  variant="default"
                  size="sm"
                  className="bg-secondary-500 hover:bg-secondary-600 text-white"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Design Drill
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium text-text-primary">Description</Label>
            <Textarea
              id="description"
              value={formData.Description}
              onChange={(e) => handleChange('Description', e.target.value)}
              className="h-32 bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary focus:border-accent-primary"
              placeholder="Enter drill description and instructions (optional for visual drills)"
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-border-custom text-text-primary hover:bg-bg-secondary">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSaving || !formData.DrillName || !formData.Category || formData.TargetAgeGroup.length === 0}
              className="bg-secondary-500 hover:bg-secondary-600 text-white"
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
      <DialogContent className="sm:max-w-2xl bg-bg-secondary border-border-custom">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-text-primary">{drill?.DrillName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-bg-secondary text-text-primary">
              <Tag className="w-3 h-3 mr-1" /> {drill?.Category}
            </Badge>
            <Badge variant="secondary" className="bg-bg-secondary text-text-primary">
              <Users className="w-3 h-3 mr-1" /> {displayAgeGroups(drill?.TargetAgeGroup)}
            </Badge>
          </div>
          <div>
            <h3 className="font-semibold text-text-primary mb-2">Description</h3>
            <p className="text-text-primary whitespace-pre-wrap break-all">{drill?.DrillDescription || drill?.Description || drill?.Instructions || drill?.Details}</p>
          </div>

          {drill?.DrillLayoutData && (
             <div>
                <h3 className="font-semibold text-text-primary mb-2">Tactic Board</h3>
                <Link to={createPageUrl(`DrillLab?drillId=${drill.id}&readOnly=true`)}>
                    <Button variant="outline" className="w-full border-border-custom text-text-primary hover:bg-bg-secondary">
                        <Eye className="w-4 h-4 mr-2" /> Show Tactic Board
                    </Button>
                </Link>
             </div>
          )}

          {drill?.VideoLink && (
             <div>
              <h3 className="font-semibold text-text-primary mb-2">Video</h3>
              {getYouTubeVideoId(drill.VideoLink) ? (
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(drill.VideoLink)}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              ) : (
                <div
                  onClick={() => window.open(drill.VideoLink, '_blank', 'noopener,noreferrer')}
                  className="flex items-center gap-3 p-4 bg-bg-secondary rounded-lg border border-border-custom cursor-pointer hover:shadow-md transition-all duration-300 group"
                >
                  <div className="bg-accent-primary rounded-full p-3 group-hover:bg-cyan-400 transition-colors duration-300">
                    <Video className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">Watch Video Guide</p>
                    <p className="text-sm text-text-secondary">Click to open in new tab</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="bg-accent-primary hover:bg-cyan-400 text-slate-900">Close</Button>
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
      const nameMatch = drill.DrillName?.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatch = categoryFilter === 'all' || drill.Category === categoryFilter;

      const ageGroupMatch = ageGroupFilter === 'all' || (() => {
        if (Array.isArray(drill.TargetAgeGroup)) {
          return drill.TargetAgeGroup.includes(ageGroupFilter);
        }
        return drill.TargetAgeGroup === ageGroupFilter;
      })();

      return nameMatch && categoryMatch && ageGroupMatch;
    });
  }, [drills, searchTerm, categoryFilter, ageGroupFilter]);

  const handleDrillClick = (drill) => {
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
                <DataCard
                  key={drill.id}
                  className="hover:shadow-cyan-500/30 hover:border-cyan-500/50 cursor-pointer group overflow-hidden flex flex-col"
                  hover={true}
                >
                  <div className="p-6 flex-grow">
                    <h3 className="text-lg font-bold text-white truncate mb-2">
                      {drill.DrillName}
                    </h3>
                    <p className="text-slate-400 text-sm mb-4 h-10 overflow-hidden">
                      {drill.DrillDescription || drill.Description || drill.Instructions || drill.Details || "No description available."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="bg-slate-700 text-white">
                        <Tag className="w-3 h-3 mr-1" /> {drill.Category}
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-700 text-white">
                        <Users className="w-3 h-3 mr-1" /> {displayAgeGroups(drill.TargetAgeGroup)}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6 border-t border-slate-700">
                    <StandardButton 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => handleDrillClick(drill)}
                      icon={<Eye className="w-4 h-4" />}
                    >
                      View Details
                    </StandardButton>
                  </div>
                </DataCard>
              ))
            ) : (
              <div className="col-span-full">
                <DataCard>
                  <div className="p-12 text-center">
                    <ClipboardList className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Drills Found</h3>
                    <p className="text-slate-400">Try adjusting your filters or add a new drill.</p>
                  </div>
                </DataCard>
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
