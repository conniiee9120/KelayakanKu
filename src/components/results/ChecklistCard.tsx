// Checklist section for required documents and next steps.
import { Card } from "../ui/Card";

export function ChecklistCard({ title, items, ordered = false }: { title: string; items: string[]; ordered?: boolean }) {
  const ListTag = ordered ? "ol" : "ul";

  return (
    <Card className="checklist-card">
      <h2>{title}</h2>
      <ListTag>
        {items.map((item, index) => (
          <li key={item}>
            <span>{ordered ? index + 1 : "✓"}</span>
            {item}
          </li>
        ))}
      </ListTag>
    </Card>
  );
}
