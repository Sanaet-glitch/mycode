import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Class } from "@/services/courseService";
import { Loader2 } from "lucide-react";

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (classData: Partial<Class>) => void;
  initialData?: Partial<Class>;
  isProcessing?: boolean;
  courseId: string;
  mode?: 'create' | 'edit';
}

export function ClassFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  isProcessing = false,
  courseId,
  mode = 'create'
}: ClassFormModalProps) {
  const [formData, setFormData] = useState<Partial<Class>>({
    course_id: courseId,
    name: '',
    day_of_week: 1, // Monday by default
    start_time: '09:00',
    end_time: '10:30',
    room: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...formData,
        ...initialData
      });
    }
  }, [initialData, courseId]);

  // Update course_id when it changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      course_id: courseId
    }));
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: name === 'day_of_week' ? Number(value) : value
    }));
  };

  const handleTimeChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Class Session' : 'Edit Class Session'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Schedule a new recurring class session for this course.'
              : 'Update the details of this class session.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Lecture / Lab / Tutorial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="day_of_week">Day of Week</Label>
            <Select 
              value={formData.day_of_week?.toString()} 
              onValueChange={(value) => handleSelectChange('day_of_week', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
                <SelectItem value="2">Tuesday</SelectItem>
                <SelectItem value="3">Wednesday</SelectItem>
                <SelectItem value="4">Thursday</SelectItem>
                <SelectItem value="5">Friday</SelectItem>
                <SelectItem value="6">Saturday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                name="start_time"
                type="time"
                value={formData.start_time}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                name="end_time"
                type="time"
                value={formData.end_time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="room">Room / Location</Label>
            <Input
              id="room"
              name="room"
              value={formData.room}
              onChange={handleChange}
              placeholder="Room 101, Building A"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                mode === 'create' ? 'Add Class' : 'Update Class'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 