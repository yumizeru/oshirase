// 文書ページ: 空欄の入力 → 文面に反映 → 印刷・コピー
(function () {
  var D = window.DOC;
  if (!D) return;
  var KEY = "oshirase-common";
  // 物件や会社の情報は、次に別の文書を開いたときも入った状態にする
  var COMMON = ["物件名", "管理会社名", "担当部署", "担当者名", "000-0000-0000", "平日 9:00～18:00"];
  var NAMES = {
    "000-0000-0000": "電話番号", "平日 9:00～18:00": "受付時間",
    "〇〇 〇〇": "入居者のお名前", "〇〇〇": "部屋番号"
  };
  var RE = /【([^】]*)】/g;
  // 必ず書き換えるところ（名前・〇・000）。それ以外は記入例なので、そのままでも使える
  function must(l) { return COMMON.indexOf(l) >= 0 || NAMES[l] || /[〇○]|000/.test(l) || /(名|日)$/.test(l); }

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // 空欄（【】）を出てくる順に集める
  var labels = [];
  D.blocks.forEach(function (b) {
    [].concat(b.s).forEach(function (s) {
      s.replace(RE, function (_, l) { if (labels.indexOf(l) < 0) labels.push(l); return _; });
    });
  });

  var vals = {};
  var stored = load();
  COMMON.forEach(function (l) { if (stored[l]) vals[l] = stored[l]; });
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
    if (COMMON.indexOf(l) >= 0) { var s = load(); s[l] = vals[l]; save(s); }
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
