// 無料の計算ツール（Excel版テンプレートへの入口）
// 使い方: node calc.js → docs/c/*.html ができる（gen.js のサイトマップにも入る）
const fs = require("fs");
const path = require("path");

const BASE = "https://yumizeru.github.io/oshirase/";
const SITE = "お知らせ文メーカー";
const BOOTH = "https://yumizeru.booth.pm/items/";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// f: 入力欄 [id, ラベル, 初期値, 単位, ヒント]。type が "select" なら opts、"date" なら日付
const TOOLS = [
  {
    id: "hiwari", name: "家賃の日割り計算",
    title: "家賃の日割り計算ツール｜入居日・退去日から日割り家賃と共益費を自動計算",
    desc: "月の途中で入居・退去したときの家賃と共益費の日割りを計算します。その月の日数・30日・365日の3つの計算方法に対応。登録不要・無料。",
    lead: "月の途中で入居・退去したときの家賃と共益費を、日割りで計算します。計算方法は契約書に合わせて選んでください。",
    fields: [
      ["rent", "月額家賃", 65000, "円"],
      ["fee", "共益費・管理費（月額）", 3000, "円", "ない場合は 0"],
      ["kind", "どちらの日割り？", "in", "", "", "select", [["in", "入居（この日から月末まで）"], ["out", "退去（月初からこの日まで）"]]],
      ["day", "入居日・退去日", "", "", "", "date"],
      ["way", "計算方法", "month", "", "契約書の「日割り」の決まりに合わせる", "select", [["month", "その月の日数で割る"], ["d30", "30日で割る"], ["d365", "年額を365日で割る"]]],
    ],
    js: `
const d = new Date(v.day || new Date()); const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
const dim = new Date(y, m + 1, 0).getDate();
const days = v.kind === "in" ? dim - day + 1 : day;
const per = (x) => v.way === "month" ? x / dim : v.way === "d30" ? x / 30 : x * 12 / 365;
const r = Math.floor(per(+v.rent) * days), f = Math.floor(per(+v.fee) * days);
return [["日割りの日数", days + "日（" + (m + 1) + "月は" + dim + "日まで）"], ["日割り家賃", yen(r)], ["日割り共益費", yen(f)], ["合計", yen(r + f), 1]];`,
    body: `<h2>計算のしかた</h2>
<p>日割り家賃 ＝ 月額家賃 ÷ その月の日数 × 住んだ日数（1円未満は切り捨て）。入居の日割りは入居日から月末まで、退去の日割りは月初から退去日までを数えます。</p>
<p>「30日で割る」「年額を365日で割る」と決めている契約もあります。どれを使うかは賃貸借契約書で確かめてください。</p>
<h2>例</h2>
<p>家賃65,000円の部屋に4月10日から入居する場合、4月は30日なので、65,000 ÷ 30 × 21日 ＝ 45,500円です。</p>`,
    item: { id: "9218077", name: "家賃の入金管理表", price: "680円", text: "入居者ごとの毎月の入金チェック・年間の入金状況・滞納と督促の記録を、1つのExcelで管理できます。" },
  },
  {
    id: "rimawari", name: "不動産の利回り計算",
    title: "不動産の利回り計算ツール｜表面利回り・実質利回りを自動計算",
    desc: "物件価格と家賃収入から、アパート・マンション投資の表面利回りと実質利回りを計算します。経費や購入時の諸費用も入れられます。登録不要・無料。",
    lead: "物件価格と家賃収入から、表面利回りと実質利回りを計算します。",
    fields: [
      ["price", "物件価格", 30000000, "円"],
      ["cost", "購入時の諸費用", 2000000, "円", "仲介手数料・登記費用・不動産取得税など。目安は物件価格の7〜8%"],
      ["rent", "家賃収入（1か月・全室ぶん）", 220000, "円"],
      ["vac", "空室率", 5, "%", "1年のうち空いている割合の見込み"],
      ["exp", "年間の経費", 600000, "円", "管理費・修繕費・固定資産税・保険料など"],
    ],
    js: `
const year = +v.rent * 12, real = year * (1 - (+v.vac) / 100), net = real - (+v.exp);
const gross = year / (+v.price) * 100, netY = net / ((+v.price) + (+v.cost)) * 100;
return [["年間の家賃収入（満室）", yen(year)], ["空室を引いた収入", yen(Math.round(real))], ["経費を引いた手取り（年）", yen(Math.round(net))], ["表面利回り", gross.toFixed(2) + "%"], ["実質利回り", netY.toFixed(2) + "%", 1]];`,
    body: `<h2>計算のしかた</h2>
<p>表面利回り ＝ 満室のときの年間家賃収入 ÷ 物件価格 × 100</p>
<p>実質利回り ＝（空室を引いた年間家賃収入 － 年間の経費）÷（物件価格 ＋ 購入時の諸費用）× 100</p>
<p>広告に出ている利回りは、ほとんどが表面利回りです。経費と空室を入れた実質利回りで比べると、物件の違いが分かりやすくなります。ローンの返済は入れていません。</p>`,
    item: { id: "9218103", name: "大家さんの不動産収支表", price: "580円", text: "月別の収支・物件ごとの収支と利回り・ローン返済の予定表を、Excelでまとめて管理できます。" },
  },
  {
    id: "seikyu", name: "請求書の消費税・源泉徴収の計算",
    title: "請求書の消費税・源泉徴収税額の計算ツール｜税抜・税込・差引請求額を自動計算",
    desc: "請求金額から消費税（10%・8%）と源泉徴収税額（10.21%）、差し引きの請求額を計算します。税抜・税込どちらからでも計算できます。登録不要・無料。",
    lead: "請求金額から、消費税と源泉徴収税額、差し引きで振り込まれる金額を計算します。",
    fields: [
      ["amt", "金額", 100000, "円"],
      ["base", "入れた金額は", "ex", "", "", "select", [["ex", "税抜"], ["in", "税込"]]],
      ["rate", "消費税率", "10", "", "", "select", [["10", "10%"], ["8", "8%（軽減税率）"]]],
      ["wh", "源泉徴収", "yes", "", "原稿料・デザイン料・講演料など、個人への報酬で必要", "select", [["yes", "する"], ["no", "しない"]]],
    ],
    js: `
const r = +v.rate / 100; let ex, tax;
if (v.base === "ex") { ex = +v.amt; tax = Math.floor(ex * r); } else { ex = Math.ceil(+v.amt / (1 + r)); tax = +v.amt - ex; }
const wh = v.wh === "yes" ? Math.floor(ex <= 1000000 ? ex * 0.1021 : (ex - 1000000) * 0.2042 + 102100) : 0;
return [["税抜金額", yen(ex)], ["消費税（" + v.rate + "%）", yen(tax)], ["税込金額", yen(ex + tax)], ["源泉徴収税額", yen(wh)], ["差し引きの請求額", yen(ex + tax - wh), 1]];`,
    body: `<h2>計算のしかた</h2>
<p>消費税 ＝ 税抜金額 × 10%（軽減税率の対象は8%）。1円未満は切り捨てています。</p>
<p>源泉徴収税額 ＝ 税抜金額 × 10.21%（100万円を超える部分は20.42%）。請求書で消費税を分けて書いているときは、税抜金額に対して計算できます。</p>
<p>差し引きの請求額 ＝ 税込金額 － 源泉徴収税額。相手から実際に振り込まれる金額です。</p>
<p>源泉徴収が必要かどうかは、報酬の種類と相手（法人か個人か）で決まります。くわしくは国税庁のホームページや税務署で確かめてください。</p>`,
    item: { id: "9218108", name: "見積書・請求書・納品書・領収書（自動計算）", price: "680円", text: "品目と数量を入れるだけで、小計・消費税・合計が自動で入る見積書・請求書・納品書・領収書です。取引先と品目の台帳つき。" },
  },
  {
    id: "zangyo", name: "残業代の計算",
    title: "残業代の計算ツール｜月給・時給から時間外・深夜・休日の割増賃金を自動計算",
    desc: "月給または時給と残業時間から、時間外（25%）・深夜（25%）・休日（35%）の割増賃金と、月60時間を超えた分（50%）を計算します。登録不要・無料。",
    lead: "月給または時給と、残業した時間から、割増賃金（残業代）の目安を計算します。",
    fields: [
      ["pay", "月給（基本給＋手当）または時給", 250000, "円", "通勤手当・家族手当・住宅手当などは除く"],
      ["type", "入れた金額は", "month", "", "", "select", [["month", "月給"], ["hour", "時給"]]],
      ["std", "1か月の平均所定労働時間", 160, "時間", "月給のときだけ使う。例：1日8時間×年間の勤務日数240日÷12"],
      ["ot", "時間外の残業", 20, "時間"],
      ["night", "そのうち深夜（22時〜5時）", 0, "時間"],
      ["hol", "法定休日の労働", 0, "時間"],
    ],
    js: `
const base = v.type === "month" ? (+v.pay) / (+v.std) : +v.pay;
const ot = +v.ot, o1 = Math.min(ot, 60), o2 = Math.max(ot - 60, 0);
const a = base * 1.25 * o1 + base * 1.5 * o2, b = base * 0.25 * (+v.night), c = base * 1.35 * (+v.hol);
return [["1時間あたりの賃金", yen(Math.round(base))], ["時間外（60時間まで×1.25）", yen(Math.round(base * 1.25 * o1))], ["時間外（60時間超×1.5）", yen(Math.round(base * 1.5 * o2))], ["深夜の上乗せ（×0.25）", yen(Math.round(b))], ["休日（×1.35）", yen(Math.round(c))], ["残業代の合計", yen(Math.round(a + b + c)), 1]];`,
    body: `<h2>計算のしかた</h2>
<p>1時間あたりの賃金 ＝ 月給 ÷ 1か月の平均所定労働時間。通勤手当・家族手当・住宅手当などは入れません。</p>
<p>時間外は25%増し（1.25倍）、月60時間を超えた分は50%増し（1.5倍）、法定休日は35%増し（1.35倍）。22時〜翌5時の深夜は、さらに25%を上乗せします。</p>
<p>ここで出るのは目安です。会社の就業規則や、固定残業代の有無で変わります。くわしくは会社か労働基準監督署に確かめてください。</p>`,
    item: { id: "9218123", name: "勤怠・残業時間の集計表", price: "480円", text: "出勤・退勤の時刻を入れるだけで、勤務時間・残業時間・深夜時間を1か月分自動で集計します。" },
  },
  {
    id: "chokin", name: "貯金シミュレーション",
    title: "貯金シミュレーション｜毎月の貯金額から目標達成までの期間を計算",
    desc: "毎月の貯金額とボーナスからの貯金で、目標の金額が貯まるまでの期間と、1年後・5年後・10年後の貯金額を計算します。登録不要・無料。",
    lead: "毎月の貯金額とボーナスからの貯金で、目標の金額まで何か月かかるかを計算します。",
    fields: [
      ["now", "今の貯金", 300000, "円"],
      ["month", "毎月の貯金額", 30000, "円"],
      ["bonus", "ボーナスからの貯金（1回分）", 100000, "円", "年2回（6月・12月）として計算"],
      ["goal", "目標の金額", 3000000, "円"],
    ],
    js: `
const at = (n) => (+v.now) + (+v.month) * n + (+v.bonus) * Math.floor(n / 6);
let n = 0; while (at(n) < +v.goal && n < 1200) n++;
const span = n >= 1200 ? "100年以上" : Math.floor(n / 12) + "年" + (n % 12) + "か月";
return [["1年後", yen(at(12))], ["5年後", yen(at(60))], ["10年後", yen(at(120))], ["目標までの期間", span, 1]];`,
    body: `<h2>計算のしかた</h2>
<p>毎月の貯金額を積み上げ、ボーナスからの貯金を年2回足して計算しています。利息は入れていません。</p>
<p>貯金を続けるコツは、先に貯金の額を決めて、残りで生活することです。毎月の支出が分かると、無理なく貯められる額が見えてきます。</p>`,
    item: { id: "9218134", name: "家計簿（月別・年間の自動集計）", price: "480円", text: "毎日の収入と支出を入れるだけで、費目ごとの月別・年間の集計と、予算に対して使った割合が自動で分かります。" },
  },
];

const css = `<style>
.calc { display: grid; grid-template-columns: 360px 1fr; gap: 20px; align-items: start; }
.calc .fields select { width: 100%; font-size: 17px; padding: 10px 12px; border: 2px solid var(--line); border-radius: 8px; background: #fff; }
.unit { display: flex; align-items: center; gap: 6px; }
.unit span { white-space: nowrap; }
.unit input, .unit select { flex: 1 1 auto; min-width: 0; }
.calc > * { min-width: 0; }
.result { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; }
.result table { width: 100%; border-collapse: collapse; }
.result th, .result td { padding: 10px 8px; border-bottom: 1px solid var(--line); text-align: left; }
.result td { text-align: right; font-variant-numeric: tabular-nums; font-size: 18px; }
.result tr.main th, .result tr.main td { font-weight: bold; color: var(--navy); font-size: 21px; border-bottom: 0; }
.howto { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 16px; margin-top: 20px; }
.howto h2 { margin-top: 8px; }
@media (max-width: 820px) { .calc { grid-template-columns: 1fr; } }
</style>`;

const head = (title, desc, url, depth) => `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:type" content="website">
<meta property="og:image" content="${BASE}ogp.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${depth}icon.png">
<link rel="stylesheet" href="${depth}style.css">
${css}
</head>
<body>
<header class="site"><a href="${depth}">${SITE}</a><span>お知らせ文と計算ツール（無料）</span></header>
`;

const footer = `<footer class="site">
<p>計算結果は目安です。契約書・就業規則・税務署などで確かめてからお使いください。</p>
<p><a href="../">${SITE}</a>　｜　<a href="./">計算ツールの一覧</a>　｜　<a href="https://yumizeru.booth.pm/">Word・Excelテンプレート（BOOTH）</a>　｜　<a href="https://x.com/jimu_template">X</a></p>
</footer>
</body>
</html>
`;

const field = ([id, label, val, unit, hint, type, opts]) => {
  const input = type === "select"
    ? `<select id="${id}">${opts.map(([v, t]) => `<option value="${v}"${v === val ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`
    : type === "date" ? `<input id="${id}" type="date">`
    : `<input id="${id}" type="number" inputmode="decimal" value="${val}" min="0">`;
  return `<label for="${id}">${esc(label)}</label><div class="unit">${input}${unit ? `<span>${unit}</span>` : ""}</div>${hint ? `<p class="hint">${esc(hint)}</p>` : ""}`;
};

const list = (cur) => `<section class="more"><h2>ほかの計算ツール</h2><ul class="list">${TOOLS.filter((t) => t.id !== cur)
  .map((t) => `<li><a href="${t.id}.html">${esc(t.name)}</a></li>`).join("")}</ul></section>`;

const out = path.join(__dirname, "docs", "c");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

for (const t of TOOLS) {
  const html = head(t.title, t.desc, `${BASE}c/${t.id}.html`, "../") + `<main>
<p class="crumb"><a href="../">${SITE}</a> ＞ <a href="./">計算ツール</a></p>
<h1>${esc(t.name)}<small>登録不要・無料</small></h1>
<p class="lead">${esc(t.lead)}</p>
<div class="calc">
<form class="fields" id="f" onsubmit="return false">${t.fields.map(field).join("\n")}</form>
<div class="result"><table id="r"></table></div>
</div>
<aside class="cta">
<h2>毎月の記録は、Excelでまとめて管理</h2>
<p>「${esc(t.item.name)}」：${esc(t.item.text)}黄色のセルに入れるだけで、計算は自動です。</p>
<p class="cta-links"><a class="btn" href="${BOOTH}${t.item.id}">BOOTHで見る（Excel・${t.item.price}）</a><a class="btn sub" href="${BOOTH}9218710">無料お試し版（Word 4種）</a></p>
</aside>
<section class="howto">${t.body}</section>
${list(t.id)}
</main>
<script>
const yen = (n) => (isFinite(n) ? Math.round(n) : 0).toLocaleString("ja-JP") + "円";
const day = document.getElementById("day");
if (day && !day.value) day.value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
function calc(v) {${t.js}
}
function run() {
  const v = {}; document.querySelectorAll("#f input, #f select").forEach((e) => v[e.id] = e.value);
  let rows; try { rows = calc(v); } catch (e) { rows = [["入力を確かめてください", ""]]; }
  document.getElementById("r").innerHTML = rows.map(([k, x, m]) => '<tr' + (m ? ' class="main"' : '') + '><th>' + k + '</th><td>' + x + '</td></tr>').join("");
}
document.getElementById("f").addEventListener("input", run); run();
</script>
` + footer;
  fs.writeFileSync(path.join(out, `${t.id}.html`), html);
}

const index = head("無料の計算ツール｜家賃の日割り・利回り・消費税と源泉徴収・残業代・貯金", "家賃の日割り、不動産の利回り、請求書の消費税と源泉徴収、残業代、貯金シミュレーションを無料で計算できます。登録不要。", `${BASE}c/`, "../") + `<main>
<p class="crumb"><a href="../">${SITE}</a> ＞ 計算ツール</p>
<h1>無料の計算ツール<small>登録不要・入れるだけで自動計算</small></h1>
<p class="lead">賃貸管理・事務・家計でよく使う計算をまとめました。</p>
<section class="group"><ul class="list">${TOOLS.map((t) => `<li><a href="${t.id}.html">${esc(t.name)}</a></li>`).join("")}</ul></section>
<aside class="cta">
<h2>Excelの管理表もあります</h2>
<p>家賃の入金管理、請求書、勤怠、家計簿など、黄色のセルに入れるだけで計算されるExcelテンプレートを販売しています。</p>
<p class="cta-links"><a class="btn" href="https://yumizeru.booth.pm/">BOOTHのショップを見る</a><a class="btn sub" href="${BOOTH}9218710">無料お試し版（Word 4種）</a></p>
</aside>
</main>
` + footer;
fs.writeFileSync(path.join(out, "index.html"), index);
console.log(`${TOOLS.length} tools`);
module.exports = { TOOLS };
