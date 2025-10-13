import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Users, Eye, Play, Clock, Users2, Wrench, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCategoryColor, getAgeColor } from '@/utils/categoryColors';

const DrillDetailModal = ({ drill, open, setOpen, source = 'library' }) => {
  if (!drill) return null;

  // Debug logging for source parameter
  console.log('🔍 DrillDetailModal source:', source);
  console.log('🔍 DrillDetailModal drill:', drill?.drillName || drill?.DrillName);

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

  const videoId = getYouTubeVideoId(drill?.videoLink || drill?.VideoLink);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-3xl bg-slate-800/95 border-slate-600 backdrop-blur-sm shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            {drill?.drillName || drill?.DrillName}
            <div className="flex gap-2">
              {(drill?.category || drill?.Category) && (
                <Badge variant="outline" className={`text-xs ${getCategoryColor(drill?.category || drill?.Category)}`}>
                  <Tag className="w-3 h-3 mr-1" />
                  {drill?.category || drill?.Category}
                </Badge>
              )}
              {(drill?.targetAgeGroup || drill?.TargetAgeGroup) && (
                <Badge variant="outline" className={`text-xs ${getAgeColor()}`}>
                  <Users className="w-3 h-3 mr-1" />
                  {displayAgeGroups(drill?.targetAgeGroup || drill?.TargetAgeGroup)}
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Drill Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {drill?.duration && (
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Duration</span>
                </div>
                <p className="text-slate-100 font-semibold mt-1">{drill.duration} minutes</p>
              </div>
            )}
            
            {drill?.playersRequired && (
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Players</span>
                </div>
                <p className="text-slate-100 font-semibold mt-1">{drill.playersRequired} players</p>
              </div>
            )}
            
            {drill?.equipment && drill.equipment.length > 0 && (
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <div className="flex items-center gap-2 text-slate-300">
                  <Wrench className="w-4 h-4" />
                  <span className="text-sm font-medium">Equipment</span>
                </div>
                <p className="text-slate-100 font-semibold mt-1">{drill.equipment.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <h3 className="font-semibold text-slate-100 mb-3 text-lg">Description</h3>
            <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
              {drill?.description || drill?.DrillDescription || drill?.Description || drill?.instructions || drill?.Instructions || drill?.details || drill?.Details || "No description available."}
            </p>
          </div>

          {/* Instructions */}
          {(drill?.instructions || drill?.Instructions) && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h3 className="font-semibold text-slate-100 mb-3 text-lg">Instructions</h3>
              <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                {drill?.instructions || drill?.Instructions}
              </p>
            </div>
          )}

          {/* Additional Details */}
          {(drill?.details || drill?.Details) && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h3 className="font-semibold text-slate-100 mb-3 text-lg">Additional Details</h3>
              <p className="text-slate-200 whitespace-pre-wrap break-words leading-relaxed">
                {drill?.details || drill?.Details}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Visual Board Link */}
            {(drill?.layoutData || drill?.DrillLayoutData) && (
              <Link to={`/drilllab?drillId=${drill._id || drill.id}&readOnly=true&from=${source}`} className="flex-1">
                <Button className="w-full bg-slate-600 hover:bg-cyan-600 text-slate-100 hover:text-white px-4 py-3 rounded-lg border border-slate-500 hover:border-cyan-500 transition-all duration-300 flex items-center justify-center gap-2 font-medium">
                  <Eye className="w-4 h-4" />
                  View Tactic Board
                </Button>
              </Link>
            )}

            {/* Video Link */}
            {(drill?.videoLink || drill?.VideoLink) && (
              <Button
                onClick={() => window.open(drill?.videoLink || drill?.VideoLink, '_blank')}
                className="flex-1 bg-slate-600 hover:bg-red-600 text-slate-100 hover:text-white px-4 py-3 rounded-lg border border-slate-500 hover:border-red-500 transition-all duration-300 flex items-center justify-center gap-2 font-medium"
              >
                <Play className="w-4 h-4" />
                Watch Video
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Video Embed */}
          {videoId && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h3 className="font-semibold text-slate-100 mb-3 text-lg">Video Preview</h3>
              <div className="relative w-full h-0 pb-[56.25%] rounded-lg overflow-hidden">
                <iframe
                  className="absolute top-0 left-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="Drill Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Author Info */}
          {drill?.author && (
            <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
              <h3 className="font-semibold text-slate-100 mb-2 text-lg">Created By</h3>
              <p className="text-slate-200">
                {drill.author?.fullName || drill.author?.FullName || drill.author?.email || drill.author?.Email || 'Unknown'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DrillDetailModal;
