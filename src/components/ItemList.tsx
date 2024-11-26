import { Item } from '../data/items'
import ItemCard from './ItemCard'

export default function ItemList({ items }: { items: Item[] }) {
  return (
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
  )
}

