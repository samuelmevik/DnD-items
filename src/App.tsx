import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import { allTags, highestPrice, Item, items, lowestPrice } from "./data/items";
import ItemList from "./components/ItemList";
import { Spinner } from "./components/Spinner";

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState(lowestPrice)
  const [maxPrice, setMaxPrice] = useState(highestPrice)
  const [isPending, startTransition] = useTransition()
  const [filteredItems, setFilteredItems] = useState<Item[]>(items)

  const availablePriceRange = useMemo(() => {
    const relevantItems = selectedTags.length === 0
      ? items
      : items.filter(item => selectedTags.every(tag => item.tags.includes(tag)))
    const prices = relevantItems.map(item => item.price)
    return [Math.min(...prices), Math.max(...prices)] as [number, number]
  }, [selectedTags])

  useEffect(() => {
    startTransition(() => {
      const newFilteredItems = items.filter((item) => {
        if (item.price < minPrice || item.price > maxPrice) return false
        if (selectedTags.length > 0 && !selectedTags.every(tag => item.tags.includes(tag))) return false
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !item.description.some(desc => desc.toLowerCase().includes(searchTerm.toLowerCase()))) return false
        return true
      })
      setFilteredItems(newFilteredItems)
    })
  }, [searchTerm, selectedTags, minPrice, maxPrice])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleTagChange = useCallback((tags: string[]) => {
    setSelectedTags(tags)
    const [newMin, newMax] = availablePriceRange
    setMinPrice(newMin)
    setMaxPrice(newMax)
  }, [availablePriceRange])

  const handleMinPriceChange = useCallback((price: number) => {
    setMinPrice(Math.min(price, maxPrice - 1))
  }, [maxPrice])

  const handleMaxPriceChange = useCallback((price: number) => {
    setMaxPrice(Math.max(price, minPrice + 1))
  }, [minPrice])


  return (
    <main className="flex h-screen p-4 mx-auto max-w-7xl">
      <div className="flex flex-col flex-grow overflow-hidden gap-4">
        <div className="grid place-items-center gap-4 mb-4">
          <h1 className="text-4xl font-bold mb-4">D&D Item Catalog</h1>
          <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
        </div>
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden gap-4">
          <FilterSidebar
            allTags={allTags}
            selectedTags={selectedTags}
            onTagChange={handleTagChange}
            minPrice={minPrice}
            onMinPriceChange={handleMinPriceChange}
            maxPrice={maxPrice}
            onMaxPriceChange={handleMaxPriceChange}
            availablePriceRange={availablePriceRange}
          />
          <div className="flex-1 flex flex-grow relative overflow-y-auto">
            {isPending && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
                <Spinner />
              </div>
            )}
            <ItemList items={filteredItems} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;
