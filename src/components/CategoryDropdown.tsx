import { useState } from "react";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Settings, Plus, Trash2, ChevronDown } from "lucide-react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryDropdownProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export const CategoryDropdown = ({
  value,
  onChange,
  categories,
  onCategoriesChange,
}: CategoryDropdownProps) => {
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [editingCategories, setEditingCategories] = useState<Category[]>(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  const handleSaveCategories = () => {
    onCategoriesChange(editingCategories);
    setIsManageOpen(false);
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: crypto.randomUUID(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
      };
      setEditingCategories([...editingCategories, newCategory]);
      setNewCategoryName("");
      setNewCategoryColor("#3b82f6");
    }
  };

  const handleDeleteCategory = (id: string) => {
    setEditingCategories(editingCategories.filter((c) => c.id !== id));
  };

  const handleUpdateCategory = (id: string, field: "name" | "color", value: string) => {
    setEditingCategories(
      editingCategories.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  return (
    <>
      <div className="space-y-2">
        <Label>Category</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Select value={value} onValueChange={onChange}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-[100]">
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsManageOpen(true)}
            className="shrink-0"
            title="Manage Categories"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Existing Categories</h3>
              {editingCategories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                  <input
                    type="color"
                    value={cat.color}
                    onChange={(e) => handleUpdateCategory(cat.id, "color", e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer border-0"
                  />
                  <Input
                    value={cat.name}
                    onChange={(e) => handleUpdateCategory(cat.id, "name", e.target.value)}
                    className="flex-1 bg-background border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-sm font-medium">Add New Category</h3>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCategory()}
                  placeholder="Category name..."
                  className="flex-1 bg-muted border-border"
                />
                <Button onClick={handleAddCategory} size="icon" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategories} className="bg-gradient-to-r from-primary to-primary-glow">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
