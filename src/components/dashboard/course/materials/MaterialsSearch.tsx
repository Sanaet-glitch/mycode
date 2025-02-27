import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const MaterialsSearch = ({ onSearch, onFilterChange }) => {
  return (
    <div className="flex gap-2">
      <Input 
        placeholder="Search materials..." 
        onChange={(e) => onSearch(e.target.value)}
      />
      <Select onValueChange={onFilterChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="file">Files</SelectItem>
          <SelectItem value="link">Links</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}; 