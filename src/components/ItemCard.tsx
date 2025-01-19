import { Item } from "../data/items";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { ViewIcon } from "lucide-react";

const itemRarityColors: Record<string, string> = {
  common: "gray",
  uncommon: "green",
  rare: "blue",
  "very rare": "purple",
  legendary: "orange",
  artifact: "red",
  "wondrous item": "yellow",
};

function Tag({ tag }: { tag: string }) {
  const color = itemRarityColors[tag.toLowerCase()] ?? "gray";
  return (
    <Badge
      variant="secondary"
      style={{ border: `1px solid ${color}` }}
      className="capitalize"
    >
      {tag}
    </Badge>
  );
}

function Price({
  price,
  basePrice,
}: {
  price: number;
  basePrice?: boolean;
}) {
  return (
    <div>
      <span className="text-lg font-semibold">{price} gp</span>{" "}
      {basePrice && (
        <span className="text-sm italic">+ Base price</span>
      )}
    </div>
  );
}

function ItemDetails({ item }: { item: Item }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2 text-sm text-gray-600">
        {item.description.map((desc, i) => (
          <p key={i}>{desc}</p>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {item.tags.map((tag) => (
          <Tag key={tag} tag={tag} />
        ))}
        <Price price={item.price} basePrice={item.notBasePrice} />
      </div>
    </div>
  );
}

export default function ItemCard({ item }: { item: Item }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="line-clamp-3 space-y-1 text-sm text-gray-600">
          {item.description.map((desc, i) => (
            <p key={i}>{desc}</p>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex w-full items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {item.tags.map((tag) => (
              <Tag key={tag} tag={tag} />
            ))}
            <Price price={item.price} basePrice={item.notBasePrice} />
          </div>
          <Dialog>
            <DialogTrigger>
              <ViewIcon size={24} />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{item.name}</DialogTitle>
              </DialogHeader>
              <DialogDescription className="mt-4">
                <ItemDetails item={item} />
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
}
