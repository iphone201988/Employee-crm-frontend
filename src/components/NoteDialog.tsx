import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface Note {
  id: string;
  text: string;
  timestamp: string;
}

interface NoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMember: any;
  noteText: string;
  onNoteTextChange: (text: string) => void;
  onSendNote: () => void;
}

const NoteDialog = ({ 
  open, 
  onOpenChange, 
  selectedMember, 
  noteText, 
  onNoteTextChange, 
  onSendNote 
}: NoteDialogProps) => {
  // Sample existing notes for demonstration
  const [existingNotes, setExistingNotes] = useState<Note[]>([
    {
      id: '1',
      text: 'Please review the timesheet entries for Monday.',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString()
    },
    {
      id: '2', 
      text: 'Missing description for project work on Friday.',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toLocaleString()
    }
  ]);

  const handleSendNote = () => {
    if (noteText.trim()) {
      // Add new note to existing notes
      const newNote: Note = {
        id: Date.now().toString(),
        text: noteText,
        timestamp: new Date().toLocaleString()
      };
      setExistingNotes(prev => [newNote, ...prev]);
      onSendNote();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notes for {selectedMember?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Existing Notes */}
          <div>
            <Label className="text-sm font-medium">Previous Notes</Label>
            <div className="mt-2 space-y-3 max-h-48 overflow-y-auto">
              {existingNotes.length > 0 ? (
                existingNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg border">
                    <p className="text-sm text-foreground">{note.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{note.timestamp}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No previous notes</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Add New Note */}
          <div>
            <Label htmlFor="new-note" className="text-sm font-medium">Add New Note</Label>
            <Textarea
              id="new-note"
              placeholder="Enter your note here..."
              value={noteText}
              onChange={(e) => onNoteTextChange(e.target.value)}
              className="min-h-[120px] mt-2"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendNote} disabled={!noteText.trim()}>
            Add Note
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteDialog;
