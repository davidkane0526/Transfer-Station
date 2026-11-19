const exchangeDate='2026-11-19';
const cfets='https://www.chinamoney.com.cn/chinese/bkccpr/index.html?tab=2';
const taiwanBank='https://rate.bot.com.tw/xrt/quote/2026-11-19/CNY/?Lang=zh-TW';
const exchangeRates=new Map(Object.entries({
  USD:6.7128, SGD:5.1913, EUR:7.3444, HKD:.85563, JPY:.041995, GBP:8.8030,
  AUD:4.4916, CAD:4.6687, CHF:7.9410,
  // Midpoint of the Bank of Taiwan's first spot buy/sell quote (TWD per CNY).
  TWD:1/4.948
}));
const rmb=new Intl.NumberFormat('zh-CN',{style:'currency',currency:'CNY',currencyDisplay:'narrowSymbol'});

export function formatRmb(amount){
  return amount==null?'—':rmb.format(amount);
}

export function displayPrice(quote,quantity){
  const currency=quote?.currency;
  const packSize=quote?.packSize??1;
  const rate=currency==='CNY'?1:exchangeRates.get(currency);
  if(!Number.isFinite(quote?.value)||!rate)return null;
  const packPrice=quote.value*rate;
  return {
    unit:packPrice/packSize,
    subtotal:quantity>0?Number((Math.ceil(quantity/packSize)*packPrice).toFixed(2)):null,
    exchange:currency==='CNY'?null:{date:exchangeDate,rate,source:currency==='TWD'?taiwanBank:cfets}
  };
}

export function priceEvidence(quote,unit='件'){
  if(!quote)return '';
  const packSize=quote.packSize??1;
  const original=quote.currency==='CNY'&&packSize===1?'':
    '原价 '+quote.currency+' '+quote.value.toFixed(2)+' / '+packSize+unit;
  const exchange=displayPrice(quote)?.exchange;
  const rate=exchange?'折算 '+exchange.date+' · 1 '+quote.currency+' = '+Number(exchange.rate.toFixed(6))+' 元':'';
  return [quote.type,quote.date,original,rate].filter(Boolean).join(' · ');
}
