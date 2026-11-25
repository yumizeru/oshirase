// お知らせ文メーカー: template-shop の文面から静的ページを作る
// 使い方: node gen.js → docs/ に index.html と d/*.html ができる
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "template-shop");
const BASE = "https://yumizeru.github.io/oshirase/";
const SITE = "お知らせ文メーカー";
const NOTE = "https://note.com/yumizeru_friday/n/";
const BOOTH = "https://yumizeru.booth.pm/items/";
// 載せる組（BOOTHの商品番号・noteの記事）
const SETS = [
  { n: 1, booth: 9215340, note: "n82256f82eaec" },
  { n: 3, booth: 9215678, note: "n641ae146abde" },
  { n: 6, booth: 9216480, note: "nc217420557d9" },
  { n: 2, booth: 9215351, note: "n337af1983bec" },
  { n: 4, booth: 9216243, note: "nb7e21c05c89b" },
];
const PRICE = "780円";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const plain = (s) => s.replace(/[【】]/g, "");

// 1文書をブロックの並びにする（build.js と同じ順番・同じ既定値）
function blocks(t, conf) {
  const b = [];
  const add = (k, s) => b.push({ k, s });
  if (t.date !== false) add("right", "【発行日】");
  const to = t.to || conf.to;
  const toLines = t.toLines || conf.toLines;
  if (toLines) toLines.forEach((l) => add("left", l));
  else if (to === "individual") { add("left", "【物件名】　【〇〇〇】号室"); add("left", "【〇〇 〇〇】様"); }
  else { add("left", "【物件名】"); add("left", "入居者各位"); }
  (t.fromLines || conf.fromLines || ["【管理会社名】", "【担当部署】"]).forEach((l) => add("right", l));
  add("title", t.title);
  const g = t.greeting !== undefined ? t.greeting : (conf.greeting ?? "平素より当物件の管理にご理解とご協力をいただき、誠にありがとうございます。");
  if (g) add("p", g);
  t.body.forEach((s) => add("p", s));
  if (t.ki) { add("center", "記"); t.ki.forEach((kv) => b.push({ k: "ki", s: kv })); }
  if (t.listTitle) add("listTitle", t.listTitle);
  (t.list || []).forEach((s) => add("li", s));
  (t.after || []).forEach((s) => add(s === "敬具" ? "right" : "p", s));
  if (t.end !== false && conf.end !== false) add("right", "以上");
  const contact = t.contact !== undefined ? t.contact : conf.contact !== undefined ? conf.contact : [
    "お問い合わせ先", "【管理会社名】　担当：【担当者名】", "電話：【000-0000-0000】（受付時間：【平日 9:00～18:00】）",
  ];
  (contact || []).forEach((s) => add("contact", s));
  return b;
}

// 検索結果に出す説明文（本文の最初の文から作る）
function summary(t) {
  const first = plain(t.body[0] || "").split("。")[0];
  return first.length > 70 ? first.slice(0, 70) + "…" : first + "。";
}

const docs = [];
for (const s of SETS) {
  const conf = require(path.join(SRC, s.n === 1 ? "templates.js" : `templates${s.n}.js`));
  conf.items.forEach((t, i) => {
    docs.push({
      slug: `s${s.n}-${String(i + 1).padStart(2, "0")}`,
      title: plain(t.title), set: conf.name, setN: s.n, booth: s.booth, note: s.note,
      desc: summary(t), blocks: blocks(t, conf),
    });
  });
}

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
</head>
<body>
<header class="site"><a href="${depth}">${SITE}</a><span>賃貸管理のお知らせ・貼り紙を無料で作成</span></header>
`;

const footer = (depth) => `<footer class="site">
<p>文面は自由にお使いいただけます（登録不要・無料）。内容は物件の契約やルールに合わせてご確認ください。</p>
<p><a href="${depth}">${SITE}</a>　｜　<a href="https://yumizeru.booth.pm/">Word版テンプレート（BOOTH）</a>　｜　<a href="https://note.com/yumizeru_friday">書き方のコツ（note）</a>　｜　<a href="https://x.com/jimu_template">X</a></p>
</footer>
</body>
</html>
`;

const cta = (d) => `<aside class="cta">
<h2>Word版なら、ロゴや表も自由に直せます</h2>
<p>「${esc(d.set)}」10種を、そのまま編集できるWordファイル（A4・1ページ）にまとめました。差し替える箇所は黄色で分かるようにしてあります。</p>
<p class="cta-links"><a class="btn" href="${BOOTH}${d.booth}">BOOTHで見る（10種 ${PRICE}）</a><a class="btn sub" href="${NOTE}${d.note}">noteで見る</a></p>
</aside>`;

const out = path.join(__dirname, "docs");
fs.mkdirSync(path.join(out, "d"), { recursive: true });

// 文書ページ
for (const d of docs) {
  const url = `${BASE}d/${d.slug}.html`;
  const title = `${d.title}の文例・テンプレート（無料で作成・印刷）｜${SITE}`;
  const desc = `「${d.title}」の文例です。空欄を埋めるだけで、そのまま印刷できるお知らせ文ができます。登録不要・無料。${d.desc}`;
  const same = docs.filter((x) => x.setN === d.setN && x !== d);
  const html = head(title, desc, url, "../") + `<main>
<nav class="crumb"><a href="../">トップ</a> ＞ ${esc(d.set)}</nav>
<h1>${esc(d.title)}<small>の文例・テンプレート</small></h1>
<p class="lead">入力欄を埋めると、文面に入ります。黄色の部分はまだ書き換えていない箇所です。できたら「印刷する」か「文章をコピー」を押してください。</p>
<div class="app">
  <form class="fields" id="fields" autocomplete="off"></form>
  <div class="preview">
    <div class="tools">
      <span id="left"></span>
      <button type="button" id="print">印刷する</button>
      <button type="button" id="copy" class="sub">文章をコピー</button>
    </div>
    <article class="paper" id="paper"></article>
  </div>
</div>
${cta(d)}
<section class="more">
<h2>同じ分類のお知らせ文</h2>
<ul class="list">${same.map((x) => `<li><a href="${x.slug}.html">${esc(x.title)}</a></li>`).join("")}</ul>
<p><a href="../">すべてのお知らせ文を見る</a></p>
</section>
</main>
<script>window.DOC=${json({ title: d.title, blocks: d.blocks })}</script>
<script src="../app.js"></script>
` + footer("../");
  fs.writeFileSync(path.join(out, "d", `${d.slug}.html`), html);
}

// トップページ
const groups = SETS.map((s) => docs.filter((d) => d.setN === s.n));
const index = head(`${SITE}｜賃貸管理のお知らせ文・貼り紙を無料で作成・印刷`,
  `騒音・ゴミ出し・断水・点検・家賃のお願いなど、賃貸管理でよく使うお知らせ文${docs.length}種。空欄を埋めるだけで、そのまま印刷できます。登録不要・無料。`,
  BASE, "") + `<main>
<h1>${SITE}<small>賃貸管理のお知らせ文・貼り紙</small></h1>
<p class="lead">入居者向けの貼り紙や、個別のお願い文を${docs.length}種用意しました。使いたい文書を選んで、物件名や日付を入れるだけで、A4で印刷できます。登録は不要です。</p>
<input type="search" id="q" class="search" placeholder="キーワードで探す（例：騒音、断水、更新）">
${groups.map((g) => `<section class="group">
<h2>${esc(g[0].set)}</h2>
<ul class="list">${g.map((d) => `<li><a href="d/${d.slug}.html">${esc(d.title)}</a></li>`).join("")}</ul>
</section>`).join("\n")}
<p class="none" id="none" hidden>見つかりませんでした。別の言葉で探してください。</p>
<aside class="cta">
<h2>Word版テンプレートもあります</h2>
<p>ここにある文面は、すべて編集できるWordファイル（A4・1ページ）でも販売しています。ロゴを入れたり、表を足したりしたいときはこちらをどうぞ。</p>
<p class="cta-links"><a class="btn" href="https://yumizeru.booth.pm/">BOOTHのショップを見る</a><a class="btn sub" href="https://note.com/yumizeru_friday">noteで書き方のコツを読む</a></p>
</aside>
</main>
<script>
(function(){var q=document.getElementById("q");q.addEventListener("input",function(){var v=q.value.trim(),any=false;
document.querySelectorAll(".group").forEach(function(g){var n=0;g.querySelectorAll("li").forEach(function(li){var ok=!v||li.textContent.indexOf(v)>=0;li.hidden=!ok;if(ok)n++;});g.hidden=n===0;if(n)any=true;});
document.getElementById("none").hidden=any;});})();
</script>
` + footer("");
fs.writeFileSync(path.join(out, "index.html"), index);

// サイトマップ
const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${BASE}</loc><lastmod>${today}</lastmod></url>
${docs.map((d) => `<url><loc>${BASE}d/${d.slug}.html</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`${docs.length} pages`);
