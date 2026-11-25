// お知らせ文メーカー: template-shop の文面から静的ページを作る
// 使い方: node gen.js → docs/ に index.html・g/*.html・d/*.html ができる
// 文章型の文書だけを載せる（表が主役のシートは載せない）
const fs = require("fs");
const path = require("path");

const SRC = path.join(__dirname, "..", "template-shop");
const BASE = "https://yumizeru.github.io/oshirase/";
const SITE = "お知らせ文メーカー";
const NOTE = "https://note.com/yumizeru_friday/n/";
const BOOTH = "https://yumizeru.booth.pm/items/";
const TAGLINE = "お知らせ文・案内文を無料で作成・印刷";

// ジャンル（並び順もこのとおり）
const GENRES = [
  { id: "chintai", name: "賃貸管理・マンション", sets: [1, 3, 6, 2, 4, 5, 9, 7] },
  { id: "chiiki", name: "町内会・PTA・学校・習い事", sets: [8, 126, 127, 10, 109, 21, 20, 81, 82, 36, 128, 136] },
  { id: "shanai", name: "会社・職場の事務", sets: [15, 61, 62, 47, 45, 46, 16, 18, 57, 58, 59, 60, 31, 43, 51, 70, 150] },
  { id: "mise", name: "お店・医院・お客様・取引先", sets: [13, 76, 14, 23, 134, 22, 84, 135, 137, 30, 17, 69, 77, 12, 19, 35] },
  { id: "kurashi", name: "あいさつ状・冠婚葬祭", sets: [29, 89, 90, 91, 92, 93, 94, 95, 145] },
];

// BOOTHの商品番号と、公開済みのnote記事（QUEUE.md・booth_ids.txt から読む）
function links() {
  const m = {};
  const put = (n, k, v) => { (m[n] = m[n] || {})[k] = v; };
  for (const l of fs.readFileSync(path.join(SRC, "QUEUE.md"), "utf8").split(/\r?\n/)) {
    const n = l.match(/^- \[(.)\] (?:第)?0*(\d+)/);
    const b = l.match(/booth\.pm\/items\/(\d+)/);
    if (!n || !b) continue;
    put(+n[2], "booth", +b[1]);
    const nt = l.match(/note\.com\/yumizeru_friday\/n\/(n[0-9a-f]+)/);
    if (n[1] === "x" && nt) put(+n[2], "note", nt[1]);
  }
  for (const l of fs.readFileSync(path.join(SRC, "booth_ids.txt"), "utf8").trim().split(/\r?\n/)) {
    const [n, id] = l.trim().split(/\s+/);
    if (!(m[n] && m[n].booth)) put(+n, "booth", +id);
  }
  // QUEUE.md に書式どおりの行がない組
  put(1, "booth", 9215340); put(1, "note", "n82256f82eaec");
  put(2, "booth", 9215351); put(2, "note", "n337af1983bec");
  return m;
}

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
  else if (to === "owner") add("left", "【オーナー名】様");
  else if (to === "applicant") add("left", "【〇〇 〇〇】様");
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
  if (t.sheetAfter) {
    const tb = t.sheetAfter;
    const cols = tb.cols.map(([c]) => c);
    const rows = Array.isArray(tb.rows) ? tb.rows.map((r) => cols.map((_, i) => String(r[i] || ""))) : Array.from({ length: tb.rows }, () => cols.map(() => ""));
    b.push({ k: "table", s: cols, rows, w: tb.cols.map(([, w]) => w || 1) });
  }
  if (t.end !== false && conf.end !== false) add("right", "以上");
  const contact = t.contact !== undefined ? t.contact : conf.contact !== undefined ? conf.contact : [
    "お問い合わせ先", "【管理会社名】　担当：【担当者名】", "電話：【000-0000-0000】（受付時間：【平日 9:00～18:00】）",
  ];
  (contact || []).forEach((s) => add("contact", s));
  return b;
}

// 検索結果に出す説明文（本文の最初の文から作る）
function summary(t) {
  const first = plain(t.body[0] || t.title).split("。")[0];
  return first.length > 70 ? first.slice(0, 70) + "…" : first + "。";
}

const L = links();
const docs = [];
const sets = [];
for (const g of GENRES) {
  for (const n of g.sets) {
    const conf = require(path.join(SRC, n === 1 ? "templates.js" : `templates${n}.js`));
    const lk = L[n] || {};
    if (!lk.booth) throw new Error(`BOOTHの商品番号がない: 第${n}弾`);
    const set = {
      n, name: conf.name, genre: g, booth: lk.booth, note: lk.note,
      count: conf.items.length, price: conf.items.length >= 10 ? "780円" : "480円", docs: [],
    };
    // 個別の入居者あての組は、名前の欄を「入居者のお名前」と出す
    const names = ["individual", "applicant"].includes(conf.to) ? { "〇〇 〇〇": conf.to === "applicant" ? "お申込者のお名前" : "入居者のお名前" } : {};
    conf.items.forEach((t, i) => {
      if (t.sheet) return;
      const d = {
        slug: `s${n}-${String(i + 1).padStart(2, "0")}`, title: plain(t.title), set,
        desc: summary(t), blocks: blocks(t, conf), names,
      };
      set.docs.push(d);
      docs.push(d);
    });
    if (set.docs.length) sets.push(set);
  }
}
// 文章型の文書がある組を、どのジャンルにも入れ忘れていないか
for (let n = 1; n <= 150; n++) {
  const conf = require(path.join(SRC, n === 1 ? "templates.js" : `templates${n}.js`));
  if (conf.items.some((t) => !t.sheet) && !sets.some((s) => s.n === n)) throw new Error(`ジャンル未設定: 第${n}弾 ${conf.name}`);
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
<header class="site"><a href="${depth}">${SITE}</a><span>${TAGLINE}</span></header>
`;

const footer = (depth) => `<footer class="site">
<p>文面は自由にお使いいただけます（登録不要・無料）。内容は、契約や会則・社内のルールに合わせてご確認ください。</p>
<p><a href="${depth}">${SITE}</a>　｜　<a href="${depth}c/">計算ツール</a>　｜　<a href="https://yumizeru.booth.pm/items/9218710">無料お試し版</a>　｜　<a href="https://yumizeru.booth.pm/">Word版テンプレート（BOOTH）</a>　｜　<a href="https://note.com/yumizeru_friday">書き方のコツ（note）</a>　｜　<a href="https://x.com/jimu_template">X</a></p>
</footer>
</body>
</html>
`;

const cta = (s) => `<aside class="cta">
<h2>Word版なら、ロゴや表も自由に直せます</h2>
<p>「${esc(s.name)}」${s.count}種を、そのまま編集できるWordファイル（A4・1ページ）にまとめました。差し替える箇所は黄色で分かるようにしてあります。</p>
<p class="cta-links"><a class="btn" href="${BOOTH}${s.booth}">BOOTHで見る（${s.count}種 ${s.price}）</a>${s.note ? `<a class="btn sub" href="${NOTE}${s.note}">noteで見る</a>` : ""}</p>
</aside>`;

// 組ごとの一覧（トップとジャンルのページで使う）
const setList = (s, pre, tag) => `<section class="group">
<${tag}>${esc(s.name)}</${tag}>
<ul class="list">${s.docs.map((d) => `<li><a href="${pre}${d.slug}.html">${esc(d.title)}</a></li>`).join("")}</ul>
</section>`;

const out = path.join(__dirname, "docs");
fs.rmSync(path.join(out, "d"), { recursive: true, force: true });
fs.rmSync(path.join(out, "g"), { recursive: true, force: true });
fs.mkdirSync(path.join(out, "d"), { recursive: true });
fs.mkdirSync(path.join(out, "g"), { recursive: true });

// 文書ページ
for (const d of docs) {
  const s = d.set;
  const url = `${BASE}d/${d.slug}.html`;
  const title = `${d.title}の文例・テンプレート（無料で作成・印刷）｜${SITE}`;
  const desc = `「${d.title}」の文例です。空欄を埋めるだけで、そのまま印刷できる文書ができます。登録不要・無料。${d.desc}`;
  const same = s.docs.filter((x) => x !== d);
  const html = head(title, desc, url, "../") + `<main>
<nav class="crumb"><a href="../">トップ</a> ＞ <a href="../g/${s.genre.id}.html">${esc(s.genre.name)}</a> ＞ ${esc(s.name)}</nav>
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
${cta(s)}
${same.length ? `<section class="more">
<h2>同じ分類の文書（${esc(s.name)}）</h2>
<ul class="list">${same.map((x) => `<li><a href="${x.slug}.html">${esc(x.title)}</a></li>`).join("")}</ul>
<p><a href="../g/${s.genre.id}.html">${esc(s.genre.name)}の文書をすべて見る</a></p>
</section>` : ""}
</main>
<script>window.DOC=${json({ set: s.n, names: d.names, blocks: d.blocks })}</script>
<script src="../app.js"></script>
` + footer("../");
  fs.writeFileSync(path.join(out, "d", `${d.slug}.html`), html);
}

// 検索（トップとジャンルのページ）
const searchBox = (ph) => `<input type="search" id="q" class="search" placeholder="${ph}">`;
const searchJs = `<p class="none" id="none" hidden>見つかりませんでした。別の言葉で探してください。</p>
<script>
(function(){var q=document.getElementById("q");q.addEventListener("input",function(){var v=q.value.trim(),any=false;
document.querySelectorAll(".group").forEach(function(g){var n=0,head=g.firstElementChild.textContent.indexOf(v)>=0;g.querySelectorAll("li").forEach(function(li){var ok=!v||head||li.textContent.indexOf(v)>=0;li.hidden=!ok;if(ok)n++;});g.hidden=n===0;if(n)any=true;});
document.querySelectorAll(".genre").forEach(function(s){s.hidden=!s.querySelector(".group:not([hidden])");});
document.getElementById("none").hidden=any;});})();
</script>`;

// ジャンルのページ
for (const g of GENRES) {
  const gs = sets.filter((s) => s.genre === g);
  const n = gs.reduce((a, s) => a + s.docs.length, 0);
  const html = head(`${g.name}のお知らせ文・文例${n}種（無料で作成・印刷）｜${SITE}`,
    `${g.name}で使うお知らせ文・案内文の文例${n}種。${gs.slice(0, 4).map((s) => s.name).join("、")}など。空欄を埋めるだけで、そのまま印刷できます。登録不要・無料。`,
    `${BASE}g/${g.id}.html`, "../") + `<main>
<nav class="crumb"><a href="../">トップ</a> ＞ ${esc(g.name)}</nav>
<h1>${esc(g.name)}<small>のお知らせ文・文例 ${n}種</small></h1>
<p class="lead">使いたい文書を選んで、名前や日付を入れるだけで、A4で印刷できます。登録は不要です。</p>
${searchBox("この分野の中から探す")}
${gs.map((s) => setList(s, "../d/", "h2")).join("\n")}
${searchJs}
<p><a href="../">ほかの分野を見る</a></p>
</main>
` + footer("../");
  fs.writeFileSync(path.join(out, "g", `${g.id}.html`), html);
}

// トップページ
const index = head(`${SITE}｜お知らせ文・案内文を無料で作成・印刷（${docs.length}種）`,
  `町内会・PTA・賃貸管理・会社・お店で使うお知らせ文${docs.length}種。総会の案内、断水のお知らせ、休業のお知らせ、お礼状など。空欄を埋めるだけで、そのまま印刷できます。登録不要・無料。`,
  BASE, "") + `<main>
<h1>${SITE}<small>お知らせ文・案内文 ${docs.length}種</small></h1>
<p class="lead">町内会・PTA・賃貸管理・会社・お店で使うお知らせ文を${docs.length}種用意しました。使いたい文書を選んで、名前や日付を入れるだけで、A4で印刷できます。登録は不要です。</p>
${searchBox("キーワードで探す（例：総会、断水、休業、お礼）")}
<nav class="genres">${GENRES.map((g) => `<a href="#${g.id}">${esc(g.name)}</a>`).join("")}<a href="c/">計算ツール（家賃の日割り・残業代など）</a></nav>
${GENRES.map((g) => `<div class="genre" id="${g.id}">
<h2 class="genre-h"><a href="g/${g.id}.html">${esc(g.name)}</a></h2>
${sets.filter((s) => s.genre === g).map((s) => setList(s, "d/", "h3")).join("\n")}
</div>`).join("\n")}
${searchJs}
<aside class="cta">
<h2>Word版テンプレートもあります</h2>
<p>ここにある文面は、すべて編集できるWordファイル（A4・1ページ）でも販売しています。ロゴを入れたり、表を足したりしたいときはこちらをどうぞ。</p>
<p class="cta-links"><a class="btn" href="https://yumizeru.booth.pm/">BOOTHのショップを見る</a><a class="btn sub" href="https://note.com/yumizeru_friday">noteで書き方のコツを読む</a></p>
</aside>
</main>
` + footer("");
fs.writeFileSync(path.join(out, "index.html"), index);

// サイトマップ
const today = new Date().toISOString().slice(0, 10);
const calcs = fs.existsSync(path.join(out, "c")) ? fs.readdirSync(path.join(out, "c")).map((f) => `${BASE}c/${f === "index.html" ? "" : f}`) : [];
const urls = [BASE, ...calcs, ...GENRES.map((g) => `${BASE}g/${g.id}.html`), ...docs.map((d) => `${BASE}d/${d.slug}.html`)];
fs.writeFileSync(path.join(out, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `<url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
fs.writeFileSync(path.join(out, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${BASE}sitemap.xml\n`);
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`${docs.length} pages, ${sets.length} sets, ${GENRES.length} genres`);
for (const g of GENRES) console.log(g.name, sets.filter((s) => s.genre === g).map((s) => `${s.n}${s.note ? "" : "(noteなし)"}`).join(" "));
