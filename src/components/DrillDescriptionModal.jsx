import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function DrillDescriptionModal({ isOpen, onClose, description, onSave }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState(description || '');

  const handleSave = () => {
    onSave(desc);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-bg-secondary rounded-xl border border-border-custom shadow-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Drill Description</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="drill-title" className="text-text-primary font-medium">
                    Drill Title
                  </Label>
                  <Input
                    id="drill-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter drill title..."
                    className="mt-2 bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary"
                  />
                </div>
                
                <div>
                  <Label htmlFor="drill-description" className="text-text-primary font-medium">
                    Description & Instructions
                  </Label>
                  <Textarea
                    id="drill-description"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Describe the drill, instructions, objectives, and variations..."
                    className="mt-2 h-32 bg-bg-secondary border-border-custom text-text-primary placeholder-text-secondary resize-none"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="border-border-custom text-text-primary hover:bg-bg-secondary hover:text-text-primary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-accent-primary hover:bg-blue-600 text-text-primary"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Description
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}