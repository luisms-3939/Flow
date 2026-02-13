import { useState } from "react";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Settings, Plus, Trash2, ChevronDown } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagsMultiSelectProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  tags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
}

export const TagsMultiSelect = ({
  selectedTags,
  onChange,
  tags,
  onTagsChange,
}: TagsMultiSelectProps) => {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [editingTags, setEditingTags] = useState<Tag[]>(tags);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#8b5cf6");

  const handleSaveTags = () => {
    onTagsChange(editingTags);
    setIsManageOpen(false);
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: crypto.randomUUID(),
        name: newTagName.trim(),
        color: newTagColor,
      };
      setEditingTags([...editingTags, newTag]);
      setNewTagName("");
      setNewTagColor("#8b5cf6");
    }
  };

  const handleDeleteTag = (id: string) => {
    setEditingTags(editingTags.filter((t) => t.id !== id));
  };

  const handleUpdateTag = (id: string, field: "name" | "color", value: string) => {
    setEditingTags(
      editingTags.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const handleToggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const handleRemoveSelectedTag = (tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  };

  const getTagColor = (tagName: string) => {
    return tags.find((t) => t.name === tagName)?.color || "#8b5cf6";
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Popover open={isSelectOpen} onOpenChange={setIsSelectOpen} modal={false}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-between bg-muted border-border"
                type="button"
              >
                <span className="text-muted-foreground">
                  {selectedTags.length === 0
                    ? "Select tags..."
                    : `${selectedTags.length} tag(s) selected`}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-popover border-border z-[100]" align="start">
              <div className="p-2 space-y-1 max-h-[300px] overflow-auto">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                    onClick={() => handleToggleTag(tag.name)}
                  >
                    <Checkbox checked={selectedTags.includes(tag.name)} className="pointer-events-none" />
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="flex-1">{tag.name}</span>
                  </div>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tags available. Create one using the manage button.
                  </p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsManageOpen(true)}
            className="shrink-0"
            title="Manage Tags"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedTags.map((tagName) => (
              <Badge
                key={tagName}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                style={{
                  backgroundColor: `${getTagColor(tagName)}20`,
                  borderColor: getTagColor(tagName),
                  borderWidth: "1px",
                  color: getTagColor(tagName),
                }}
                onClick={() => handleRemoveSelectedTag(tagName)}
              >
                {tagName} ×
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Manage Tags</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Existing Tags</h3>
              {editingTags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <input
                    type="color"
                    value={tag.color}
                    onChange={(e) => handleUpdateTag(tag.id, "color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={tag.name}
                    onChange={(e) => handleUpdateTag(tag.id, "name", e.target.value)}
                    className="flex-1 bg-background border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTag(tag.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-sm font-medium">Add New Tag</h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  placeholder="Tag name..."
                  className="flex-1 bg-muted border-border"
                />
                <Button onClick={handleAddTag} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTags} className="bg-gradient-to-r from-primary to-primary-glow">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
