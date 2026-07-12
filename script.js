/* ---------- date/number helpers ---------- */

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const isLeapYear = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const WEEKDAY_JA = ["日", "月", "火", "水", "木", "金", "土"];

/* ---------- Japanese era (和暦) ---------- */

const ERAS = [
  { name: "令和", kana: "れいわ", start: new Date(2019, 4, 1) },
  { name: "平成", kana: "へいせい", start: new Date(1989, 0, 8) },
  { name: "昭和", kana: "しょうわ", start: new Date(1926, 11, 25) },
];

function getEra(date) {
  const era = ERAS.find((e) => date >= e.start);
  if (!era) return null;
  const year = date.getFullYear() - era.start.getFullYear() + 1;
  return { name: era.name, year, label: year === 1 ? `${era.name}元年` : `${era.name}${year}年` };
}

/* ---------- Chinese zodiac (干支) ---------- */

const ZODIAC = ["子(ねずみ)", "丑(うし)", "寅(とら)", "卯(うさぎ)", "辰(たつ)", "巳(へび)", "午(うま)", "未(ひつじ)", "申(さる)", "酉(とり)", "戌(いぬ)", "亥(いのしし)"];
function getZodiac(year) {
  return ZODIAC[((year - 4) % 12 + 12) % 12];
}

/* ---------- Western zodiac (星座) ---------- */

const WESTERN_ZODIAC = [
  { name: "山羊座", from: [12, 22], to: [1, 19] },
  { name: "水瓶座", from: [1, 20], to: [2, 18] },
  { name: "魚座", from: [2, 19], to: [3, 20] },
  { name: "牡羊座", from: [3, 21], to: [4, 19] },
  { name: "牡牛座", from: [4, 20], to: [5, 20] },
  { name: "双子座", from: [5, 21], to: [6, 21] },
  { name: "蟹座", from: [6, 22], to: [7, 22] },
  { name: "獅子座", from: [7, 23], to: [8, 22] },
  { name: "乙女座", from: [8, 23], to: [9, 22] },
  { name: "天秤座", from: [9, 23], to: [10, 23] },
  { name: "蠍座", from: [10, 24], to: [11, 22] },
  { name: "射手座", from: [11, 23], to: [12, 21] },
];
function getWesternZodiac(month, day) {
  const z = WESTERN_ZODIAC.find((z) => {
    const [fm, fd] = z.from, [tm, td] = z.to;
    if (fm === tm) return month === fm && day >= fd && day <= td;
    if (fm > tm) return (month === fm && day >= fd) || (month === tm && day <= td);
    return (month === fm && day >= fd) || (month === tm && day <= td) || (month > fm && month < tm);
  });
  return z ? z.name : "-";
}

/* ---------- season / quarter ---------- */

function getSeason(month) {
  if ([3, 4, 5].includes(month)) return "春";
  if ([6, 7, 8].includes(month)) return "夏";
  if ([9, 10, 11].includes(month)) return "秋";
  return "冬";
}
const getQuarter = (month) => Math.floor((month - 1) / 3) + 1;

/* ---------- day-of-year / ISO week ---------- */

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/* ---------- moon phase ---------- */

const SYNODIC_MONTH = 29.530588853;
const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

function getMoonAge(date) {
  const diffDays = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  let age = diffDays % SYNODIC_MONTH;
  if (age < 0) age += SYNODIC_MONTH;
  return age;
}

function getMoonPhase(age) {
  const ratio = age / SYNODIC_MONTH;
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * ratio)) / 2 * 100);
  let name, emoji;
  if (ratio < 0.03 || ratio > 0.97) { name = "新月"; emoji = "🌑"; }
  else if (ratio < 0.22) { name = "三日月"; emoji = "🌒"; }
  else if (ratio < 0.28) { name = "上弦の月"; emoji = "🌓"; }
  else if (ratio < 0.47) { name = "十三夜月"; emoji = "🌔"; }
  else if (ratio < 0.53) { name = "満月"; emoji = "🌕"; }
  else if (ratio < 0.72) { name = "十六夜月"; emoji = "🌖"; }
  else if (ratio < 0.78) { name = "下弦の月"; emoji = "🌗"; }
  else { name = "有明の月"; emoji = "🌘"; }
  return { name, emoji, illumination };
}

/* ---------- sunrise / sunset (astronomical approximation) ---------- */

function getSunTimes(date, lat, lon) {
  const rad = Math.PI / 180;
  const dayMs = 86400000;
  const J1970 = 2440588, J2000 = 2451545;
  const toJulian = (d) => d.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
  const toDays = (d) => toJulian(d) - J2000;

  const e = rad * 23.4397;
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) => {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const P = rad * 102.9372;
    return M + C + P + Math.PI;
  };
  const declination = (l) => Math.asin(Math.sin(l) * Math.sin(e));
  const julianCycle = (d, lw) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => 0.0009 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

  const lw = rad * -lon, phi = rad * lat;
  const d = toDays(date);
  const n = julianCycle(d, lw);
  const ds = approxTransit(0, lw, n);
  const M = solarMeanAnomaly(ds);
  const L = eclipticLongitude(M);
  const dec = declination(L);
  const Jnoon = solarTransitJ(ds, M, L);

  const h0 = rad * -0.833;
  const w = hourAngle(h0, phi, dec);
  if (Number.isNaN(w)) return null; // polar day/night
  const a = approxTransit(w, lw, n);
  const Jset = solarTransitJ(a, M, L);
  const Jrise = Jnoon - (Jset - Jnoon);

  return { sunrise: fromJulian(Jrise), sunset: fromJulian(Jset), solarNoon: fromJulian(Jnoon) };
}

/* ---------- Japanese national holidays ---------- */

function nthWeekday(year, month, weekday, n) {
  const first = new Date(year, month - 1, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, month - 1, 1 + offset + (n - 1) * 7);
}

function getEquinoxDay(year, type) {
  let day;
  if (type === "spring") {
    day = year <= 1979
      ? 19.8277 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)
      : 20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4);
  } else {
    day = year <= 1979
      ? 22.2588 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)
      : 23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4);
  }
  return Math.floor(day);
}

function getJapaneseHolidays(year) {
  const list = [];
  const add = (m, d, name) => list.push({ date: new Date(year, m - 1, d), name });

  add(1, 1, "元日");
  if (year >= 2000) list.push({ date: nthWeekday(year, 1, 1, 2), name: "成人の日" });
  else if (year >= 1948) add(1, 15, "成人の日");

  if (year >= 1967) add(2, 11, "建国記念の日");
  if (year >= 2020) add(2, 23, "天皇誕生日");

  add(3, getEquinoxDay(year, "spring"), "春分の日");

  if (year >= 2007) add(4, 29, "昭和の日");
  else if (year >= 1989) add(4, 29, "みどりの日");

  if (year >= 1948) add(5, 3, "憲法記念日");
  if (year >= 2007) add(5, 4, "みどりの日");
  if (year >= 1948) add(5, 5, "こどもの日");

  if (year >= 2003) list.push({ date: nthWeekday(year, 7, 1, 3), name: "海の日" });
  else if (year >= 1996) add(7, 20, "海の日");

  if (year >= 2016) add(8, 11, "山の日");

  if (year >= 2003) list.push({ date: nthWeekday(year, 9, 1, 3), name: "敬老の日" });
  else if (year >= 1966) add(9, 15, "敬老の日");

  add(9, getEquinoxDay(year, "autumn"), "秋分の日");

  if (year >= 2020) list.push({ date: nthWeekday(year, 10, 1, 2), name: "スポーツの日" });
  else if (year >= 2000) list.push({ date: nthWeekday(year, 10, 1, 2), name: "体育の日" });
  else if (year >= 1966) add(10, 10, "体育の日");

  if (year >= 1948) add(11, 3, "文化の日");
  if (year >= 1948) add(11, 23, "勤労感謝の日");

  list.sort((a, b) => a.date - b.date);

  // 振替休日: holiday on Sunday -> next non-holiday weekday becomes a holiday
  const holidaySet = new Set(list.map((h) => dateKey(h.date)));
  const substitutes = [];
  list.forEach((h) => {
    if (h.date.getDay() === 0) {
      const next = new Date(h.date);
      do { next.setDate(next.getDate() + 1); } while (holidaySet.has(dateKey(next)));
      substitutes.push({ date: next, name: "振替休日" });
      holidaySet.add(dateKey(next));
    }
  });
  list.push(...substitutes);

  // 国民の休日: a weekday sandwiched between two holidays
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const key = dateKey(d);
    if (holidaySet.has(key) || d.getDay() === 0) continue;
    const prev = new Date(d); prev.setDate(prev.getDate() - 1);
    const next = new Date(d); next.setDate(next.getDate() + 1);
    if (holidaySet.has(dateKey(prev)) && holidaySet.has(dateKey(next))) {
      list.push({ date: new Date(d), name: "国民の休日" });
      holidaySet.add(key);
    }
  }

  list.sort((a, b) => a.date - b.date);
  return list;
}

/* ---------- rendering ---------- */

function row(dt, dd, sub) {
  return `<dt>${dt}</dt><dd>${dd}${sub ? `<span class="sub">${sub}</span>` : ""}</dd>`;
}

function renderClock(now) {
  document.getElementById("clock").textContent =
    `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  document.getElementById("dateLine").textContent =
    `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日(${WEEKDAY_JA[now.getDay()]})`;

  const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const dayPct = (secondsToday / 86400) * 100;
  document.getElementById("dayProgressFill").style.width = `${dayPct}%`;
  document.getElementById("dayProgressLabel").textContent = `今日の経過 ${dayPct.toFixed(1)}%（残り ${formatDuration(86400 - secondsToday)}）`;
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}時間${m}分`;
}

function renderBasicInfo(now) {
  const year = now.getFullYear(), month = now.getMonth() + 1, day = now.getDate();
  const era = getEra(now);
  const html = [
    row("曜日", `${WEEKDAY_JA[now.getDay()]}曜日`),
    row("和暦", era ? era.label : "-", "元号"),
    row("干支(年)", getZodiac(year), `${year}年`),
    row("星座", getWesternZodiac(month, day)),
    row("季節", getSeason(month), "気象学的な区分"),
    row("四半期", `第${getQuarter(month)}四半期`, `Q${getQuarter(month)}`),
    row("うるう年", isLeapYear(year) ? "はい 🌟" : "いいえ", `${year}年`),
  ].join("");
  document.getElementById("basicInfo").innerHTML = html;
}

function renderCalendarInfo(now) {
  const year = now.getFullYear();
  const dayOfYear = getDayOfYear(now);
  const totalDays = isLeapYear(year) ? 366 : 365;
  const remaining = totalDays - dayOfYear;
  const yearPct = (dayOfYear / totalDays) * 100;

  const html = [
    row("年始からの日数", `${dayOfYear}日目`, `全${totalDays}日中`),
    row("年末までの残り", `あと${remaining}日`),
    row("ISO週番号", `第${getISOWeek(now)}週`),
    row("UNIXタイムスタンプ", `${Math.floor(now.getTime() / 1000)}`, "秒"),
    row("ISO 8601", now.toISOString().slice(0, 19) + "Z"),
    row("タイムゾーン", Intl.DateTimeFormat().resolvedOptions().timeZone, `UTC${formatTzOffset(now)}`),
  ].join("");
  document.getElementById("calendarInfo").innerHTML = html;

  document.getElementById("yearProgressFill").style.width = `${yearPct}%`;
  document.getElementById("yearProgressLabel").textContent = `今年の経過 ${yearPct.toFixed(2)}%`;
}

function formatTzOffset(now) {
  const offsetMin = -now.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function renderAstroInfo(now, coords) {
  const age = getMoonAge(now);
  const phase = getMoonPhase(age);
  const sun = getSunTimes(now, coords.lat, coords.lon);

  const rows = [
    row("月齢", age.toFixed(1)),
    row("月相", `${phase.emoji} ${phase.name}`, `輝面比 約${phase.illumination}%`),
  ];

  if (sun) {
    const dayLenMs = sun.sunset - sun.sunrise;
    const dayLenH = Math.floor(dayLenMs / 3600000);
    const dayLenM = Math.floor((dayLenMs % 3600000) / 60000);
    rows.push(row("日の出", sun.sunrise.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })));
    rows.push(row("日の入り", sun.sunset.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })));
    rows.push(row("南中時刻", sun.solarNoon.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })));
    rows.push(row("昼の長さ", `${dayLenH}時間${dayLenM}分`));
  }

  document.getElementById("astroInfo").innerHTML = rows.join("");
  document.getElementById("locationHint").textContent = coords.isDefault
    ? "※ 位置情報が取得できないため東京の座標で概算しています"
    : `※ 現在地(緯度${coords.lat.toFixed(2)}, 経度${coords.lon.toFixed(2)})で計算しています`;
}

function renderHolidayInfo(now) {
  const year = now.getFullYear();
  const holidays = getJapaneseHolidays(year);
  const todayKey = dateKey(now);
  const today = holidays.find((h) => dateKey(h.date) === todayKey);

  let html;
  if (today) {
    html = row("今日", `<span class="badge">${today.name}</span>`, "国民の祝日です");
  } else {
    const next = holidays
      .concat(getJapaneseHolidays(year + 1))
      .find((h) => h.date > now);
    const diffDays = Math.ceil((stripTime(next.date) - stripTime(now)) / 86400000);
    html = row("今日", `<span class="badge muted">平日 / 通常日</span>`) +
      row("次の祝日", `${next.name}`, `${next.date.getMonth() + 1}月${next.date.getDate()}日（あと${diffDays}日）`);
  }
  document.getElementById("holidayInfo").innerHTML = html;

  document.getElementById("holidayListYear").textContent = year;
  document.getElementById("holidayList").innerHTML = holidays.map((h) => {
    const isToday = dateKey(h.date) === todayKey;
    return `<li class="${isToday ? "today" : ""}"><span>${h.name}</span><span class="h-date">${h.date.getMonth() + 1}/${h.date.getDate()}(${WEEKDAY_JA[h.date.getDay()]})</span></li>`;
  }).join("");
}

const stripTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/* ---------- init ---------- */

const TOKYO = { lat: 35.6812, lon: 139.7671, isDefault: true };
let coords = TOKYO;

function renderAll() {
  const now = new Date();
  renderClock(now);
  renderBasicInfo(now);
  renderCalendarInfo(now);
  renderAstroInfo(now, coords);
  renderHolidayInfo(now);
}

function tick() {
  const now = new Date();
  renderClock(now);
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  setInterval(tick, 1000);
  setInterval(renderAll, 60000); // refresh slower-changing info every minute

  document.getElementById("holidayListToggle").addEventListener("click", () => {
    document.querySelector(".card.wide").classList.toggle("collapsed");
  });

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, isDefault: false };
        renderAll();
      },
      () => { /* keep default Tokyo coords */ },
      { timeout: 5000 }
    );
  }
});
