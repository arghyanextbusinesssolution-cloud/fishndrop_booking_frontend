"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, endOfMonth, format, getDay, isSameDay, startOfMonth, subMonths } from "date-fns";
import toast from "react-hot-toast";
import { useBookings } from "@/hooks/useBookings";
import { PRICE_PER_PERSON } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  partySize: z.number().min(2),
  bookingDate: z.string().refine((value) => new Date(value) > new Date(), "Pick a future date"),
  bookingTime: z.string().min(1, "Select a booking time"),
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(7, "Valid phone is required"),
  occasion: z.enum(["birthday", "anniversary", "graduation", "business", "quiet", "other"]),
  notes: z.string().max(500).optional(),
  cakeDetails: z.string().max(500).optional(),
  cakePrice: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

const stateStyles: Record<string, string> = {
  available: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
  booked: "border-red-500/40 bg-red-500/20 text-red-200",
  selected: "border-amber-500/40 bg-amber-500/20 text-amber-200",
  locked: "border-slate-500/40 bg-slate-500/20 text-slate-200",
};

export function BookingForm() {
  const router = useRouter();
  const { createBooking, getAvailability, loading, error } = useBookings();
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [step, setStep] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [slots, setSlots] = useState<{ slot: string; isAvailable: boolean; message: string }[]>([]);
  const [layout, setLayout] = useState<{ _id: string; tableNumber: number; capacity: 2 | 4; state: "available" | "booked" | "selected" | "locked" }[]>([]);
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { partySize: 2, occasion: "birthday", cakePrice: 0 },
  });
  const partySize = watch("partySize") ?? 2;
  const bookingDate = watch("bookingDate") ?? "";
  const cakePrice = watch("cakePrice") ?? 0;

  const selectedSlotData = useMemo(() => slots.find((item) => item.slot === selectedSlot), [selectedSlot, slots]);
  const canPickTime = Boolean(bookingDate);
  const canEnterGuests = canPickTime && Boolean(selectedSlot);
  const canFillDetails = canEnterGuests && Boolean(selectedSlotData?.isAvailable);
  const guestPrice = partySize * PRICE_PER_PERSON;
  const total = guestPrice + cakePrice;
  const stepLabels = ["Date", "Time", "Guests", "Layout", "Details", "Occasion", "Cake", "Summary"];
  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const leadingBlanks = getDay(monthStart);
  const daysInMonth = monthEnd.getDate();
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  const dateCells: Array<{ type: "blank" } | { type: "day"; value: Date }> = [];

  for (let i = 0; i < leadingBlanks; i += 1) {
    dateCells.push({ type: "blank" });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    dateCells.push({ type: "day", value: new Date(monthCursor.getFullYear(), monthCursor.getMonth(), day) });
  }

  useEffect(() => {
    setValue("bookingTime", selectedSlot);
  }, [selectedSlot, setValue]);

  useEffect(() => {
    const run = async () => {
      if (!bookingDate || partySize < 2) return;
      setCheckingAvailability(true);
      try {
        const data = await getAvailability(bookingDate, partySize, selectedSlot || undefined);
        setSlots(data.slots);
        setLayout(data.layout);
      } catch {
        setSlots([]);
        setLayout([]);
      } finally {
        setCheckingAvailability(false);
      }
    };
    void run();
  }, [bookingDate, partySize, selectedSlot, getAvailability]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (!selectedSlot || !selectedSlotData?.isAvailable) {
        toast.error("Please choose an available time slot");
        return;
      }
      const response = await createBooking(values);
      if (!response?.success || !response.booking?._id) {
        toast.error("Could not create booking");
        return;
      }
      toast.success("Booking created! Continue to payment.");
      const params = new URLSearchParams({
        bookingId: response.booking._id,
        totalAmount: String(response.booking.totalAmount ?? 0),
        partySize: String(values.partySize),
        bookingDate: values.bookingDate,
        bookingTime: values.bookingTime,
        customerName: values.customerName,
        occasion: values.occasion,
        cakePrice: String(values.cakePrice ?? 0)
      });
      router.push(`/user/payment?${params.toString()}`);
    } catch {}
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_10px_30px_rgba(15,30,60,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-2 overflow-x-auto">
        {stepLabels.map((label, index) => {
          const stepIndex = index + 1;
          const isActive = step === stepIndex;
          const isDone = step > stepIndex;
          return (
            <div key={label} className="flex min-w-fit items-center gap-2">
              <div className={`flex size-7 items-center justify-center rounded-full border text-xs ${isActive ? "border-pink-500 bg-pink-500/20 text-pink-700" : isDone ? "border-emerald-500 bg-emerald-500/20 text-emerald-700" : "border-[var(--border)] text-[var(--text-secondary)]"}`}>
                {stepIndex}
              </div>
              <span className={`text-xs ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{label}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {step === 1 && <div className="rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm font-semibold">Step 1 - Select Date</p>
          <div className="mt-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" onClick={() => setMonthCursor(subMonths(monthCursor, 1))} className="rounded-md border border-[var(--border)] p-2 text-[var(--text-secondary)]">
                <ChevronLeft size={16} />
              </button>
              <p className="text-lg font-semibold text-[var(--text-primary)]">{format(monthCursor, "MMMM yyyy")}</p>
              <button type="button" onClick={() => setMonthCursor(addMonths(monthCursor, 1))} className="rounded-md border border-[var(--border)] p-2 text-[var(--text-secondary)]">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center text-xs text-[var(--text-secondary)]">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((weekday) => <p key={weekday}>{weekday}</p>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {dateCells.map((cell, index) => {
                if (cell.type === "blank") {
                  return <div key={`blank-${index}`} className="h-11 rounded-md" />;
                }
                const dayDate = cell.value;
                const isPast = dayDate < today;
                const isSelected = bookingDate ? isSameDay(new Date(bookingDate), dayDate) : false;
                return (
                  <button
                    key={dayDate.toISOString()}
                    type="button"
                    disabled={isPast}
                    onClick={() => setValue("bookingDate", format(dayDate, "yyyy-MM-dd"), { shouldValidate: true })}
                    className={`h-11 rounded-md border text-sm ${
                      isSelected
                        ? "border-pink-500 bg-pink-500/20 text-pink-700"
                        : "border-[var(--border)] text-[var(--text-primary)]"
                    } ${isPast ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    {format(dayDate, "d")}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-3">
            <Label htmlFor="bookingDateDisplay">Selected Date</Label>
            <Input id="bookingDateDisplay" type="text" readOnly value={bookingDate ? format(new Date(bookingDate), "PPP") : "Pick a date from calendar"} />
            <input type="hidden" {...register("bookingDate")} />
            {errors.bookingDate && <p className="text-sm text-[var(--error)]">{errors.bookingDate.message}</p>}
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setStep(2)} disabled={!bookingDate}>Next</Button>
          </div>
        </div>}

        {step === 2 && <div className={`rounded-xl border p-4 ${canPickTime ? "border-[var(--border)]" : "border-[var(--border)]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 2 - Select Time</p>
          {checkingAvailability ? <p className="mt-2 text-xs text-[var(--text-secondary)]">Checking slots...</p> : null}
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot.slot}
                type="button"
                onClick={() => setSelectedSlot(slot.slot)}
                disabled={!slot.isAvailable || !canPickTime}
                className={`rounded-md border px-2 py-2 text-sm ${selectedSlot === slot.slot ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] bg-white"} ${!slot.isAvailable ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <p>{slot.slot}</p>
                <p className="text-[10px]">{slot.isAvailable ? "Available" : "Fully booked"}</p>
              </button>
            ))}
          </div>
          <input type="hidden" {...register("bookingTime")} />
          {errors.bookingTime && <p className="mt-1 text-sm text-[var(--error)]">{errors.bookingTime.message}</p>}
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!selectedSlot || !selectedSlotData?.isAvailable}>Next</Button>
          </div>
        </div>}

        {step === 3 && <div className={`rounded-xl border p-4 ${canEnterGuests ? "border-[#2a3148]" : "border-[#2a3148]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 3 - Enter Guests</p>
          <div className="mt-2">
            <Label htmlFor="partySize">Number of Guests</Label>
            <Input id="partySize" type="number" min={2} disabled={!canEnterGuests} {...register("partySize", { valueAsNumber: true })} />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">Minimum 2 guests. Single booking not allowed.</p>
            {errors.partySize && <p className="text-sm text-[var(--error)]">{errors.partySize.message}</p>}
          </div>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" onClick={() => setStep(4)} disabled={partySize < 2}>Next</Button>
          </div>
        </div>}

        {step === 4 && <div className={`rounded-xl border p-4 ${canEnterGuests ? "border-[#2a3148]" : "border-[#2a3148]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 4 - Table Layout (Preview)</p>
          <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
            {layout.map((table) => (
              <div key={table._id} className={`rounded-md border p-2 text-xs ${stateStyles[table.state]}`}>
                <p>Table #{table.tableNumber}</p>
                <p>{table.capacity}-Seater</p>
                <p className="capitalize">{table.state}</p>
              </div>
            ))}
          </div>
          {!selectedSlotData?.isAvailable && selectedSlot ? (
            <p className="mt-2 text-sm text-[var(--error)]">This time slot is fully booked. Please select another time.</p>
          ) : null}
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[#8f99bb]">
            <span>🟩 Available</span><span>🟥 Booked</span><span>🟨 Selected</span><span>⬜ Locked</span>
          </div>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
            <Button type="button" onClick={() => setStep(5)} disabled={!selectedSlotData?.isAvailable}>Next</Button>
          </div>
        </div>}

        {step === 5 && <div className={`rounded-xl border p-4 ${canFillDetails ? "border-[#2a3148]" : "border-[#2a3148]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 5 - Personal Details</p>
        <div>
          <div className="mt-2"><Label htmlFor="customerName">Name</Label><Input id="customerName" disabled={!canFillDetails} {...register("customerName")} />{errors.customerName && <p className="text-sm text-[var(--error)]">{errors.customerName.message}</p>}</div>
          <div><Label htmlFor="customerEmail">Email</Label><Input id="customerEmail" type="email" disabled={!canFillDetails} {...register("customerEmail")} />{errors.customerEmail && <p className="text-sm text-[var(--error)]">{errors.customerEmail.message}</p>}</div>
          <div><Label htmlFor="customerPhone">Phone</Label><Input id="customerPhone" disabled={!canFillDetails} {...register("customerPhone")} />{errors.customerPhone && <p className="text-sm text-[var(--error)]">{errors.customerPhone.message}</p>}</div>
          <div><Label htmlFor="notes">Notes (optional)</Label><Input id="notes" disabled={!canFillDetails} {...register("notes")} /></div>
          </div>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(4)}>Back</Button>
            <Button type="button" onClick={() => setStep(6)} disabled={!canFillDetails}>Next</Button>
          </div>
        </div>}

        {step === 6 && <div className={`rounded-xl border p-4 ${canFillDetails ? "border-[#2a3148]" : "border-[#2a3148]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 6 - Occasion</p>
          <div className="mt-2">
            <Label htmlFor="occasion">What are we celebrating?</Label>
            <select id="occasion" disabled={!canFillDetails} {...register("occasion")} className="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent p-2 text-sm">
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="graduation">Graduation</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(5)}>Back</Button>
            <Button type="button" onClick={() => setStep(7)} disabled={!canFillDetails}>Next</Button>
          </div>
        </div>}

        {step === 7 && <div className={`rounded-xl border p-4 ${canFillDetails ? "border-[#2a3148]" : "border-[#2a3148]/40 opacity-60"}`}>
          <p className="text-sm font-semibold">Step 7 - Cake (Optional)</p>
          <div className="mt-2"><Label htmlFor="cakeDetails">Cake details</Label><Input id="cakeDetails" disabled={!canFillDetails} placeholder='Size/Flavor/Type/Message (e.g. 7" Chocolate Eggless, Happy Birthday Rahul)' {...register("cakeDetails")} /></div>
          <div><Label htmlFor="cakePrice">Cake Price</Label><Input id="cakePrice" disabled={!canFillDetails} type="number" min={0} step="0.01" {...register("cakePrice", { setValueAs: (value) => (value === "" ? 0 : Number(value)) })} /></div>
          <div className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setStep(6)}>Back</Button>
            <Button type="button" onClick={() => setStep(8)} disabled={!canFillDetails}>Next</Button>
          </div>
        </div>}

        {step === 8 && <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-sm">
          <p className="font-semibold">Step 8 - Booking Summary</p>
          <p>Date: {bookingDate || "-"}</p>
          <p>Time: {selectedSlot || "-"}</p>
          <p>Guests Price: ${guestPrice}</p>
          <p>Cake Price: ${cakePrice || 0}</p>
          <p>Total: <span className="text-[var(--accent)]">${total}</span></p>
        </div>}
        {error && <p className="text-sm text-[var(--error)]">{error}</p>}
        <div className="flex justify-between">
          <Button type="button" variant="outline" disabled={step === 1} onClick={() => setStep((prev) => Math.max(1, prev - 1))}>Back</Button>
          {step < 8 ? <Button type="button" onClick={() => setStep((prev) => Math.min(8, prev + 1))}>Skip Next</Button> : null}
        </div>
        <Button type="submit" isLoading={loading} disabled={!canFillDetails || step !== 8} className="w-full bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]">
          {loading ? "Processing..." : "Confirm Booking & Continue to Payment"}
        </Button>
      </form>
    </div>
  );
}
