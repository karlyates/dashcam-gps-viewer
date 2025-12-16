/**
 * Parses GPS dat file content.
 * Expected format: timestamp(14), lat, latDir, lon, lonDir, speed(opt), alt(opt)
 */
function parseDatText(text) {
  const lines = text.split(/\r?\n/);
  const parsed = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    // Some formats might use different delimiters, but csv is standard for this task
    const parts = line.split(',').map(p => p.trim());

    if (parts.length < 5) continue;

    const tsRaw = parts[0];
    const timeHuman = parseTimestamp(tsRaw);

    const latVal = parseFloat(parts[1]);
    const latDir = (parts[2] || '').toUpperCase();
    const lonVal = parseFloat(parts[3]);
    const lonDir = (parts[4] || '').toUpperCase();

    if (isNaN(latVal) || isNaN(lonVal)) continue;

    let lat = latVal;
    let lng = lonVal;
    if (latDir === 'S') lat = -lat;
    if (lonDir === 'W') lng = -lng;

    let speed = null;
    let alt = null;

    if (parts.length > 5) {
      const s = parseFloat(parts[5]);
      if (!isNaN(s)) speed = s;
    }

    if (parts.length > 6) {
      const a = parseFloat(parts[6]);
      if (!isNaN(a)) alt = a;
    }

    parsed.push({
      ts: tsRaw,
      time: timeHuman,
      lat,
      lng,
      speed,
      alt
    });
  }
  return parsed;
}

function parseTimestamp(ts) {
  // Expected format: YYYYMMDDHHmmss
  if (!/^\d{14}$/.test(ts)) return ts;

  const y = ts.slice(0, 4);
  const m = ts.slice(4, 6);
  const d = ts.slice(6, 8);
  const hh = ts.slice(8, 10);
  const mm = ts.slice(10, 12);
  const ss = ts.slice(12, 14);

  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}
