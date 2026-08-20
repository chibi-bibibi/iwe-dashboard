export function formatToJapaneseEra(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();

  let era = "";
  let eraYear = y;
  if (y >= 2019) {
    era = "R";
    eraYear = y - 2018;
  } else if (y >= 1989) {
    era = "H";
    eraYear = y - 1988;
  } else if (y >= 1926) {
    era = "S";
    eraYear = y - 1925;
  } else {
    return `${y}/${m}/${day}`;
  }

  const yy = eraYear.toString().padStart(2, "0");
  return `${era}${yy}.${m}/${day}`;
}

export default formatToJapaneseEra;
