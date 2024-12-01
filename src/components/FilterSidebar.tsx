import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

type FilterSidebarProps = {
  allTags: string[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  minPrice: number;
  onMinPriceChange: (price: number) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  availablePriceRange: [number, number];
}

export default function FilterSidebar({
  allTags,
  selectedTags,
  onTagChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  availablePriceRange,
}: FilterSidebarProps) {
  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onTagChange(newTags)
  }

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
        <div>
          <p>Minimum Price</p> 
          <Slider
            min={availablePriceRange[0]}
            max={availablePriceRange[1]}
            step={1}
            value={[minPrice]}
            onValueChange={([value]) => onMinPriceChange(value)}
            className="mb-2"
          />
          <span>{minPrice} gp</span>
        </div>
        <div>
          <p>Maximum Price</p>
          <Slider
            min={availablePriceRange[0]}
            max={availablePriceRange[1]}
            step={1}
            value={[maxPrice]}
            onValueChange={([value]) => onMaxPriceChange(value)}
            className="mb-2"
          />
          <span>{maxPrice} gp</span>
        </div>

      </div>
    </div>
  );
}
