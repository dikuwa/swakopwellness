"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, DatePicker, Input, Label, Select } from "@/ui/components";

export function DocumentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/dashboard/documents${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-surface p-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_auto]">
      <div>
        <Label htmlFor="documentSearch" className="mb-2">Search</Label>
        <Input id="documentSearch" value={q} onChange={(event) => setQ(event.target.value)} placeholder="Number, client, or booking" />
      </div>
      <div>
        <Label htmlFor="documentTypeFilter" className="mb-2">Type</Label>
        <Select
          id="documentTypeFilter"
          value={type}
          onChange={setType}
          showClear
          options={[
            { value: "quotation", label: "Quotation" },
            { value: "invoice", label: "Invoice" },
            { value: "receipt", label: "Receipt" },
          ]}
          placeholder="All types"
        />
      </div>
      <div>
        <Label htmlFor="documentStatusFilter" className="mb-2">Status</Label>
        <Select
          id="documentStatusFilter"
          value={status}
          onChange={setStatus}
          showClear
          options={[
            { value: "draft", label: "Draft" },
            { value: "issued", label: "Issued" },
            { value: "partially_paid", label: "Partially paid" },
            { value: "paid", label: "Paid" },
            { value: "active", label: "Active" },
            { value: "voided", label: "Voided" },
          ]}
          placeholder="All statuses"
        />
      </div>
      <div>
        <Label htmlFor="documentFromFilter" className="mb-2">From</Label>
        <DatePicker id="documentFromFilter" value={from} onChange={setFrom} placeholder="Start date" />
      </div>
      <div>
        <Label htmlFor="documentToFilter" className="mb-2">To</Label>
        <DatePicker id="documentToFilter" value={to} onChange={setTo} placeholder="End date" />
      </div>
      <div className="flex items-end">
        <Button type="button" variant="secondary" className="w-full" onClick={apply}>Apply</Button>
      </div>
    </div>
  );
}
