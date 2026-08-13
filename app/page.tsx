"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Transport = "飞机" | "高铁" | "火车" | "地铁" | "公交" | "打车" | "自驾" | "骑行" | "步行" | "轮渡";
type ItineraryItem = { id: string; date: string; startTime: string; endTime: string; title: string; location: string; transport: Transport; details: string; note: string };
type Plan = { title: string; destination: string; dateRange: string; companions: string; items: ItineraryItem[] };

const transportOptions: Transport[] = ["飞机", "高铁", "火车", "地铁", "公交", "打车", "自驾", "骑行", "步行", "轮渡"];
const transportIcon: Record<Transport, string> = { 飞机: "✈", 高铁: "⌁", 火车: "▰", 地铁: "M", 公交: "▣", 打车: "◆", 自驾: "◇", 骑行: "◉", 步行: "●", 轮渡: "≈" };

const samplePlan: Plan = {
  title: "南京 · 周末漫游", destination: "南京", dateRange: "8月15日 — 8月16日", companions: "2 位旅行者",
  items: [
    { id: "sample-1", date: "8月15日 · 周六", startTime: "10:25", endTime: "11:47", title: "抵达南京", location: "上海虹桥 → 南京南", transport: "高铁", details: "G12 · 05车 08A/08B", note: "提前 30 分钟到站，南京南站北广场出站。" },
    { id: "sample-2", date: "8月15日 · 周六", startTime: "12:10", endTime: "12:40", title: "前往酒店", location: "南京南站 → 新街口", transport: "地铁", details: "1号线 · 北广场入口 · 15号口出", note: "约 9 站，出站后步行 280 米。" },
    { id: "sample-3", date: "8月15日 · 周六", startTime: "14:00", endTime: "16:30", title: "梧桐大道散步", location: "陵园路 · 美龄宫周边", transport: "步行", details: "约 3.2 km · 轻松路线", note: "带一瓶水，下午光线适合拍照。" },
    { id: "sample-4", date: "8月15日 · 周六", startTime: "20:30", endTime: "22:30", title: "The Rebirth Bar", location: "南台巷东3号 107室", transport: "打车", details: "预计 18 分钟 · 约 ¥24", note: "晚餐后出发，返程可直接打车回酒店。" },
  ],
};

const emptyItem = (): ItineraryItem => ({ id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, date: "", startTime: "09:00", endTime: "10:00", title: "", location: "", transport: "步行", details: "", note: "" });

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);
}

export default function Home() {
  const [plan, setPlan] = useState<Plan>(samplePlan);
  const [editing, setEditing] = useState<ItineraryItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("正在同步…");
  const [dragId, setDragId] = useState<string | null>(null);
  const initialized = useRef(false);

  const days = useMemo(() => {
    const result: { date: string; items: ItineraryItem[] }[] = [];
    for (const item of plan.items) {
      const group = result.find((entry) => entry.date === item.date);
      if (group) group.items.push(item); else result.push({ date: item.date || "待定日期", items: [item] });
    }
    return result;
  }, [plan.items]);

  useEffect(() => {
    fetch("/api/plan").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => data.plan && setPlan(data.plan)).catch(() => setStatus("暂时离线，内容将保留在当前页面")).finally(() => { initialized.current = true; setStatus("已自动保存") });
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    setStatus("正在保存…");
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/plan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
        if (!response.ok) throw new Error();
        setStatus("已自动保存");
      } catch { setStatus("保存失败，请稍后重试") }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [plan]);

  function openNew() { setEditing(emptyItem()); setIsOpen(true) }
  function openEdit(item: ItineraryItem) { setEditing({ ...item }); setIsOpen(true) }
  function saveItem(event: React.FormEvent) {
    event.preventDefault(); if (!editing || !editing.title.trim()) return;
    setPlan((current) => { const exists = current.items.some((item) => item.id === editing.id); return { ...current, items: exists ? current.items.map((item) => item.id === editing.id ? editing : item) : [...current.items, editing] } });
    setIsOpen(false);
  }
  function removeItem(id: string) { setPlan((current) => ({ ...current, items: current.items.filter((item) => item.id !== id) })); setIsOpen(false) }
  function reorder(targetId: string) {
    if (!dragId || dragId === targetId) return;
    setPlan((current) => { const items = [...current.items]; const from = items.findIndex((item) => item.id === dragId); const to = items.findIndex((item) => item.id === targetId); const [moved] = items.splice(from, 1); items.splice(to, 0, moved); return { ...current, items } });
  }
  function exportWord() {
    const rows = plan.items.map((item) => `<tr><td>${escapeHtml(item.date)}</td><td>${escapeHtml(item.startTime)}–${escapeHtml(item.endTime)}</td><td>${escapeHtml(item.title)}<br>${escapeHtml(item.location)}</td><td>${escapeHtml(item.transport)}<br>${escapeHtml(item.details)}</td><td>${escapeHtml(item.note)}</td></tr>`).join("");
    const html = `<html><meta charset="utf-8"><body><h1>${escapeHtml(plan.title)}</h1><p>${escapeHtml(plan.destination)} · ${escapeHtml(plan.dateRange)} · ${escapeHtml(plan.companions)}</p><table border="1" cellspacing="0" cellpadding="8"><tr><th>日期</th><th>时间</th><th>行程</th><th>交通</th><th>备注</th></tr>${rows}</table></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `${plan.title || "旅行规划"}.doc`; link.click(); URL.revokeObjectURL(url);
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top" aria-label="旅迹首页"><span className="brand-mark">旅</span><span>旅迹</span></a>
      <div className="top-actions"><span className="save-status"><i />{status}</span><button className="button button-ghost" onClick={() => window.print()}>导出 PDF</button><button className="button button-ghost" onClick={exportWord}>导出 Word</button><button className="button button-primary" onClick={openNew}><span>＋</span> 新增行程</button></div>
    </header>

    <section className="hero" id="top"><div className="hero-glow glow-one" /><div className="hero-glow glow-two" /><div className="hero-content"><p className="eyebrow">MY JOURNEY</p>
      <input className="title-input" aria-label="旅行标题" value={plan.title} onChange={(event) => setPlan({ ...plan, title: event.target.value })} />
      <p className="hero-copy">把期待写进行程，让每一次出发都从容而清晰。</p>
      <div className="trip-meta">
        <label><span>目的地</span><input value={plan.destination} onChange={(event) => setPlan({ ...plan, destination: event.target.value })} /></label><b />
        <label><span>日期</span><input value={plan.dateRange} onChange={(event) => setPlan({ ...plan, dateRange: event.target.value })} /></label><b />
        <label><span>同行</span><input value={plan.companions} onChange={(event) => setPlan({ ...plan, companions: event.target.value })} /></label>
      </div>
    </div></section>

    <section className="planner-shell"><div className="section-heading"><div><p className="section-kicker">ITINERARY</p><h2>行程安排</h2></div><p>按住卡片拖动即可调整顺序</p></div>
      <div className="timeline">{days.map((day) => <section className="day-group" key={day.date}><div className="day-label"><span>{day.date}</span></div><div className="day-items">{day.items.map((item) =>
        <article className={`itinerary-card ${dragId === item.id ? "dragging" : ""}`} key={item.id} draggable onDragStart={() => setDragId(item.id)} onDragEnd={() => setDragId(null)} onDragOver={(event) => event.preventDefault()} onDrop={() => reorder(item.id)}>
          <button className="drag-handle" aria-label="拖动调整顺序">⠿</button><div className="time-block"><strong>{item.startTime}</strong><span>{item.endTime}</span></div><div className={`transport-icon transport-${item.transport}`}>{transportIcon[item.transport]}</div>
          <div className="card-main"><div className="card-title-row"><div><h3>{item.title}</h3><p className="location">{item.location}</p></div><button className="more-button" onClick={() => openEdit(item)} aria-label={`编辑${item.title}`}>•••</button></div><div className="transport-pill"><span>{item.transport}</span><i /><span>{item.details}</span></div>{item.note && <p className="note">{item.note}</p>}</div>
        </article>)}</div></section>)}</div>
      <button className="add-row" onClick={openNew}><span>＋</span> 添加下一段行程</button>
    </section>
    <footer><span className="brand-mark small">旅</span><p>把旅途，留在美好的秩序里。</p></footer>

    {isOpen && editing && <div className="modal-backdrop" onMouseDown={() => setIsOpen(false)}><form className="modal" onSubmit={saveItem} onMouseDown={(event) => event.stopPropagation()}>
      <div className="modal-heading"><div><p className="section-kicker">NEW STOP</p><h2>{plan.items.some((item) => item.id === editing.id) ? "编辑行程" : "新增行程"}</h2></div><button type="button" className="close-button" onClick={() => setIsOpen(false)} aria-label="关闭">×</button></div>
      <div className="form-grid">
        <label className="wide"><span>日期</span><input required placeholder="8月16日 · 周日" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></label>
        <label><span>开始时间</span><input type="time" required value={editing.startTime} onChange={(e) => setEditing({ ...editing, startTime: e.target.value })} /></label><label><span>结束时间</span><input type="time" required value={editing.endTime} onChange={(e) => setEditing({ ...editing, endTime: e.target.value })} /></label>
        <label className="wide"><span>行程名称</span><input required placeholder="例如：办理入住" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label>
        <label className="wide"><span>地点 / 路线</span><input placeholder="出发地 → 目的地，或景点地址" value={editing.location} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></label>
        <label><span>交通方式</span><select value={editing.transport} onChange={(e) => setEditing({ ...editing, transport: e.target.value as Transport })}>{transportOptions.map((transport) => <option key={transport}>{transport}</option>)}</select></label><label><span>交通详情</span><input placeholder="车次、座位、地铁线、费用" value={editing.details} onChange={(e) => setEditing({ ...editing, details: e.target.value })} /></label>
        <label className="wide"><span>行程备注</span><textarea rows={3} placeholder="入口/出口、集合点、预订信息、注意事项……" value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} /></label>
      </div>
      <div className="modal-actions">{plan.items.some((item) => item.id === editing.id) && <button type="button" className="delete-button" onClick={() => removeItem(editing.id)}>删除行程</button>}<span /><button type="button" className="button button-ghost" onClick={() => setIsOpen(false)}>取消</button><button type="submit" className="button button-primary">保存行程</button></div>
    </form></div>}
  </main>
}
