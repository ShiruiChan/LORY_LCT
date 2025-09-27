// self.onmessage получает состояние и считает доход/проценты без блокировки UI
self.onmessage = (e: MessageEvent) => {
  const { buildings, investments, dtMs } = e.data;
  let coinsDelta = 0;

  // доход от зданий
  for (const b of buildings) coinsDelta += (b.incomePerHour / 3600_000) * dtMs;

  // проценты по инвестициям
  for (const inv of investments) coinsDelta += (inv.amount * inv.roiYearly / (365*24*3600_000)) * dtMs;

  // округляем до копеек
  coinsDelta = Math.floor(coinsDelta * 100) / 100;
  // @ts-ignore
  postMessage({ coinsDelta });
};
