import { describe, it, expect, vi } from "vitest";
import { subscribe, notify } from "@/lib/sse";

describe("SSE pub/sub", () => {
  it("notifies a subscriber", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);

    notify();
    expect(fn).toHaveBeenCalledTimes(1);

    unsub();
  });

  it("notifies multiple subscribers", () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    const unsub1 = subscribe(fn1);
    const unsub2 = subscribe(fn2);

    notify();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);

    unsub1();
    unsub2();
  });

  it("stops notifying after unsubscribe", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);

    notify();
    expect(fn).toHaveBeenCalledTimes(1);

    unsub();
    notify();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles multiple notify calls", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);

    notify();
    notify();
    notify();
    expect(fn).toHaveBeenCalledTimes(3);

    unsub();
  });

  it("unsubscribe is idempotent", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);

    unsub();
    unsub(); // should not throw

    notify();
    expect(fn).not.toHaveBeenCalled();
  });
});
