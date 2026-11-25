// 文書ページ: 空欄の入力 → 文面に反映 → 印刷・コピー
(function () {
  var D = window.DOC;
  if (!D) return;
  // 物件・会社の情報は、どの文書を開いても入った状態にする
  var KEY = "oshirase-common";
  var COMMON = ["物件名", "管理会社名", "担当部署", "担当者名", "000-0000-0000", "平日 9:00～18:00"];
  // 差出人・問い合わせ先の欄は、同じ分類の文書どうしで引き継ぐ（町内会名・会長名など）
  var SETKEY = "oshirase-set-" + D.set;
  var NAMES = {
    "000-0000-0000": "電話番号", "平日 9:00～18:00": "受付時間", "平日 9:00〜18:00": "受付時間",
    "〇〇 〇〇": "お名前", "〇〇〇": "部屋番号"
  };
  for (var k in D.names || {}) NAMES[k] = D.names[k];
  var RE = /【([^】]*)】/g;
  // 必ず書き換えるところ（名前・連絡先・〇・000）。それ以外は記入例なので、そのままでも使える
  function must(l) {
    return COMMON.indexOf(l) >= 0 || !!NAMES[l] || /[〇○]|000/.test(l) ||
      /(名|名前|日|役職|係|住所|アドレス|アカウント|ホームページ|フォーム)$/.test(l) || /メールアドレス/.test(l);
  }

  function load(key) { try { return JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) { return {}; } }
  function save(key, o) { try { localStorage.setItem(key, JSON.stringify(o)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function strs(b) { return b.k === "table" ? [].concat(b.s, [].concat.apply([], b.rows)) : [].concat(b.s); }

  // 空欄（【】）を出てくる順に集める。差出人・問い合わせ先にある欄も覚えておく
  var labels = [], keep = [];
  D.blocks.forEach(function (b) {
    strs(b).forEach(function (s) {
      s.replace(RE, function (_, l) {
        if (labels.indexOf(l) < 0) labels.push(l);
        if ((b.k === "right" || b.k === "contact") && l !== "発行日" && keep.indexOf(l) < 0) keep.push(l);
        return _;
      });
    });
  });

  var vals = {};
  var common = load(KEY), mine = load(SETKEY);
  keep.forEach(function (l) { if (mine[l]) vals[l] = mine[l]; });
  COMMON.forEach(function (l) { if (common[l]) vals[l] = common[l]; });
  var now = new Date();
  vals["発行日"] = "令和" + (now.getFullYear() - 2018) + "年" + (now.getMonth() + 1) + "月" + now.getDate() + "日";

  // 入力欄
  var form = document.getElementById("fields");
  form.innerHTML = labels.map(function (l, i) {
    var name = NAMES[l] || l;
    var hint = must(l) ? (NAMES[l] ? "例：" + l : "入力してください") : "記入例です。このままでよければ空欄で大丈夫です";
    return '<label for="f' + i + '">' + esc(name) + "</label>" +
      '<input id="f' + i + '" data-l="' + esc(l) + '" value="' + esc(vals[l] || "") + '" placeholder="' + esc(l) + '">' +
      '<p class="hint">' + esc(hint) + "</p>";
  }).join("");
  form.addEventListener("input", function (e) {
    var l = e.target.getAttribute("data-l");
    if (l === null) return;
    vals[l] = e.target.value.trim();
    if (COMMON.indexOf(l) >= 0) { var c = load(KEY); c[l] = vals[l]; save(KEY, c); }
    else if (keep.indexOf(l) >= 0) { var m = load(SETKEY); m[l] = vals[l]; save(SETKEY, m); }
    render();
  });

  // 文面
  function fill(s, html) {
    var out = "", last = 0;
    s.replace(RE, function (m, l, pos) {
      out += html ? esc(s.slice(last, pos)) : s.slice(last, pos);
      var v = vals[l];
      var shown = v || (must(l) ? "【" + l + "】" : l);
      out += html ? '<span class="' + (v ? "ok" : "todo") + '">' + esc(shown) + "</span>" : shown;
      last = pos + m.length;
      return m;
    });
    out += html ? esc(s.slice(last)) : s.slice(last);
    return out;
  }

  function table(b) {
    var sum = b.w.reduce(function (a, x) { return a + x; }, 0);
    var h = '<table class="sheet"><colgroup>' + b.w.map(function (x) { return '<col style="width:' + (100 * x / sum).toFixed(1) + '%">'; }).join("") + "</colgroup>";
    h += "<tr>" + b.s.map(function (c) { return "<th>" + fill(c, true) + "</th>"; }).join("") + "</tr>";
    b.rows.forEach(function (r) { h += "<tr>" + r.map(function (c) { return "<td>" + (c ? fill(c, true) : "&nbsp;") + "</td>"; }).join("") + "</tr>"; });
    return h + "</table>";
  }

  var paper = document.getElementById("paper");
  function render() {
    var h = "", inBox = false, inList = false;
    D.blocks.forEach(function (b) {
      if (b.k !== "li" && inList) { h += "</ul>"; inList = false; }
      if (b.k !== "contact" && inBox) { h += "</div>"; inBox = false; }
      if (b.k === "ki") h += '<div class="ki"><span>' + fill(b.s[0], true) + "</span><span>" + fill(b.s[1], true) + "</span></div>";
      else if (b.k === "li") { if (!inList) { h += "<ul>"; inList = true; } h += "<li>" + fill(b.s, true) + "</li>"; }
      else if (b.k === "contact") { if (!inBox) { h += '<div class="contact">'; inBox = true; } h += "<p>" + fill(b.s, true) + "</p>"; }
      else if (b.k === "title") h += "<h2>" + fill(b.s, true) + "</h2>";
      else if (b.k === "table") h += table(b);
      else h += '<p class="' + b.k + '">' + fill(b.s, true) + "</p>";
    });
    if (inList) h += "</ul>";
    if (inBox) h += "</div>";
    paper.innerHTML = h;
    var n = paper.querySelectorAll(".todo").length;
    document.getElementById("left").textContent = n ? "黄色の箇所：あと" + n + "か所" : "すべて入力しました";
  }

  // コピー用の文章
  function text() {
    return D.blocks.map(function (b) {
      if (b.k === "ki") return "　" + fill(b.s[0]) + "：" + fill(b.s[1]);
      if (b.k === "li") return "・" + fill(b.s);
      if (b.k === "p") return "　" + fill(b.s);
      if (b.k === "title") return "\n" + fill(b.s) + "\n";
      if (b.k === "table") return "\n" + [b.s].concat(b.rows).map(function (r) { return r.map(function (c) { return fill(c); }).join("｜"); }).join("\n") + "\n";
      return fill(b.s);
    }).join("\n");
  }

  document.getElementById("print").addEventListener("click", function () { window.print(); });
  var copyBtn = document.getElementById("copy");
  copyBtn.addEventListener("click", function () {
    var t = text();
    function done() { copyBtn.textContent = "コピーしました"; setTimeout(function () { copyBtn.textContent = "文章をコピー"; }, 2000); }
    if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  });

  render();
})();
