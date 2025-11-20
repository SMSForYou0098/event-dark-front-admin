export function areAllSeatsBooked(input) {
  const sections = Array.isArray(input) ? input : [input]; // Normalize to array

  if (!sections.length) return false;

  return sections.every(section =>
    Array.isArray(section.rows) &&
    section.rows.length > 0 &&
    section.rows.every(row =>
      Array.isArray(row.seatList) &&
      row.seatList.length > 0 &&
      row.seatList.every(seat =>
        seat?.isBooked === true || seat?.status === 'booked'
      )
    )
  );
}

export const describeArc = (cx, cy, r1, r2, startAngle, endAngle) => {
    const start1 = polarToCartesian(cx, cy, r2, endAngle);
    const end1 = polarToCartesian(cx, cy, r2, startAngle);
    const start2 = polarToCartesian(cx, cy, r1, startAngle);
    const end2 = polarToCartesian(cx, cy, r1, endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        `M ${start1.x} ${start1.y}`,
        `A ${r2} ${r2} 0 ${largeArcFlag} 0 ${end1.x} ${end1.y}`,
        `L ${start2.x} ${start2.y}`,
        `A ${r1} ${r1} 0 ${largeArcFlag} 1 ${end2.x} ${end2.y}`,
        "Z",
    ].join(" ");
};

export const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians),
    };
};



