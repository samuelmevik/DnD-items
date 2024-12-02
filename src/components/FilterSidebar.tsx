import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

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

function FilterSection({allTags, selectedTags, onTagChange} : { allTags: string[], selectedTags: string[], onTagChange: (tags: string[]) => void }) {
  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
    onTagChange(newTags)
  }
  return (
    <>
      <h2 className="text-2xl font-semibold mb-4">Filters</h2>
      <div className="md:mb-6">
        <h3 className="text-lg font-medium mb-2 overflow-auto hidden md:block">Tags</h3>
        <ScrollArea>
          <div className="grid grid-flow-col grid-rows-2 md:grid-flow-row gap-x-8">
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  )
}

function PricingSection({
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  availablePriceRange,
} : {
  minPrice: number;
  onMinPriceChange: (price: number) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  availablePriceRange: [number, number];
}) {
  return (
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
  )
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
  return (
    <div className="min-w-64">
      <FilterSection allTags={allTags} selectedTags={selectedTags} onTagChange={onTagChange} />
      <PricingSection
        minPrice={minPrice}
        onMinPriceChange={onMinPriceChange}
        maxPrice={maxPrice}
        onMaxPriceChange={onMaxPriceChange}
        availablePriceRange={availablePriceRange}
      />
    </div>
  );
}
