const YAHOO_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

async function test() {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/SPMD.CA?range=1y&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": YAHOO_UA, Accept: "application/json" }
  });
  console.log(res.status);
  const json = await res.text();
  console.log(json.substring(0, 200));
}

test();
