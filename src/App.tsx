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
    <main className="flex min-h-screen flex-col items-center mx-auto max-w-7xl p-4">
      <h1 className="text-4xl font-bold mb-8">D&D Item Catalog</h1>
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <div className="md:flex w-full mt-8">
        <FilterSidebar
          allTags={allTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          lowestPrice={lowestPrice}
          highestPrice={highestPrice}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
        />
        <ItemList items={filteredItems} />
      </div>
    </main>
  );
}

export default App;
