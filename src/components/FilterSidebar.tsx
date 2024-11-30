import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FilterSidebarProps {
  allTags: string[];
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  lowestPrice: number;
  highestPrice: number;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
}

export default function FilterSidebar({
  allTags,
  selectedTags,
  setSelectedTags,
  lowestPrice,
  highestPrice,
  priceRange,
  setPriceRange,
}: FilterSidebarProps) {
  const handleTagChange = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="min-w-64">
      <h2 className="text-2xl font-semibold mb-4">Filters</h2>
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Tags</h3>
        <div className="grid md:grid-cols-1 grid-cols-3 gap-2">
          {allTags.map((tag) => (
            <div key={tag} className="flex items-center mb-2">
              <Checkbox
                id={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => handleTagChange(tag)}
              />
              <Label htmlFor={tag} className="ml-2">
                {tag}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">Price Range</h3>
        <Slider
          min={lowestPrice}
          max={highestPrice}
          step={100}
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          className="mb-2"
        />
        <div className="flex justify-between">
          <span>{priceRange[0]} gp</span>
          <span>{priceRange[1]} gp</span>
        </div>
      </div>
    </div>
  );
}
