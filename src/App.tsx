import { useState } from "react";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import { allTags, highestPrice, items, lowestPrice } from "./data/items";
import ItemList from "./components/ItemList";

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    lowestPrice,
    highestPrice,
  ]);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => item.tags.includes(tag));
    const matchesPrice =
      item.price >= priceRange[0] && item.price <= priceRange[1];
    return matchesSearch && matchesTags && matchesPrice;
  });

  return (
    <main className="flex h-screen p-4 mx-auto max-w-7xl">
      <div className="flex flex-col flex-grow overflow-hidden gap-4">
        <div className="grid place-items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold mb-4">D&D Item Catalog</h1>
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <div className="flex flex-grow overflow-hidden gap-4">
          <FilterSidebar
            allTags={allTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            lowestPrice={lowestPrice}
            highestPrice={highestPrice}
          />
          <ItemList items={filteredItems} />
        </div>
      </div>
    </main>
  );
}

export default App;
