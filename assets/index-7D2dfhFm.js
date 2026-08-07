import { createClient } from "@supabase/supabase-js";
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const SUPABASE_URL = "https://xjpzdbhgfzstocscofzo.supabase.co";
const SUPABASE_KEY = "sb_publishable_QE2uI9kxQVEsfVUtlpui_g_yrikajMZ";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  realtime: { params: { eventsPerSecond: 10 } }
});
function $(id) {
  return document.getElementById(id);
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function toast(m) {
  const t = $("toast");
  t.textContent = m;
  t.classList.add("on");
  clearTimeout(t._tm);
  t._tm = setTimeout(() => t.classList.remove("on"), 2600);
}
const sum = (a) => (a || []).reduce((x, y) => x + (+y || 0), 0);
const fmtInt = (n) => Math.round(+n || 0).toLocaleString("zh-CN");
function fmtW(n) {
  const w = (+n || 0) / 1e4;
  return (Math.round(w * 100) / 100).toLocaleString("zh-CN");
}
function fmtMoney(n) {
  return n == null ? "—" : "¥" + (+n).toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
function rateClass(r) {
  return r > 1.0001 ? "over" : r >= 0.8 ? "warn" : "ok";
}
function rateText(b, a) {
  if (!b && !a) return "—";
  if (!b) return "超支";
  return Math.round(a / b * 100) + "%";
}
function monthLabels(year) {
  const out = [];
  for (let i = 0; i < 12; i++) {
    const m = i + 6;
    if (m <= 12) out.push(m + "月");
    else out.push((year + 1) % 100 + "年" + (m - 12) + "月");
  }
  return out;
}
function currentMonthIndex(year) {
  const now = /* @__PURE__ */ new Date();
  let idx = (now.getMonth() + 1 - 6 + 12) % 12;
  const y = now.getFullYear();
  if (y < year || y === year && now.getMonth() + 1 < 6) idx = 0;
  if (y > year + 1 || y === year + 1 && now.getMonth() + 1 > 5) idx = 11;
  return idx;
}
const STATUS = {
  pending: { txt: "⏳ 待审批", cls: "pending" },
  approved: { txt: "✅ 决算通过·等待打款", cls: "approved" },
  paid: { txt: "💸 已打款", cls: "paid" },
  rejected: { txt: "❌ 已拒绝", cls: "rejected" }
};
function statusChip(s) {
  const st = STATUS[s] || STATUS.pending;
  return `<span class="chip ${st.cls}">${st.txt}</span>`;
}
function timeAgo(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1e3;
  if (diff < 60) return "刚刚";
  if (diff < 3600) return Math.floor(diff / 60) + " 分钟前";
  if (diff < 86400) return Math.floor(diff / 3600) + " 小时前";
  if (diff < 86400 * 7) return Math.floor(diff / 86400) + " 天前";
  return d.toLocaleDateString("zh-CN");
}
function askModal({ title, hint = "", value = "", placeholder = "", okText = "确定", required = true }) {
  return new Promise((resolve) => {
    $("askTitle").textContent = title;
    $("askHint").textContent = hint;
    const inp = $("askInput");
    inp.value = value;
    inp.placeholder = placeholder;
    $("askOk").textContent = okText;
    $("askModal").classList.add("on");
    setTimeout(() => inp.focus(), 60);
    const done = (v) => {
      $("askModal").classList.remove("on");
      $("askOk").onclick = $("askCancel").onclick = inp.onkeydown = null;
      resolve(v);
    };
    $("askOk").onclick = () => {
      const v = inp.value.trim();
      if (required && !v) {
        toast("内容不能为空");
        return;
      }
      done(v);
    };
    $("askCancel").onclick = () => done(null);
    inp.onkeydown = (e) => {
      if (e.key === "Enter") $("askOk").click();
    };
  });
}
function confirmModal(msg) {
  return askModal({ title: "请确认", hint: msg, required: false, okText: "确认执行", placeholder: "输入 OK 确认（可留空直接点确认）" }).then((v) => v !== null);
}
const S = {
  session: null,
  member: null,
  // 当前登录人的 members 行
  meta: { year: 2026, yearLabel: "", reserve: { name: "预留现金", amount: 0, used: 0, note: "" } },
  cats: [],
  // [{id,name,color,unplanned,sort,items:[...]}]
  records: [],
  // 全部提报/明细记录
  members: [],
  // 成员名单（展示用）
  notifications: [],
  view: "ov",
  rerender: () => {
  }
};
const isAdmin = () => S.member && S.member.role === "admin";
const isApprover = () => S.member && (S.member.role === "approver" || S.member.role === "admin");
async function loadAll() {
  const [meta, cats, items, records, members, notifs] = await Promise.all([
    sb.from("app_meta").select("*"),
    sb.from("categories").select("*").order("sort"),
    sb.from("items").select("*").order("sort"),
    sb.from("records").select("*").order("created_at", { ascending: false }),
    sb.from("members").select("*").order("created_at"),
    sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50)
  ]);
  const err = meta.error || cats.error || items.error || records.error || members.error || notifs.error;
  if (err) throw err;
  const m = {};
  (meta.data || []).forEach((r) => m[r.k] = r.v);
  S.meta = {
    year: +(m.year || 2026),
    yearLabel: (m.yearLabel || "").replace(/^"|"$/g, ""),
    reserve: m.reserve || { name: "预留现金", amount: 0, used: 0, note: "" }
  };
  const byCat = {};
  (items.data || []).forEach((it) => {
    (byCat[it.cat_id] = byCat[it.cat_id] || []).push(it);
  });
  S.cats = (cats.data || []).map((c) => ({ ...c, items: byCat[c.id] || [] }));
  S.records = records.data || [];
  S.members = members.data || [];
  S.notifications = notifs.data || [];
}
async function loadRecords() {
  const { data, error } = await sb.from("records").select("*").order("created_at", { ascending: false });
  if (!error) S.records = data || [];
}
async function loadNotifs() {
  const { data, error } = await sb.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (!error) S.notifications = data || [];
}
async function loadMembers() {
  const { data, error } = await sb.from("members").select("*").order("created_at");
  if (!error) S.members = data || [];
}
async function loadBudget() {
  const [cats, items] = await Promise.all([
    sb.from("categories").select("*").order("sort"),
    sb.from("items").select("*").order("sort")
  ]);
  if (cats.error || items.error) return;
  const byCat = {};
  (items.data || []).forEach((it) => {
    (byCat[it.cat_id] = byCat[it.cat_id] || []).push(it);
  });
  S.cats = (cats.data || []).map((c) => ({ ...c, items: byCat[c.id] || [] }));
}
const counted = () => S.records.filter((r) => r.status === "approved" || r.status === "paid");
function recSumFor(itemId, m) {
  return counted().reduce((t, r) => t + (r.item_id === itemId && r.month === m ? +r.amount || 0 : 0), 0);
}
function itemA(it, m) {
  return (+it.a[m] || 0) + recSumFor(it.id, m);
}
function itemATotal(it) {
  let t = sum(it.a);
  for (let m = 0; m < 12; m++) t += recSumFor(it.id, m);
  return t;
}
function catB(c) {
  return c.items.reduce((t, it) => t + sum(it.b), 0);
}
function catA(c) {
  return c.items.reduce((t, it) => t + itemATotal(it), 0);
}
function allB() {
  return S.cats.reduce((t, c) => t + catB(c), 0);
}
function allA() {
  return S.cats.reduce((t, c) => t + catA(c), 0);
}
function monthB(m) {
  return S.cats.reduce((t, c) => t + c.items.reduce((x, it) => x + (+it.b[m] || 0), 0), 0);
}
function monthA(m) {
  return S.cats.reduce((t, c) => t + c.items.reduce((x, it) => x + itemA(it, m), 0), 0);
}
function catMonthB(c, m) {
  return c.items.reduce((x, it) => x + (+it.b[m] || 0), 0);
}
function catMonthA(c, m) {
  return c.items.reduce((x, it) => x + itemA(it, m), 0);
}
async function submitRecord(p) {
  const payload = {
    month: p.month,
    item_id: p.item_id || null,
    cat_name: p.cat_name,
    title: p.title,
    budget_amount: p.budget_amount ?? null,
    amount: p.amount,
    pay_date: p.pay_date || "",
    note: p.note || "",
    source: "submit",
    status: "pending",
    submitter_id: S.session.user.id,
    submitter_name: S.member.name
  };
  const { data, error } = await sb.from("records").insert(payload).select().single();
  if (error) throw error;
  sb.functions.invoke("notify", { body: { type: "submitted", record_id: data.id } }).catch(() => {
  });
  await loadRecords();
  return data;
}
async function decideRecord(id, ok, reason = "") {
  const patch = ok ? { status: "approved", approver_name: S.member.name, decided_at: (/* @__PURE__ */ new Date()).toISOString() } : { status: "rejected", approver_name: S.member.name, decided_at: (/* @__PURE__ */ new Date()).toISOString(), reject_reason: reason };
  const { error } = await sb.from("records").update(patch).eq("id", id);
  if (error) throw error;
  sb.functions.invoke("notify", { body: { type: "decided", record_id: id } }).catch(() => {
  });
  await loadRecords();
}
async function markPaid(id) {
  const { error } = await sb.from("records").update({ status: "paid" }).eq("id", id);
  if (error) throw error;
  sb.functions.invoke("notify", { body: { type: "decided", record_id: id } }).catch(() => {
  });
  await loadRecords();
}
async function editRecord(id, p) {
  const { error } = await sb.from("records").update(p).eq("id", id);
  if (error) throw error;
  await loadRecords();
}
async function deleteRecord(id) {
  const { error } = await sb.from("records").delete().eq("id", id);
  if (error) throw error;
  await loadRecords();
}
async function addMember(name, email, role) {
  const { error } = await sb.from("members").insert({ name, email, role });
  if (error) throw error;
  await loadMembers();
}
async function updateMember(id, patch) {
  const { error } = await sb.from("members").update(patch).eq("id", id);
  if (error) throw error;
  await loadMembers();
}
async function removeMember(id) {
  const { error } = await sb.from("members").delete().eq("id", id);
  if (error) throw error;
  await loadMembers();
}
async function saveItemRow(item, field, arr) {
  const { error } = await sb.from("items").update({ [field]: arr }).eq("id", item.id);
  if (error) {
    toast("保存失败：" + error.message);
    return false;
  }
  return true;
}
async function renameItem(item, name) {
  const { error } = await sb.from("items").update({ name }).eq("id", item.id);
  if (error) {
    toast("保存失败：" + error.message);
    return false;
  }
  return true;
}
async function addItem(catId, name, note = "") {
  const { error } = await sb.from("items").insert({
    id: "i" + Date.now().toString(36),
    cat_id: catId,
    name,
    note,
    sort: 100 + Date.now() % 1e3
  });
  if (error) throw error;
  await loadBudget();
}
async function deleteItem(item) {
  const { error } = await sb.from("items").delete().eq("id", item.id);
  if (error) throw error;
  await loadBudget();
}
async function addCategory(name) {
  const COLORS = ["#1E3A5F", "#7B5EA7", "#B03A2E", "#5B6B7C", "#C05A2E", "#2F855A", "#B7791F", "#C2185B"];
  const { error } = await sb.from("categories").insert({
    id: "c" + Date.now().toString(36),
    name,
    color: COLORS[S.cats.length % COLORS.length],
    sort: S.cats.length
  });
  if (error) throw error;
  await loadBudget();
}
async function markAllRead() {
  await sb.from("notifications").update({ read: true }).eq("read", false);
  await loadNotifs();
}
async function markRead(id) {
  await sb.from("notifications").update({ read: true }).eq("id", id);
  await loadNotifs();
}
const unreadCount = () => S.notifications.filter((n) => !n.read).length;
async function saveNotifyKey(key) {
  const { error } = await sb.from("members").update({ notify_key: key.trim() }).eq("id", S.member.id);
  if (error) throw error;
  S.member.notify_key = key.trim();
}
let channel = null;
function startRealtime() {
  if (channel) return;
  channel = sb.channel("tb-live").on("postgres_changes", { event: "*", schema: "public", table: "records" }, async () => {
    await loadRecords();
    S.rerender();
  }).on("postgres_changes", { event: "*", schema: "public", table: "items" }, async () => {
    await loadBudget();
    S.rerender();
  }).on("postgres_changes", { event: "*", schema: "public", table: "categories" }, async () => {
    await loadBudget();
    S.rerender();
  }).on("postgres_changes", { event: "*", schema: "public", table: "members" }, async () => {
    await loadMembers();
    const me = S.members.find((m) => {
      var _a;
      return m.id === ((_a = S.member) == null ? void 0 : _a.id);
    });
    if (me) S.member = me;
    S.rerender();
  }).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, async (payload) => {
    var _a, _b;
    await loadNotifs();
    const n = payload.new;
    if (n && n.user_id === ((_b = (_a = S.session) == null ? void 0 : _a.user) == null ? void 0 : _b.id)) toast(n.title);
    S.rerender();
  }).subscribe();
}
const ML = () => monthLabels(S.meta.year);
const qs = (arr, q) => sum((arr || []).slice(q * 3, q * 3 + 3));
function renderOverview() {
  const B = allB(), A = allA(), rv = S.meta.reserve;
  const r = B ? A / B : 0;
  $("ovCards").innerHTML = '<div class="card"><div class="lb">年度支出预算</div><div class="vl">' + fmtW(B) + '<small> 万</small></div><div class="sub">另有预留现金 ' + fmtW(rv.amount) + ' 万</div></div><div class="card"><div class="lb">实际支出累计</div><div class="vl">' + fmtW(A) + '<small> 万</small></div><div class="sub">提报审批通过后自动入账</div></div><div class="card"><div class="lb">预算执行率</div><div class="vl"><span class="rate ' + rateClass(r) + '">' + rateText(B, A) + '</span></div><div class="sub">&gt;100% 红色为超支</div></div><div class="card"><div class="lb">预算余额</div><div class="vl">' + fmtW(B - A) + '<small> 万</small></div><div class="sub">支出预算 − 实际支出</div></div>';
  const R = 78, C = 2 * Math.PI * R;
  let off = C * 0.25, segs = "";
  const total = B || 1;
  S.cats.filter((c) => !c.unplanned).forEach((c) => {
    const frac = catB(c) / total;
    segs += '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="' + c.color + '" stroke-width="24" stroke-dasharray="' + frac * C + " " + C + '" stroke-dashoffset="' + off + '"><title>' + esc(c.name) + " " + fmtW(catB(c)) + "万</title></circle>";
    off -= frac * C;
  });
  $("donut").innerHTML = segs + '<text x="100" y="94" text-anchor="middle" font-size="15" font-weight="800" fill="#1E3A5F">' + fmtW(B) + '万</text><text x="100" y="114" text-anchor="middle" font-size="10" fill="#8A97A8">支出预算</text>';
  $("legend").innerHTML = S.cats.filter((c) => !c.unplanned).map(
    (c) => '<div class="lg"><span class="dt" style="background:' + c.color + '"></span>' + esc(c.name) + '<span class="pc">' + fmtW(catB(c)) + "万 · " + Math.round(catB(c) / total * 100) + "%</span></div>"
  ).join("");
  let h = "";
  S.cats.forEach((c) => {
    const cb = catB(c), ca = catA(c), rr = cb ? ca / cb : ca ? 2 : 0;
    if (c.unplanned) {
      h += '<div class="cat-card"><div class="top"><span class="dt" style="width:9px;height:9px;border-radius:3px;background:' + c.color + ';display:inline-block;"></span><span class="nm">' + esc(c.name) + '</span><span class="amt">实际 ' + fmtW(ca) + ' 万</span></div><div class="nums"><span>计划外支出 · 计入总实际，不占预算额度</span></div></div>';
      return;
    }
    const w = Math.min(100, cb ? ca / cb * 100 : ca ? 100 : 0);
    h += '<div class="cat-card"><div class="top"><span class="dt" style="width:9px;height:9px;border-radius:3px;background:' + c.color + ';display:inline-block;"></span><span class="nm">' + esc(c.name) + '</span><span class="amt">' + fmtW(ca) + " / " + fmtW(cb) + ' 万</span></div><div class="bar"><i style="width:' + w + "%;background:" + (rr > 1 ? "#E53E3E" : c.color) + '"></i></div><div class="nums"><span>实际 ' + fmtW(ca) + ' 万</span><span class="rate ' + rateClass(rr) + '">' + rateText(cb, ca) + "</span><span>预算 " + fmtW(cb) + " 万</span></div></div>";
  });
  h += '<div class="reserve"><div class="lb">🛡️ ' + esc(rv.name || "预留现金") + '</div><div class="vl">' + fmtW(rv.amount - (rv.used || 0)) + ' 万</div><div class="sub">总额 ' + fmtW(rv.amount) + " 万" + (rv.used ? " · 已动用 " + fmtW(rv.used) + " 万" : " · 未动用") + (rv.note ? " · " + esc(rv.note) : "") + "</div></div>";
  $("ovCats").innerHTML = h;
}
let moMode = "b";
function bindMonthPills() {
  document.querySelectorAll("#moPills button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#moPills button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      moMode = b.dataset.m;
      renderMonth();
    });
  });
}
function renderMonth() {
  const M = ML();
  let h = "<thead><tr><th>大项 \\ 月份</th>" + M.map((m, i) => '<th class="clk" data-m="' + i + '" title="点击查看该月细项">' + m + "</th>").join("") + "<th>全年</th></tr></thead><tbody>";
  S.cats.forEach((c) => {
    h += '<tr><td><span style="color:' + c.color + '">●</span> ' + esc(c.name) + "</td>";
    for (let m = 0; m < 12; m++) {
      const b = catMonthB(c, m), a = catMonthA(c, m);
      let v, cls = "";
      if (moMode === "b") v = b;
      else if (moMode === "a") v = a;
      else {
        v = a - b;
        if (v > 0) cls = "neg";
      }
      if (!v && moMode !== "d") cls = "zero";
      h += '<td class="' + cls + '">' + (v ? (moMode === "d" && v > 0 ? "+" : "") + fmtW(v) : moMode === "d" ? "" : "—") + "</td>";
    }
    const tb = catB(c), ta = catA(c);
    const tv = moMode === "b" ? tb : moMode === "a" ? ta : ta - tb;
    h += '<td style="font-weight:800;" class="' + (moMode === "d" && tv > 0 ? "neg" : "") + '">' + fmtW(tv) + "</td></tr>";
  });
  h += '<tr class="total"><td>月度合计</td>';
  for (let m = 0; m < 12; m++) {
    const b = monthB(m), a = monthA(m);
    const v = moMode === "b" ? b : moMode === "a" ? a : a - b;
    h += '<td class="' + (moMode === "d" && v > 0 ? "neg" : "") + '">' + (v ? fmtW(v) : "") + "</td>";
  }
  const TB = allB(), TA = allA();
  h += "<td>" + fmtW(moMode === "b" ? TB : moMode === "a" ? TA : TA - TB) + "</td></tr></tbody>";
  $("moTable").innerHTML = h;
  document.querySelectorAll("#moTable th.clk").forEach((th) => {
    th.addEventListener("click", () => openMonth(+th.dataset.m));
  });
  let max = 1;
  for (let m = 0; m < 12; m++) max = Math.max(max, monthB(m), monthA(m));
  let ch = "";
  for (let m = 0; m < 12; m++) {
    const b = monthB(m), a = monthA(m);
    ch += '<div class="cg"><div class="bb"><div class="b1" style="height:' + Math.round(b / max * 126) + 'px" title="预算 ' + fmtInt(b) + ' 元"></div><div class="b2' + (a > b && b > 0 ? " over" : "") + '" style="height:' + Math.round(a / max * 126) + 'px" title="实际 ' + fmtInt(a) + ' 元"></div></div><div class="ml">' + M[m] + "</div></div>";
  }
  $("moChart").innerHTML = ch;
}
function openMonth(m) {
  const M = ML();
  let h = "";
  S.cats.forEach((c) => {
    let rows = "";
    c.items.forEach((it) => {
      const b = +it.b[m] || 0, a = itemA(it, m);
      if (!b && !a) return;
      rows += '<div class="mo-r"><span>' + esc(it.name) + '</span><span class="v">预 ' + fmtW(b) + " / 实 " + fmtW(a) + " 万</span></div>";
    });
    if (rows) h += '<div class="mo-cat" style="color:' + c.color + '">' + esc(c.name) + "</div>" + rows;
  });
  $("moTitle").textContent = M[m] + " · 细项支出";
  $("moBody").innerHTML = (h || '<div style="color:#9AA7B5;font-size:13px;text-align:center;padding:18px;">该月暂无预算/实际支出</div>') + '<div class="mo-r" style="border-top:2px solid #D9E2EC;border-bottom:none;font-weight:800;margin-top:10px;"><span>月度合计</span><span class="v">预 ' + fmtW(monthB(m)) + " / 实 " + fmtW(monthA(m)) + " 万</span></div>";
  $("moModal").classList.add("on");
}
function bindMonthModal() {
  $("moClose").addEventListener("click", () => $("moModal").classList.remove("on"));
  $("moModal").addEventListener("click", (e) => {
    if (e.target === $("moModal")) $("moModal").classList.remove("on");
  });
}
function renderQuarter() {
  const M = ML();
  const QN = [`Q1（${M[0]}-${M[2]}）`, `Q2（${M[3]}-${M[5]}）`, `Q3（${M[6]}-${M[8]}）`, `Q4（${M[9]}-${M[11]}）`];
  const qA = (it, q) => itemA(it, q * 3) + itemA(it, q * 3 + 1) + itemA(it, q * 3 + 2);
  let h = "";
  for (let q = 0; q < 4; q++) {
    let qb = 0, qa = 0;
    S.cats.forEach((c) => c.items.forEach((it) => {
      qb += qs(it.b, q);
      qa += qA(it, q);
    }));
    const r = qb ? qa / qb : 0;
    h += '<div class="qcard"><h4>' + QN[q] + '<span class="qr rate ' + rateClass(r) + '">' + rateText(qb, qa) + '</span></h4><div class="qnums"><span>预算 <b>' + fmtW(qb) + "</b> 万</span><span>实际 <b>" + fmtW(qa) + '</b> 万</span><span>差异 <b class="' + (qa - qb > 0 ? "rate over" : "") + '">' + (qa - qb > 0 ? "+" : "") + fmtW(qa - qb) + "</b> 万</span></div>";
    S.cats.forEach((c) => {
      let cb = 0, ca = 0;
      c.items.forEach((it) => {
        cb += qs(it.b, q);
        ca += qA(it, q);
      });
      if (!cb && !ca) return;
      const w = Math.min(100, qb ? cb / Math.max(qb, qa) * 100 : 0);
      h += '<div class="qrow"><span class="nm" style="color:' + c.color + '">' + esc(c.name) + '</span><span class="qb"><i style="width:' + w + "%;background:" + c.color + '"></i></span><span class="qv">' + fmtW(ca) + " / " + fmtW(cb) + " 万</span></div>";
    });
    h += "</div>";
  }
  $("quGrid").innerHTML = h;
}
function renderItems() {
  const M = ML();
  let h = "";
  S.cats.forEach((c) => {
    const cb = catB(c), ca = catA(c), r = cb ? ca / cb : 0;
    h += '<div class="it-sec"><div class="it-head"><span style="width:9px;height:9px;border-radius:3px;background:' + c.color + ';display:inline-block;"></span><span class="nm">' + esc(c.name) + "</span>" + (c.unplanned ? '<span class="tt">实际 ' + fmtW(ca) + " 万 · 计划外</span>" : '<span class="tt">' + fmtW(ca) + " / " + fmtW(cb) + ' 万 · <span class="rate ' + rateClass(r) + '">' + rateText(cb, ca) + "</span></span>") + '<span class="arrow">▶</span></div><div class="it-body">';
    c.items.forEach((it) => {
      const ib = sum(it.b), ia = itemATotal(it), ir = ib ? ia / ib : ia ? 2 : 0;
      h += '<div class="it-row"><div class="r1"><span class="inm">' + esc(it.name) + "</span>" + (it.note ? '<span class="inote">' + esc(it.note) + "</span>" : "") + '<span class="iam">' + fmtW(ia) + " / " + fmtW(ib) + ' 万 · <span class="rate ' + rateClass(ir) + '">' + rateText(ib, ia) + '</span></span></div><div class="mb">' + it.b.map((v, m) => {
        const av = itemA(it, m);
        return '<span class="' + (av ? "hasA" : +v || 0 ? "has" : "") + '" title="' + M[m] + "：预算 " + fmtInt(v) + " 元 / 实际 " + fmtInt(av) + ' 元">' + (av || +v || 0 ? fmtW(av || +v) : "") + "</span>";
      }).join("") + "</div></div>";
    });
    h += "</div></div>";
  });
  $("itList").innerHTML = h;
  document.querySelectorAll(".it-sec .it-head").forEach((el) => {
    el.addEventListener("click", () => el.parentElement.classList.toggle("open"));
  });
}
let mlMonth = null;
function bindMonthly() {
  if (mlMonth == null) mlMonth = currentMonthIndex(S.meta.year);
}
function renderMonthly() {
  const M = monthLabels(S.meta.year);
  if (mlMonth == null) mlMonth = currentMonthIndex(S.meta.year);
  $("mlPills").innerHTML = M.map(
    (m, i) => `<button data-m="${i}" class="${i === mlMonth ? "on" : ""}">${m}</button>`
  ).join("");
  document.querySelectorAll("#mlPills button").forEach((b) => {
    b.addEventListener("click", () => {
      mlMonth = +b.dataset.m;
      renderMonthly();
    });
  });
  const rows = S.records.filter((r) => r.month === mlMonth).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  let h = '<thead><tr><th>#</th><th>预算类目</th><th>明细说明</th><th class="num">预算金额</th><th>支付/报销时间</th><th class="num">实际决算</th><th>状态</th><th>提交人</th><th>备注</th></tr></thead><tbody>';
  let tb = 0, ta = 0;
  rows.forEach((r, i) => {
    const bAmt = r.budget_amount == null ? null : +r.budget_amount;
    const aAmt = r.amount == null ? null : +r.amount;
    if (bAmt) tb += bAmt;
    if ((r.status === "approved" || r.status === "paid") && aAmt) ta += aAmt;
    h += `<tr>
      <td>${i + 1}</td>
      <td><b>${esc(r.cat_name)}</b></td>
      <td>${esc(r.title)}</td>
      <td class="num">${bAmt == null ? "/" : fmtMoney(bAmt)}</td>
      <td>${esc(r.pay_date || "")}</td>
      <td class="num">${r.status === "rejected" ? "—" : aAmt == null ? "" : fmtMoney(aAmt)}</td>
      <td>${statusChip(r.status)}</td>
      <td>${esc(r.submitter_name)}${r.source === "import" ? '<div style="font-size:10px;color:#B0BAC6;">8月表导入</div>' : ""}</td>
      <td style="max-width:200px;">${esc(r.note || "")}${r.status === "rejected" && r.reject_reason ? '<div style="color:#C53030;">拒绝原因：' + esc(r.reject_reason) + "</div>" : ""}</td>
    </tr>`;
  });
  if (!rows.length) {
    h += '<tr><td colspan="9" style="text-align:center;color:#9AA7B5;padding:22px;">该月暂无预算明细，可在「提报」页提交申请</td></tr>';
  }
  h += `<tr class="total"><td>—</td><td>合计总预算</td><td>—</td><td class="num">${fmtMoney(tb)}</td><td>—</td><td class="num">${fmtMoney(ta)}</td><td colspan="3" style="font-weight:400;font-size:11px;color:#8A97A8;">实际=审批通过/已打款合计</td></tr></tbody>`;
  $("mlTable").innerHTML = h;
}
const OTHER = "__other__";
let editingId = null;
function bindSubmit() {
  $("sbSubmit").addEventListener("click", onSubmit);
  $("sbItem").addEventListener("change", () => {
    $("sbCatNameRow").style.display = $("sbItem").value === OTHER ? "" : "none";
  });
}
function fillFormOptions() {
  const M = monthLabels(S.meta.year);
  const cur = currentMonthIndex(S.meta.year);
  $("sbMonth").innerHTML = M.map((m, i) => `<option value="${i}" ${i === cur ? "selected" : ""}>${m}</option>`).join("");
  let opts = "";
  S.cats.forEach((c) => {
    if (!c.items.length) return;
    opts += `<optgroup label="${esc(c.name)}">` + c.items.map(
      (it) => `<option value="${it.id}" data-cat="${esc(c.name)}">${esc(it.name)}</option>`
    ).join("") + "</optgroup>";
  });
  opts += `<option value="${OTHER}">✏️ 其他 / 计划外（自填类目）</option>`;
  $("sbItem").innerHTML = opts;
}
function findItemName(id) {
  for (const c of S.cats) {
    const it = c.items.find((x) => x.id === id);
    if (it) return { catName: c.name, itemName: it.name };
  }
  return null;
}
async function onSubmit() {
  const month = +$("sbMonth").value;
  const itemVal = $("sbItem").value;
  const title = $("sbTitle").value.trim();
  const amount = parseFloat($("sbAmount").value);
  const budgetRaw = $("sbBudget").value;
  const budget = budgetRaw === "" ? null : parseFloat(budgetRaw);
  const payDate = $("sbPayDate").value.trim();
  const note = $("sbNote").value.trim();
  if (!title) {
    toast("请填写明细说明");
    return;
  }
  if (!(amount > 0)) {
    toast("请填写有效的申请金额");
    return;
  }
  if (budget != null && !(budget >= 0)) {
    toast("预算金额无效");
    return;
  }
  let item_id = null, cat_name = "";
  if (itemVal === OTHER) {
    cat_name = $("sbCatName").value.trim();
    if (!cat_name) {
      toast("请填写自定义类目名称");
      return;
    }
  } else {
    const f = findItemName(itemVal);
    item_id = itemVal;
    cat_name = f ? f.catName + " · " + f.itemName : "未分类";
  }
  const btn = $("sbSubmit");
  btn.disabled = true;
  try {
    if (editingId) {
      await editRecord(editingId, { month, item_id, cat_name, title, amount, budget_amount: budget, pay_date: payDate, note });
      toast("✅ 已更新，等待审批");
      editingId = null;
      btn.innerHTML = `提交提报（提交人：<b id="sbWho">${esc(S.member.name)}</b>）`;
    } else {
      await submitRecord({ month, item_id, cat_name, title, amount, budget_amount: budget, pay_date: payDate, note });
      toast("✅ 已提交，等待 hanrui 审批");
    }
    $("sbTitle").value = $("sbAmount").value = $("sbBudget").value = $("sbPayDate").value = $("sbNote").value = "";
    renderSubmit();
    S.rerender();
  } catch (e) {
    toast("提交失败：" + (e.message || e));
  } finally {
    btn.disabled = false;
  }
}
function renderSubmit() {
  fillFormOptions();
  $("sbWho").textContent = S.member.name;
  const my = S.records.filter((r) => r.submitter_id === S.session.user.id && r.source === "submit");
  if (!my.length) {
    $("sbMyList").innerHTML = '<div class="empty">还没有提报记录，填上面的表单提交第一笔吧</div>';
    return;
  }
  const M = monthLabels(S.meta.year);
  $("sbMyList").innerHTML = my.map((r) => {
    const canEdit = r.status === "pending";
    return `<div class="rec">
      <div class="r1">${statusChip(r.status)}<span class="rt">${esc(r.title)}</span><span class="ram">${fmtMoney(r.amount)}</span></div>
      <div class="r2">${M[r.month]} · ${esc(r.cat_name)}${r.budget_amount != null ? " · 预算 " + fmtMoney(r.budget_amount) : ""}${r.pay_date ? " · " + esc(r.pay_date) : ""}${r.note ? " · " + esc(r.note) : ""}<br>
      提交于 ${timeAgo(r.created_at)}${r.approver_name ? " · 审批人 " + esc(r.approver_name) : ""}${r.status === "rejected" && r.reject_reason ? ' · <span style="color:#C53030;">原因：' + esc(r.reject_reason) + "</span>" : ""}</div>
      ${canEdit ? `<div class="r3"><button class="dbtn sec" data-edit="${r.id}">✏️ 修改</button><button class="dbtn red" data-del="${r.id}">撤回删除</button></div>` : ""}
    </div>`;
  }).join("");
  document.querySelectorAll("#sbMyList [data-edit]").forEach((b) => {
    b.addEventListener("click", () => {
      const r = my.find((x) => x.id === b.dataset.edit);
      if (!r) return;
      editingId = r.id;
      $("sbMonth").value = r.month;
      $("sbItem").value = r.item_id || OTHER;
      $("sbCatNameRow").style.display = r.item_id ? "none" : "";
      $("sbCatName").value = r.item_id ? "" : r.cat_name;
      $("sbTitle").value = r.title;
      $("sbAmount").value = r.amount ?? "";
      $("sbBudget").value = r.budget_amount ?? "";
      $("sbPayDate").value = r.pay_date || "";
      $("sbNote").value = r.note || "";
      $("sbSubmit").innerHTML = "保存修改（仍为待审批）";
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
  document.querySelectorAll("#sbMyList [data-del]").forEach((b) => {
    b.addEventListener("click", async () => {
      const ok = await confirmModal("撤回并删除这笔待审批提报？");
      if (!ok) return;
      try {
        await deleteRecord(b.dataset.del);
        toast("已撤回");
        renderSubmit();
        S.rerender();
      } catch (e) {
        toast("删除失败：" + (e.message || e));
      }
    });
  });
}
function renderApprove() {
  if (!isApprover()) {
    $("apPending").innerHTML = '<div class="empty">审批功能仅审批人和管理员可见</div>';
    $("apHistory").innerHTML = "";
    return;
  }
  const M = monthLabels(S.meta.year);
  const pending = S.records.filter((r) => r.status === "pending");
  const history = S.records.filter((r) => r.status !== "pending").slice(0, 40);
  $("apPending").innerHTML = pending.length ? pending.map((r) => `
    <div class="rec">
      <div class="r1">${statusChip(r.status)}<span class="rt">${esc(r.title)}</span><span class="ram">${fmtMoney(r.amount)}</span></div>
      <div class="r2">
        <b>${esc(r.submitter_name)}</b> 提交 · ${M[r.month]} · ${esc(r.cat_name)}<br>
        ${r.budget_amount != null ? "预算金额 " + fmtMoney(r.budget_amount) + " · " : ""}${r.pay_date ? "支付/报销：" + esc(r.pay_date) + " · " : ""}${timeAgo(r.created_at)}${r.note ? "<br>备注：" + esc(r.note) : ""}
      </div>
      <div class="r3">
        <button class="dbtn grn" data-ok="${r.id}">✅ 批准通过</button>
        <button class="dbtn red" data-no="${r.id}">❌ 拒绝</button>
      </div>
    </div>`).join("") : '<div class="empty">🎉 没有待审批的提报</div>';
  $("apHistory").innerHTML = history.length ? history.map((r) => `
    <div class="rec">
      <div class="r1">${statusChip(r.status)}<span class="rt">${esc(r.title)}</span><span class="ram">${fmtMoney(r.amount)}</span></div>
      <div class="r2">${esc(r.submitter_name)} · ${M[r.month]} · ${esc(r.cat_name)}${r.approver_name ? " · 审批人 " + esc(r.approver_name) : ""}${r.decided_at ? " · " + timeAgo(r.decided_at) : ""}${r.status === "rejected" && r.reject_reason ? ' · <span style="color:#C53030;">原因：' + esc(r.reject_reason) + "</span>" : ""}</div>
      ${r.status === "approved" && r.source === "submit" ? `<div class="r3"><button class="dbtn pri" data-paid="${r.id}">💸 标记已打款</button></div>` : ""}
    </div>`).join("") : '<div class="empty">暂无审批历史</div>';
  document.querySelectorAll("#apPending [data-ok]").forEach((b) => {
    b.addEventListener("click", async () => {
      const r = pending.find((x) => x.id === b.dataset.ok);
      const ok = await confirmModal(`批准「${r.title}」${fmtMoney(r.amount)}？通过后显示为「决算通过，等待打款」，并计入实际支出、推送通知提交人。`);
      if (!ok) return;
      b.disabled = true;
      try {
        await decideRecord(r.id, true);
        toast("✅ 已批准：决算通过，等待打款");
        S.rerender();
      } catch (e) {
        toast("操作失败：" + (e.message || e));
        b.disabled = false;
      }
    });
  });
  document.querySelectorAll("#apPending [data-no]").forEach((b) => {
    b.addEventListener("click", async () => {
      const r = pending.find((x) => x.id === b.dataset.no);
      const reason = await askModal({ title: "拒绝原因", hint: `拒绝「${r.title}」${fmtMoney(r.amount)}，原因会推送给提交人。`, placeholder: "如：超出本月额度 / 缺少凭证", okText: "确认拒绝" });
      if (reason == null) return;
      b.disabled = true;
      try {
        await decideRecord(r.id, false, reason);
        toast("已拒绝并通知提交人");
        S.rerender();
      } catch (e) {
        toast("操作失败：" + (e.message || e));
        b.disabled = false;
      }
    });
  });
  document.querySelectorAll("#apHistory [data-paid]").forEach((b) => {
    b.addEventListener("click", async () => {
      const ok = await confirmModal("确认该笔款项已打出？状态将变为「已打款」。");
      if (!ok) return;
      b.disabled = true;
      try {
        await markPaid(b.dataset.paid);
        toast("💸 已标记打款");
        S.rerender();
      } catch (e) {
        toast("操作失败：" + (e.message || e));
        b.disabled = false;
      }
    });
  });
}
let adMode = "mb";
let enCatId = null, enMode = "b";
function bindAdmin() {
  document.querySelectorAll("#adPills button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#adPills button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      adMode = b.dataset.m;
      $("adMembers").style.display = adMode === "mb" ? "" : "none";
      $("adEntry").style.display = adMode === "en" ? "" : "none";
      renderAdmin();
    });
  });
  $("mbAdd").addEventListener("click", onAddMember);
  document.querySelectorAll("#enPills button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#enPills button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      enMode = b.dataset.m;
      renderGrid();
    });
  });
  $("enAddItem").addEventListener("click", onAddItem);
  $("enAddUnplanned").addEventListener("click", onAddUnplanned);
  $("enAddCat").addEventListener("click", onAddCat);
}
function renderAdmin() {
  if (!isAdmin()) {
    $("mbList").innerHTML = '<div class="empty">管理功能仅管理员可见</div>';
    return;
  }
  if (adMode === "mb") renderMembers();
  else renderEntry();
}
const ROLE_TXT$1 = { admin: "管理员", approver: "审批人", member: "成员" };
async function onAddMember() {
  const name = $("mbName").value.trim();
  const email = $("mbEmail").value.trim();
  const role = $("mbRole").value;
  if (!name) {
    toast("请填写姓名");
    return;
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    toast("邮箱格式不正确");
    return;
  }
  try {
    await addMember(name, email, role);
    $("mbName").value = $("mbEmail").value = "";
    toast(`✅ 已添加 ${name}（${ROLE_TXT$1[role]}），请TA用该邮箱注册登录`);
    renderMembers();
  } catch (e) {
    toast("添加失败：" + (e.message && e.message.includes("duplicate") ? "该邮箱已在名单中" : e.message || e));
  }
}
function renderMembers() {
  const list = S.members;
  $("mbList").innerHTML = list.map((m) => {
    const isSelf = m.id === S.member.id;
    return `<div class="mb-row">
      <div>
        <span class="mn">${esc(m.name)}</span>
        <span class="mrole ${m.role}">${ROLE_TXT$1[m.role]}</span>
        ${m.active ? "" : '<span class="moff">已停用</span>'}
        ${m.notify_key ? '<span title="已配置微信推送" style="font-size:11px;">🔔</span>' : ""}
        <div class="me">${esc(m.email)}${m.user_id ? "" : ' · <span style="color:#B7791F;">尚未注册登录</span>'}${isSelf ? " · （我）" : ""}</div>
      </div>
      <div class="mact">
        ${!isSelf ? `
          <button data-role="${m.id}" title="切换角色">🔄 角色</button>
          <button data-toggle="${m.id}">${m.active ? "⏸ 停用" : "▶️ 恢复"}</button>
          <button class="danger" data-del="${m.id}">🗑 移除</button>` : ""}
      </div>
    </div>`;
  }).join("") || '<div class="empty">暂无成员</div>';
  document.querySelectorAll("#mbList [data-role]").forEach((b) => {
    b.addEventListener("click", async () => {
      const m = S.members.find((x) => x.id === b.dataset.role);
      const v = await askModal({
        title: `修改 ${m.name} 的角色`,
        hint: "输入：member=成员 / approver=审批人 / admin=管理员",
        value: m.role,
        placeholder: "member / approver / admin"
      });
      if (v == null) return;
      if (!["member", "approver", "admin"].includes(v)) {
        toast("角色无效");
        return;
      }
      try {
        await updateMember(m.id, { role: v });
        toast("已更新角色");
        renderMembers();
      } catch (e) {
        toast("失败：" + (e.message || e));
      }
    });
  });
  document.querySelectorAll("#mbList [data-toggle]").forEach((b) => {
    b.addEventListener("click", async () => {
      const m = S.members.find((x) => x.id === b.dataset.toggle);
      try {
        await updateMember(m.id, { active: !m.active });
        toast(m.active ? `已停用 ${m.name}，TA 将立即无法访问` : `已恢复 ${m.name}`);
        renderMembers();
      } catch (e) {
        toast("失败：" + (e.message || e));
      }
    });
  });
  document.querySelectorAll("#mbList [data-del]").forEach((b) => {
    b.addEventListener("click", async () => {
      const m = S.members.find((x) => x.id === b.dataset.del);
      const ok = await confirmModal(`确定把 ${m.name}（${m.email}）移出成员名单？TA 将立即失去全部访问权限。`);
      if (!ok) return;
      try {
        await removeMember(m.id);
        toast("已移除");
        renderMembers();
      } catch (e) {
        toast("失败：" + (e.message || e));
      }
    });
  });
}
function renderEntry() {
  if (!S.cats.length) return;
  if (!enCatId || !S.cats.some((c) => c.id === enCatId)) enCatId = S.cats[0].id;
  $("enCats").innerHTML = S.cats.map(
    (c) => `<button data-cid="${c.id}" class="${c.id === enCatId ? "on" : ""}" style="${c.id === enCatId ? "background:" + c.color : ""}">${esc(c.name)}</button>`
  ).join("");
  document.querySelectorAll("#enCats button").forEach((b) => {
    b.addEventListener("click", () => {
      enCatId = b.dataset.cid;
      renderEntry();
    });
  });
  renderGrid();
}
const curCat = () => S.cats.find((c) => c.id === enCatId);
function renderGrid() {
  const M = monthLabels(S.meta.year);
  const c = curCat();
  if (!c) {
    $("enGrid").innerHTML = "";
    return;
  }
  let h = '<thead><tr><th class="c1">细项名称（可改）</th>' + M.map((m) => "<th>" + m + "</th>").join("") + "<th>合计</th><th></th></tr></thead><tbody>";
  c.items.forEach((it) => {
    const arr = enMode === "b" ? it.b : it.a;
    h += `<tr data-iid="${it.id}"><td class="c1"><input class="iname" value="${esc(it.name)}" data-k="name"></td>`;
    for (let m = 0; m < 12; m++) {
      h += `<td><input type="number" min="0" step="100" inputmode="numeric" value="${+arr[m] || ""}" data-k="${m}"></td>`;
    }
    h += `<td class="tt">${fmtInt(sum(arr))}</td><td class="del"><button title="删除该细项">×</button></td></tr>`;
  });
  h += "</tbody>";
  $("enGrid").innerHTML = h;
  $("enGrid").querySelectorAll("input").forEach((inp) => {
    inp.addEventListener("change", async () => {
      const tr = inp.closest("tr");
      const it = c.items.find((x) => x.id === tr.dataset.iid);
      if (!it) return;
      if (inp.dataset.k === "name") {
        const name = inp.value.trim();
        if (name && name !== it.name) {
          it.name = name;
          if (await renameItem(it, name)) toast("✅ 名称已保存并同步");
        }
      } else {
        const m = +inp.dataset.k;
        const arr = (enMode === "b" ? it.b : it.a).slice();
        arr[m] = Math.max(0, +inp.value || 0);
        if (enMode === "b") it.b = arr;
        else it.a = arr;
        tr.querySelector("td.tt").textContent = fmtInt(sum(arr));
        if (await saveItemRow(it, enMode, arr)) toast("✅ 已保存，全员实时更新");
      }
    });
  });
  $("enGrid").querySelectorAll("td.del button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      const it = c.items.find((x) => x.id === tr.dataset.iid);
      if (!it) return;
      const ok = await confirmModal(`删除细项「${it.name}」？关联的提报记录会保留但不再计入该细项。`);
      if (!ok) return;
      try {
        await deleteItem(it);
        toast("已删除");
        renderGrid();
      } catch (e) {
        toast("删除失败：" + (e.message || e));
      }
    });
  });
}
async function onAddItem() {
  const c = curCat();
  if (!c) return;
  const name = await askModal({ title: "新细项名称", placeholder: "如：双十一投放" });
  if (!name) return;
  try {
    await addItem(c.id, name);
    toast("已添加细项");
    renderGrid();
  } catch (e) {
    toast("失败：" + (e.message || e));
  }
}
async function onAddUnplanned() {
  let c = S.cats.find((x) => x.unplanned);
  const name = await askModal({ title: "计划外支出名称", placeholder: "如：样品国际加急费" });
  if (!name) return;
  try {
    if (!c) {
      toast("未找到计划外大项");
      return;
    }
    await addItem(c.id, name, "计划外");
    enCatId = c.id;
    renderEntry();
    toast("已加入「计划外支出」，在对应月份填实际金额");
  } catch (e) {
    toast("失败：" + (e.message || e));
  }
}
async function onAddCat() {
  const name = await askModal({ title: "新大项名称", placeholder: "如：物流仓储" });
  if (!name) return;
  try {
    await addCategory(name);
    toast("已添加大项");
    renderEntry();
  } catch (e) {
    toast("失败：" + (e.message || e));
  }
}
const ROLE_TXT = { admin: "管理员", approver: "审批人", member: "成员" };
function bindMe() {
  $("meKeySave").addEventListener("click", async () => {
    try {
      await saveNotifyKey($("meKey").value);
      toast($("meKey").value.trim() ? "✅ 已保存，审批动态将推送到你的微信" : "已清空推送设置");
      renderMe();
    } catch (e) {
      toast("保存失败：" + (e.message || e));
    }
  });
  $("btnLogout").addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });
}
function renderMe() {
  const m = S.member;
  $("meCard").innerHTML = `
    <div class="mn">👤 ${esc(m.name)}</div>
    <div class="mr">角色：${ROLE_TXT[m.role]}${m.role === "approver" ? " · 可在「审批」页批准/拒绝提报" : ""}</div>
    <div class="me">${esc(m.email)}</div>`;
  $("meKey").value = m.notify_key || "";
  const list = S.notifications;
  $("meNotifs").innerHTML = list.length ? list.map((n) => `
    <div class="ntf ${n.read ? "" : "unread"}" data-nid="${n.id}">
      <div class="nt">${esc(n.title)}</div>
      <div class="nb">${esc(n.body)}</div>
      <div class="nd">${timeAgo(n.created_at)}${n.read ? "" : " · 点击标记已读"}</div>
    </div>`).join("") : '<div class="empty">暂无消息</div>';
  document.querySelectorAll("#meNotifs .ntf.unread").forEach((el) => {
    el.addEventListener("click", async () => {
      await markRead(el.dataset.nid);
      renderMe();
    });
  });
}
const TABS = [
  { id: "ov", label: "总览" },
  { id: "mo", label: "月度" },
  { id: "qu", label: "季度" },
  { id: "it", label: "细项" },
  { id: "ml", label: "月报" },
  { id: "sb", label: "📝 提报" },
  { id: "ap", label: "✅ 审批", approver: true },
  { id: "ad", label: "⚙️ 管理", admin: true },
  { id: "me", label: "我的" }
];
function visibleTabs() {
  return TABS.filter((t) => (!t.approver || isApprover()) && (!t.admin || isAdmin()));
}
function renderTabs() {
  const tabs = visibleTabs();
  if (!tabs.some((t) => t.id === S.view)) S.view = "ov";
  $("tabs").innerHTML = tabs.map(
    (t) => `<button class="tab ${t.id === S.view ? "on" : ""}" data-v="${t.id}">${t.label}${t.id === "ap" && pendingCount() ? ` (${pendingCount()})` : ""}</button>`
  ).join("");
  document.querySelectorAll("#tabs .tab").forEach((b) => {
    b.addEventListener("click", () => {
      S.view = b.dataset.v;
      renderApp();
    });
  });
}
const pendingCount = () => S.records.filter((r) => r.status === "pending").length;
function renderApp() {
  renderTabs();
  document.querySelectorAll(".view").forEach((x) => x.classList.remove("on"));
  $("v-" + S.view).classList.add("on");
  const badge = $("bellBadge");
  const n = unreadCount();
  badge.style.display = n ? "flex" : "none";
  badge.textContent = n > 99 ? "99+" : n;
  $("yrTag").textContent = S.meta.yearLabel || S.meta.year + " 年度";
  if (S.view === "ov") renderOverview();
  else if (S.view === "mo") renderMonth();
  else if (S.view === "qu") renderQuarter();
  else if (S.view === "it") renderItems();
  else if (S.view === "ml") renderMonthly();
  else if (S.view === "sb") renderSubmit();
  else if (S.view === "ap") renderApprove();
  else if (S.view === "ad") renderAdmin();
  else if (S.view === "me") renderMe();
}
S.rerender = () => {
  if (!S.member) return;
  renderApp();
};
function bindDrawer() {
  const open = async () => {
    renderNotifDrawer();
    $("notifDrawer").classList.add("on");
  };
  $("btnBell").addEventListener("click", open);
  $("notifMask").addEventListener("click", () => $("notifDrawer").classList.remove("on"));
  $("notifReadAll").addEventListener("click", async () => {
    await markAllRead();
    renderNotifDrawer();
    renderApp();
  });
}
function renderNotifDrawer() {
  const list = S.notifications;
  $("notifList").innerHTML = list.length ? list.map((n) => `
    <div class="ntf ${n.read ? "" : "unread"}">
      <div class="nt">${esc(n.title)}</div>
      <div class="nb">${esc(n.body)}</div>
      <div class="nd">${new Date(n.created_at).toLocaleString("zh-CN")}</div>
    </div>`).join("") : '<div class="empty">暂无通知</div>';
}
let authMode = "login";
function bindAuth() {
  document.querySelectorAll("#authPills button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#authPills button").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      authMode = b.dataset.m;
      $("authName").style.display = authMode === "signup" ? "" : "none";
      $("authGo").textContent = authMode === "signup" ? "注 册" : "登 录";
      hideErr();
    });
  });
  $("authGo").addEventListener("click", onAuthGo);
  ["authEmail", "authPass", "authName"].forEach(
    (id) => $(id).addEventListener("keydown", (e) => {
      if (e.key === "Enter") onAuthGo();
    })
  );
  $("setupToggle").addEventListener("click", () => {
    const box = $("setupBox");
    box.style.display = box.style.display === "none" ? "" : "none";
  });
  $("setupGo").addEventListener("click", onSetup);
  $("denyLogout").addEventListener("click", async () => {
    await sb.auth.signOut();
    location.reload();
  });
}
function showErr(m, ok = false) {
  const e = $("authErr");
  e.textContent = m;
  e.style.display = "block";
  e.classList.toggle("ok", ok);
}
function hideErr() {
  $("authErr").style.display = "none";
}
async function onAuthGo() {
  const email = $("authEmail").value.trim();
  const pass = $("authPass").value;
  const name = $("authName").value.trim();
  hideErr();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    showErr("请输入正确的邮箱");
    return;
  }
  if (pass.length < 6) {
    showErr("密码至少 6 位");
    return;
  }
  $("authGo").disabled = true;
  try {
    if (authMode === "signup") {
      if (!name) {
        showErr("请填写姓名（提报时留名用）");
        return;
      }
      const { data, error } = await sb.auth.signUp({
        email,
        password: pass,
        options: { data: { display_name: name } }
      });
      if (error) throw error;
      if (data.session) {
        await boot();
      } else {
        showErr("✅ 注册成功！请到邮箱点击验证链接后再登录。", true);
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      await boot();
    }
  } catch (e) {
    showErr(authMode === "login" ? "登录失败：邮箱或密码不正确（或邮箱未验证）" : "注册失败：" + (e.message || e));
  } finally {
    $("authGo").disabled = false;
  }
}
async function onSetup() {
  const code = $("setupCode").value.trim();
  if (!code) {
    showErr("请输入初始化码");
    return;
  }
  if (!S.session) {
    showErr("请先注册并登录，再输入初始化码");
    return;
  }
  const name = $("authName").value.trim() || $("authEmail").value.split("@")[0];
  $("setupGo").disabled = true;
  try {
    await sb.rpc("claim_admin", { setup_code: code, display_name: name });
    toast("🎉 管理员初始化成功");
    await boot();
  } catch (e) {
    showErr("初始化失败：" + (e.message || e));
  } finally {
    $("setupGo").disabled = false;
  }
}
function show(id) {
  ["authScr", "denyScr", "app"].forEach((x) => $(x).style.display = x === id ? x === "app" ? "" : "flex" : "none");
}
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  S.session = session;
  if (!session) {
    show("authScr");
    return;
  }
  try {
    await sb.rpc("link_my_member");
  } catch (_) {
  }
  const { data: mem } = await sb.from("members").select("*").eq("user_id", session.user.id).maybeSingle();
  if (!mem) {
    $("denyTitle").textContent = "暂无访问权限";
    $("denyMsg").innerHTML = `当前账号 <b>${esc(session.user.email)}</b> 不在成员名单中。<br>请联系管理员添加，或回到登录页用初始化码初始化管理员。`;
    show("denyScr");
    return;
  }
  if (!mem.active) {
    $("denyTitle").textContent = "账号已停用";
    $("denyMsg").innerHTML = "你的访问权限已被管理员停用。<br>如有疑问请联系管理员。";
    show("denyScr");
    return;
  }
  S.member = mem;
  try {
    await loadAll();
  } catch (e) {
    toast("数据加载失败，请检查网络后刷新");
  }
  show("app");
  startRealtime();
  renderApp();
}
function bindStatic() {
  bindMonthPills();
  bindMonthModal();
  bindMonthly();
  bindSubmit();
  bindAdmin();
  bindMe();
  bindDrawer();
  bindAuth();
  $("btnRefresh").addEventListener("click", async () => {
    toast("正在同步最新数据…");
    await loadAll().catch(() => toast("同步失败，请检查网络"));
    renderApp();
    toast("✅ 已是最新");
  });
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") show("authScr");
  });
}
bindStatic();
boot();
