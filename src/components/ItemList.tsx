import { Item } from '../data/items'
import ItemCard from './ItemCard'
import { ScrollArea } from './ui/scroll-area'

export default function ItemList({ items }: { items: Item[] }) {
  return (
    <ScrollArea className="flex-1">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </ScrollArea>
  )
}
