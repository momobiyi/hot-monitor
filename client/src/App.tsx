import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";
import { createMonitor, getEvents, getMonitors, getSourceHealth, patchMonitor, runOnce } from "./api";
import { normalizeEventUrl } from "./links";
import { socket } from "./socket";
import type { HotspotEvent, Monitor, SourceHealth, SourceName } from "./types";

const ALL_SOURCES: SourceName[] = [
  "twitter",
  "bing",
  "google",
  "duckduckgo",
  "hackernews",
  "sogou",
  "bilibili",
  "weibo"
];

const SOURCE_LABEL: Record<SourceName, string> = {
  twitter: "Twitter/X",
  bing: "Bing",
  google: "Google",
  duckduckgo: "DuckDuckGo",
  hackernews: "Hacker News",
  sogou: "搜狗",
  bilibili: "B站",
  weibo: "微博"
};

type ViewKey = "dashboard" | "management";

const NAV_ITEMS: Array<{ key: ViewKey; label: string }> = [
  { key: "dashboard", label: "仪表盘" },
  { key: "management", label: "管理" }
];

export function App() {
  const [activeView, setActiveView] = useState<ViewKey>("dashboard");
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [events, setEvents] = useState<HotspotEvent[]>([]);
  const [health, setHealth] = useState<SourceHealth[]>([]);
  const [query, setQuery] = useState("AI 大模型更新");
  const [type, setType] = useState<"keyword" | "topic">("keyword");
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [selectedSources, setSelectedSources] = useState<SourceName[]>(ALL_SOURCES);
  const [scanStatus, setScanStatus] = useState("待命");
  const [error, setError] = useState("");

  const confidenceAverage = useMemo(() => {
    if (events.length === 0) return 0;
    return Math.round((events.reduce((sum, event) => sum + event.confidence, 0) / events.length) * 100);
  }, [events]);

  async function refresh() {
    const [nextMonitors, nextEvents, nextHealth] = await Promise.all([
      getMonitors(),
      getEvents(),
      getSourceHealth()
    ]);
    setMonitors(nextMonitors);
    setEvents(nextEvents);
    setHealth(nextHealth);
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err.message));
    socket.on("scan:started", () => setScanStatus("扫描中"));
    socket.on("scan:finished", () => {
      setScanStatus("待命");
      void refresh();
    });
    socket.on("source:error", (payload: { source: SourceName; message: string }) => {
      setError(`${SOURCE_LABEL[payload.source]}: ${payload.message}`);
      void refresh();
    });
    socket.on("hotspot:new", (event: HotspotEvent) => {
      setEvents((current) => [event, ...current]);
      notify(event);
    });
    return () => {
      socket.off("scan:started");
      socket.off("scan:finished");
      socket.off("source:error");
      socket.off("hotspot:new");
    };
  }, []);

  async function handleCreateMonitor() {
    setError("");
    const monitor = await createMonitor({
      type,
      query,
      sources: selectedSources,
      intervalMinutes,
      enabled: true
    });
    setMonitors((current) => [monitor, ...current.filter((item) => item.id !== monitor.id)]);
  }

  async function handleToggleMonitor(monitor: Monitor) {
    const next = await patchMonitor(monitor.id, { enabled: !monitor.enabled });
    setMonitors((current) => current.map((item) => (item.id === next.id ? next : item)));
  }

  async function handleRunOnce() {
    setError("");
    setScanStatus("扫描中");
    try {
      await runOnce();
      await refresh();
      setActiveView("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setScanStatus("待命");
    }
  }

  async function requestNotifications() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">↯</div>
          <div>
            <h1>热点监控</h1>
            <p>AI 实时热点追踪</p>
          </div>
        </div>
        <div className="top-actions">
          <button className="primary-button compact" onClick={handleRunOnce}>立即检查</button>
          <button className="bell-button" onClick={requestNotifications} aria-label="通知权限">
            <span>9+</span>
          </button>
        </div>
      </header>

      <nav className="main-nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={activeView === item.key ? "nav-tab active" : "nav-tab"}
            onClick={() => setActiveView(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeView === "dashboard" ? (
        <DashboardView
          monitors={monitors}
          events={events}
          confidenceAverage={confidenceAverage}
          scanStatus={scanStatus}
        />
      ) : null}

      {activeView === "management" ? (
        <ManagementView
          monitors={monitors}
          health={health}
          type={type}
          query={query}
          intervalMinutes={intervalMinutes}
          selectedSources={selectedSources}
          error={error}
          setType={setType}
          setQuery={setQuery}
          setIntervalMinutes={setIntervalMinutes}
          setSelectedSources={setSelectedSources}
          requestNotifications={requestNotifications}
          handleCreateMonitor={handleCreateMonitor}
          handleRunOnce={handleRunOnce}
          handleToggleMonitor={handleToggleMonitor}
        />
      ) : null}
    </div>
  );
}

function DashboardView({
  monitors,
  events,
  confidenceAverage,
  scanStatus
}: {
  monitors: Monitor[];
  events: HotspotEvent[];
  confidenceAverage: number;
  scanStatus: string;
}) {
  const urgentCount = events.filter((event) => event.confidence >= 0.9).length;

  return (
    <main className="page-view dashboard-page">
      <section className="dashboard-metrics">
        <Metric label="总热点" value={events.length} tone="primary" />
        <Metric label="今日新增" value={events.length} tone="cyan" />
        <Metric label="紧急热点" value={urgentCount} tone="danger" />
        <Metric label="监控关键词" value={monitors.length} tone="success" />
      </section>

      <section className="event-feed">
        <div className="section-head">
          <h2>最新热点</h2>
          <div className="status-pill inline">
            <span className={scanStatus === "扫描中" ? "pulse-dot active" : "pulse-dot"} />
            {scanStatus} / 平均置信 {confidenceAverage}%
          </div>
        </div>
        <div className="stack">
          {events.length === 0 ? <Empty text="还没有热点，添加监控后运行一次扫描。" /> : null}
          {events.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-meta">
                <span className="level-pill">{event.confidence >= 0.9 ? "HIGH" : "MEDIUM"}</span>
                <span>{SOURCE_LABEL[event.source]}</span>
                <strong>{Math.round(event.confidence * 100)}%</strong>
              </div>
              <h3>
                <a href={normalizeEventUrl(event.url, event.source)} target="_blank" rel="noreferrer">
                  {event.title}
                </a>
              </h3>
              <p>{event.snippet}</p>
              <div className="evidence">
                <span>AI 理由</span>
                <p>{event.reason}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function ManagementView({
  monitors,
  health,
  type,
  query,
  intervalMinutes,
  selectedSources,
  error,
  setType,
  setQuery,
  setIntervalMinutes,
  setSelectedSources,
  requestNotifications,
  handleCreateMonitor,
  handleRunOnce,
  handleToggleMonitor
}: {
  monitors: Monitor[];
  health: SourceHealth[];
  type: "keyword" | "topic";
  query: string;
  intervalMinutes: number;
  selectedSources: SourceName[];
  error: string;
  setType: (type: "keyword" | "topic") => void;
  setQuery: (query: string) => void;
  setIntervalMinutes: (minutes: number) => void;
  setSelectedSources: Dispatch<SetStateAction<SourceName[]>>;
  requestNotifications: () => Promise<void>;
  handleCreateMonitor: () => Promise<void>;
  handleRunOnce: () => Promise<void>;
  handleToggleMonitor: (monitor: Monitor) => Promise<void>;
}) {
  return (
    <main className="page-view management-page">
      <section className="health-panel">
        <div className="section-head">
          <h2>来源健康</h2>
        </div>
        <div className="health-grid">
          {ALL_SOURCES.map((source) => {
            const item = health.find((candidate) => candidate.source === source);
            const ok = item?.status === "ok";
            return (
              <div className={ok ? "health-card ok" : "health-card"} key={source}>
                <span>{SOURCE_LABEL[source]}</span>
                <strong>{item?.status ?? "未扫描"}</strong>
                <small>{item?.errorMessage ?? `${item?.itemCount ?? 0} 条`}</small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="control-panel">
        <div className="section-head">
          <h2>监控配置</h2>
          <button className="ghost-button" onClick={requestNotifications}>通知权限</button>
        </div>
        <div className="form-grid">
          <label>
            <span>类型</span>
            <select value={type} onChange={(event) => setType(event.target.value as "keyword" | "topic")}>
              <option value="keyword">关键词</option>
              <option value="topic">主题范围</option>
            </select>
          </label>
          <label>
            <span>频率</span>
            <select value={intervalMinutes} onChange={(event) => setIntervalMinutes(Number(event.target.value))}>
              {[5, 15, 30, 60].map((value) => (
                <option key={value} value={value}>{value} 分钟</option>
              ))}
            </select>
          </label>
          <label className="wide">
            <span>监控内容</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </div>
        <div className="source-grid">
          {ALL_SOURCES.map((source) => (
            <button
              key={source}
              className={selectedSources.includes(source) ? "source-chip selected" : "source-chip"}
              onClick={() =>
                setSelectedSources((current) =>
                  current.includes(source)
                    ? current.filter((item) => item !== source)
                    : [...current, source]
                )
              }
            >
              {SOURCE_LABEL[source]}
            </button>
          ))}
        </div>
        <div className="actions">
          <button className="primary-button" onClick={handleCreateMonitor}>添加监控</button>
          <button className="secondary-button" onClick={handleRunOnce}>立即扫描</button>
        </div>
        {error ? <p className="error-line">{error}</p> : null}
      </section>

      <section className="monitor-list">
        <div className="section-head">
          <h2>监控队列</h2>
        </div>
        <div className="stack">
          {monitors.length === 0 ? <Empty text="还没有监控项，先到监控配置添加一个关键词。" /> : null}
          {monitors.map((monitor) => (
            <button key={monitor.id} className="monitor-row" onClick={() => handleToggleMonitor(monitor)}>
              <span>
                <strong>{monitor.query}</strong>
                <small>{monitor.sources.length} 源 / {monitor.intervalMinutes} 分钟</small>
              </span>
              <em>{monitor.enabled ? "ON" : "OFF"}</em>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  tone?: "primary" | "cyan" | "danger" | "success";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="empty">{text}</div>;
}

function notify(event: HotspotEvent) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification("热点监控捕获高置信信号", {
    body: event.title
  });
}
