import { Item } from '../data/items'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const itemRarityColors: { [key: string]: string } = {
  common: "gray",
  uncommon: "green",
  rare: "blue",
  "very rare": "purple",
  legendary: "orange",
  artifact: "red",
};

function Tag({ tag }: { tag: string }) {
  return (
    <Badge variant="secondary" style={{
      border:
        `1px solid ${itemRarityColors[tag.toLowerCase()]}`,
    }}>
      {tag}
    </Badge>
  )
}

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="w-full h-fit">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Tag key={tag} tag={tag} />
          ))}
        </div>
      </CardContent>
      <CardFooter>
        {item.notBasePrice ? (
          <p> <span className='text-lg font-semibold'>{item.price} gp</span>  + <span className='italic'>Base price</span></p>
        ) :
          <p className="text-lg font-semibold">{item.price} gp</p>
        }
      </CardFooter>
    </Card>
  )
}
