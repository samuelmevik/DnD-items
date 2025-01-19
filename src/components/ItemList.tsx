import { Item } from '../data/items'
import ItemCard from './ItemCard'
import { ScrollArea } from './ui/scroll-area'

export default function ItemList({ items }: { items: Item[] }) {
  return (
    <ScrollArea className='w-full rounded-2xl'>
      <div className="grid w-full grid-cols-1 gap-6 pb-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </ScrollArea>
  )
}
