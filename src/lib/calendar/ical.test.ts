import { describe, expect, it } from "vitest";

import { detectSource, nightsBetween, parseIcal, parseIcalDate } from "./ical";

const airbnb = [
  "BEGIN:VCALENDAR",
  "PRODID;X-RICAL-TZSOURCE=TZINFO:-//Airbnb Inc//Hosting Calendar 1.0//EN",
  "CALSCALE:GREGORIAN",
  "VERSION:2.0",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20260925",
  "DTSTART;VALUE=DATE:20260920",
  "UID:1418fb94e984-abc@airbnb.com",
  "DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HM",
  " ABC123XYZ\\nPhone Number (Last 4 Digits): 4321",
  "SUMMARY:Reserved",
  "END:VEVENT",
  "BEGIN:VEVENT",
  "DTEND;VALUE=DATE:20261003",
  "DTSTART;VALUE=DATE:20261001",
  "UID:7f3c-blocked@airbnb.com",
  "SUMMARY:Airbnb (Not available)",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

const booking = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//admin.booking.com//EN",
  "BEGIN:VEVENT",
  "UID:b1a2@booking.com",
  "DTSTAMP:20260917T120000Z",
  "DTSTART;VALUE=DATE:20261010",
  "DTEND;VALUE=DATE:20261012",
  "SUMMARY:CLOSED - Not available",
  "END:VEVENT",
  "END:VCALENDAR",
].join("\n");

describe("parseIcal", () => {
  it("lê reservas e bloqueios do Airbnb", () => {
    const events = parseIcal(airbnb, "airbnb");
    expect(events).toHaveLength(2);

    const [reservation, blocked] = events;
    expect(reservation.kind).toBe("reserva");
    expect(reservation.startDate.toISOString()).toBe("2026-09-20T00:00:00.000Z");
    expect(reservation.endDate.toISOString()).toBe("2026-09-25T00:00:00.000Z");
    expect(reservation.reservationUrl).toBe(
      "https://www.airbnb.com/hosting/reservations/details/HMABC123XYZ",
    );
    expect(reservation.phoneLast4).toBe("4321");
    expect(blocked.kind).toBe("bloqueio");
    expect(blocked.uid).toBe("7f3c-blocked@airbnb.com");
  });

  it("trata eventos do Booking como ocupação", () => {
    const [event] = parseIcal(booking, "booking");
    expect(event.kind).toBe("reserva");
    expect(nightsBetween(event.startDate, event.endDate)).toBe(2);
  });

  it("ignora cancelados, datas inválidas e subcomponentes", () => {
    const text = [
      "BEGIN:VEVENT",
      "UID:a",
      "DTSTART:20261101T140000Z",
      "SUMMARY:Reserva direta",
      "BEGIN:VALARM",
      "SUMMARY:alarme",
      "END:VALARM",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:b",
      "STATUS:CANCELLED",
      "DTSTART;VALUE=DATE:20261101",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:c",
      "DTSTART;VALUE=DATE:banana",
      "END:VEVENT",
    ].join("\n");
    const events = parseIcal(text, "outro");
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe("Reserva direta");
    expect(nightsBetween(events[0].startDate, events[0].endDate)).toBe(1);
  });
});

describe("helpers", () => {
  it("valida datas", () => {
    expect(parseIcalDate("20260230")).toBeNull();
    expect(parseIcalDate("20260101T000000")?.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });

  it("detecta a origem pelo link", () => {
    expect(detectSource("https://www.airbnb.com.br/calendar/ical/123.ics?s=x")).toBe("airbnb");
    expect(detectSource("https://admin.booking.com/hotel/hoteladmin/ical.html?t=x")).toBe("booking");
    expect(detectSource("https://example.com/cal.ics")).toBe("outro");
    expect(detectSource("https://notairbnb.example.com/x")).toBe("outro");
  });
});
