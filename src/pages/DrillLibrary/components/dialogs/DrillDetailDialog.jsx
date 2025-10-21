import React from "react";
import { Link } from "react-router-dom";
import { Tag, Users, Video, Eye } from "lucide-react";
import { getCategoryColor, getAgeColor } from '@/utils/categoryColors';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/design-system-components";

export default function DrillDetailDialog({ drill, open, setOpen }) {
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl bg-slate-800/95 border-slate-600 backdrop-blur-sm shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100">{drill?.drillName || drill?.DrillName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getCategoryColor(drill?.category || drill?.Category)}`}>
              <Tag className="w-4 h-4 mr-2" /> {drill?.category || drill?.Category}
            </span>
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium ${getAgeColor()}`}>
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
                <Link to={`/DrillDesigner?drillId=${drill._id || drill.id}&readOnly=true`}>
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
}
