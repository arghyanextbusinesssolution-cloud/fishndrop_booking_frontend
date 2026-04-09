"use client";

import { Table } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  tables: Table[];
  onSeed: () => void;
  onUpdateConfig: (twoSeaters: number, fourSeaters: number) => void;
  onToggleAvailability: (tableId: string, isAvailable: boolean) => void;
  onSlotLock: (bookingDate: string, bookingTime: string, isLocked: boolean, reason?: string) => void;
  seeding: boolean;
}

export function TablesGrid({ tables, onSeed, onUpdateConfig, onToggleAvailability, onSlotLock, seeding }: Props) {
  const available = tables.filter((t) => t.isAvailable).length;
  const twoSeaters = tables.filter((t) => t.capacity === 2).length;
  const fourSeaters = tables.filter((t) => t.capacity === 4).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[var(--text-secondary)]">{available}/{tables.length || 6} tables available</p>
        <Button onClick={onSeed} disabled={seeding} className="bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]">Seed Tables</Button>
      </div>
      <form
        key={`${twoSeaters}-${fourSeaters}`}
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onUpdateConfig(Number(formData.get("twoSeaters") || 0), Number(formData.get("fourSeaters") || 0));
        }}
      >
        <div>
          <p className="text-xs text-[var(--text-secondary)]">2-Seater tables (current: {twoSeaters})</p>
          <input
            name="twoSeaters"
            type="number"
            min={0}
            defaultValue={twoSeaters}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">4-Seater tables (current: {fourSeaters})</p>
          <input
            name="fourSeaters"
            type="number"
            min={0}
            defaultValue={fourSeaters}
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={seeding}>
          Update Table Counts
        </Button>
      </form>
      <form
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSlotLock(
            String(formData.get("slotDate") || ""),
            String(formData.get("slotTime") || ""),
            true,
            String(formData.get("slotReason") || "Blocked until admin unlocks")
          );
        }}
      >
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Lock specific slot date</p>
          <input
            name="slotDate"
            type="date"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Time</p>
          <select name="slotTime" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm">
            <option value="18:00">18:00</option>
            <option value="19:00">19:00</option>
            <option value="20:00">20:00</option>
            <option value="21:00">21:00</option>
          </select>
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Reason</p>
          <input
            name="slotReason"
            type="text"
            defaultValue="Blocked until admin unlocks"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={seeding}>Lock Slot</Button>
      </form>
      <form
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          onSlotLock(String(formData.get("slotDateUnlock") || ""), String(formData.get("slotTimeUnlock") || ""), false);
        }}
      >
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Unlock slot date</p>
          <input
            name="slotDateUnlock"
            type="date"
            className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm"
          />
        </div>
        <div>
          <p className="text-xs text-[var(--text-secondary)]">Time</p>
          <select name="slotTimeUnlock" className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm">
            <option value="18:00">18:00</option>
            <option value="19:00">19:00</option>
            <option value="20:00">20:00</option>
            <option value="21:00">21:00</option>
          </select>
        </div>
        <Button type="submit" variant="outline" disabled={seeding}>Unlock Slot</Button>
      </form>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tables.map((table) => (
          <div key={table._id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <h3 className="font-semibold">Table #{table.tableNumber}</h3>
            <p className="text-sm text-[var(--text-secondary)]">Capacity: {table.capacity}</p>
            <p className={`mt-2 text-sm ${table.isAvailable ? "text-[var(--success)]" : "text-[var(--error)]"}`}>
              {table.isAvailable ? "Enabled" : "Blocked by admin"}
            </p>
            <Button
              className="mt-3 w-full"
              variant="outline"
              onClick={() => onToggleAvailability(table._id, !table.isAvailable)}
            >
              {table.isAvailable ? "Block Table" : "Unlock Table"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
