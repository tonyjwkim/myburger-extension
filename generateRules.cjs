const fs = require("fs");

const urlsToBlock = [
  "*://*.doubleclick.net/*",
  "*://*.doubleclick.net/*",
  "*://*.googleadservices.com/*",
  "*://*.googleadsyndication.com/*",
  "*://*.ad.daum.net/*",
  "*://*.amazon-adsystem.com/*",
  "*://adcr.naver.com/*",
  "*://*.dable.io/*",
  "*://*.taboola.com/*",
  "*://*.mobon.net/*",
  "*://www.mediacategory.com/*",
  "*://*.adteip.net/*",
  "*://*.targetpush.co.kr/*",
  "*://*.mtgroup.kr/*",
  "*://*.interworksmedia.co.kr/*",
  "*://*.adpnut.com/*",
  "*://*.innorame.com/*",
  "*://*.imadrep.co.kr/*",
  "*://*.adinc.kr/*",
  "*://*.popin.*/*",
  "*://cdn.mediatoday.co.kr/bannerpop/uploads/*",
  "*://cdn.flashtalking.com/*",
  "*://*.realclick.co.kr/*",
  "*://white.contentsfeed.com/*",
  "*://ad.about.co.kr/*",
  "*://g.tivan.naver.com/*",
  "*://g.tivan.naver.com/gfa/*",
  "*://siape.veta.naver.com/*",
  "*://ffbbs.sportschosun.com/*",
  "*://adv.khan.co.kr/*",
  "*://ads.mncmedia.co.kr/*",
  "*://ad.adinc.kr/*",
  "*://tr.ad.daum.net/*",
  "*://click.clickmon.co.kr",
  "*://zicf.inven.co.kr/*",
  "*://kf.isplus.com/*",
  "*://news.naver.com/aside*",
];

const rules = urlsToBlock.map((url, index) => ({
  id: index + 1,
  priority: 1,
  action: { type: "block" },
  condition: { urlFilter: url },
}));

fs.writeFileSync("rules.json", JSON.stringify(rules, null, 2));
