import { Booking } from "@/types";

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportBookingsToCSV(bookings: Booking[], filenamePrefix = "bookings_export") {
  if (!bookings || bookings.length === 0) {
    return false;
  }

  const headers = [
    "Booking ID",
    "Category",
    "Type",
    "Customer Name",
    "Customer Email",
    "Customer Phone",
    "Event Date",
    "Event Time",
    "Booking Tried Date",
    "Party Size",
    "Tables",
    "Total Amount ($)",
    "Deposit Amount ($)",
    "Remaining Amount ($)",
    "Payment Status",
    "Status",
    "Occasion",
    "DJ Service",
    "Catering Menu",
    "Notes"
  ];

  const rows = bookings.map((b) => {
    let category = "Lead";
    if (b.status === "cancelled") {
      category = "Cancelled";
    } else if (b.paymentStatus === "paid" || b.paymentStatus === "deposit_paid") {
      category = "Booking";
    }

    const bookingType = b.bookingType === "private_event" ? "Venue Buyout" : "Standard";
    const tables = b.bookingType === "private_event"
      ? "Full Venue"
      : (b.tables?.map((t) => `T-${t.tableNumber}`).join("; ") || "—");

    const eventDate = b.bookingDate ? new Date(b.bookingDate).toLocaleDateString("en-US") : "";
    const triedDate = b.createdAt
      ? new Date(b.createdAt).toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        })
      : "";

    return [
      escapeCsvCell(b._id),
      escapeCsvCell(category),
      escapeCsvCell(bookingType),
      escapeCsvCell(b.customerName || b.user?.name || ""),
      escapeCsvCell(b.customerEmail || b.user?.email || ""),
      escapeCsvCell(b.customerPhone || ""),
      escapeCsvCell(eventDate),
      escapeCsvCell(b.bookingTime || ""),
      escapeCsvCell(triedDate),
      escapeCsvCell(b.partySize || 0),
      escapeCsvCell(tables),
      escapeCsvCell(b.totalAmount || 0),
      escapeCsvCell(b.depositAmount || 0),
      escapeCsvCell(b.remainingAmount || 0),
      escapeCsvCell(b.paymentStatus || "pending_payment"),
      escapeCsvCell(b.status || "pending"),
      escapeCsvCell(b.occasion || ""),
      escapeCsvCell(b.needDj === true ? "Yes" : b.needDj === false ? "No" : ""),
      escapeCsvCell(b.cateringMenu || ""),
      escapeCsvCell(b.notes || "")
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
