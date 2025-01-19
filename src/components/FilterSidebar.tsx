import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { useState } from "react";

type FilterSidebarProps = {
  allTags: string[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
  minPrice: number;
  onMinPriceChange: (price: number) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  availablePriceRange: [number, number];
};

function FilterSection({
  allTags,
  selectedTags,
  onTagChange,
}: {
  allTags: string[];
  selectedTags: string[];
  onTagChange: (tags: string[]) => void;
}) {
  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    onTagChange(newTags);
  };
  return (
    <>
      <div className="md:mb-6">
        <h3 className="mb-2 hidden overflow-auto text-lg font-medium md:block">
          Tags
        </h3>
        <ScrollArea>
          <div className="grid grid-flow-col grid-rows-2 gap-x-8 md:grid-flow-row">
            {allTags.map((tag) => (
              <div key={tag} className="mb-2 flex items-center">
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
  );
}

function PricingSection({
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  availablePriceRange,
}: {
  minPrice: number;
  onMinPriceChange: (price: number) => void;
  maxPrice: number;
  onMaxPriceChange: (price: number) => void;
  availablePriceRange: [number, number];
}) {
  return (
    <div>
      <h3 className="mb-2 text-lg font-medium">Price Range</h3>
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
  );
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
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="relative h-fit min-w-64 rounded-xl bg-white p-4 shadow-md">
      <h2 className="mb-4 text-2xl font-semibold">Filters</h2>
      <button onClick={() => setIsOpen(!isOpen)} className="absolute right-0 top-0 p-4">
        {isOpen ? "Hide" : "Show"}
      </button>
      {isOpen && (
        <>
          <FilterSection
            allTags={allTags}
            selectedTags={selectedTags}
            onTagChange={onTagChange}
          />
          <PricingSection
            minPrice={minPrice}
            onMinPriceChange={onMinPriceChange}
            maxPrice={maxPrice}
            onMaxPriceChange={onMaxPriceChange}
            availablePriceRange={availablePriceRange}
          />
        </>
      )}
    </div>
  );
}
