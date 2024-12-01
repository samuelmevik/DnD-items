import { Input } from "@/components/ui/input"

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function SearchBar({ searchTerm, onSearchChange: setSearchTerm }: SearchBarProps) {
  return (
    <div className="w-full max-w-md">
      <Input
        type="text"
        placeholder="Search items..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
      />
    </div>
  )
}

