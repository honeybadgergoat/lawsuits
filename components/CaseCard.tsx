import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CaseDocument } from "@/lib/types";

interface CaseCardProps {
  item: CaseDocument;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CaseCard({ item, onOpen, onDelete }: CaseCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{item.title}</h3>
          <p className="text-xs text-slate-500">{format(item.updatedAt, "yyyy-MM-dd HH:mm")}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{item.status}</span>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => onOpen(item.id)}>
          Open
        </Button>
        <Button variant="destructive" className="flex-1" onClick={() => onDelete(item.id)}>
          Soft delete
        </Button>
      </div>
    </Card>
  );
}
