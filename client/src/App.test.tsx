import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { App } from "./App";

describe("App", () => {
  it("renders the dashboard shell and navigation", () => {
    const html = renderToString(<App />);
    expect(html).toContain("热点监控");
    expect(html).toContain("仪表盘");
    expect(html).toContain("管理");
    expect(html).toContain("最新热点");
  });
});
