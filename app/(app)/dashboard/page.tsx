import Link from "next/link";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Start a new case</h2>
        <p className="text-sm text-slate-600">Upload pages one by one, review OCR, extract fields, then export the docx.</p>
        <Link href="/new-case" className="text-sm font-medium text-accent underline">
          Open conversational flow
        </Link>
      </Card>
    </div>
  );
}
