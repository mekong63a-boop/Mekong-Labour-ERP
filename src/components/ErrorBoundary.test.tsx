import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function ThrowingComponent(): JSX.Element {
  throw new Error("Test error");
}

function GoodComponent() {
  return <div>Everything works</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );
    expect(screen.getByText("Everything works")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Đã xảy ra lỗi")).toBeInTheDocument();
    expect(screen.getByText("Tải lại trang")).toBeInTheDocument();
    
    spy.mockRestore();
  });

  it("renders custom fallback when provided", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    render(
      <ErrorBoundary fallback={<div>Custom Error</div>}>
        <ThrowingComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText("Custom Error")).toBeInTheDocument();
    
    spy.mockRestore();
  });
});
