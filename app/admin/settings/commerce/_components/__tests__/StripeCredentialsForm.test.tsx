import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { StripeCredentialsForm } from "../StripeCredentialsForm";

jest.mock("@/lib/demo", () => ({ IS_DEMO: false }));

const mockToast = jest.fn();
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const mockFetch = global.fetch as jest.Mock;

// ── response factories ────────────────────────────────────────────────────────

function makeConfigResponse(dbOverrides: Record<string, unknown> = {}) {
  return {
    ok: true,
    json: async () => ({
      envSecretSet: false,
      envWebhookSet: false,
      envPublishableSet: false,
      db: {
        hasRow: false,
        hasSecretKey: false,
        hasWebhookSecret: false,
        publishableKey: null,
        accountId: null,
        accountName: null,
        isTestMode: null,
        lastValidatedAt: null,
        decryptionError: false,
        secretKeyMasked: null,
        webhookSecretMasked: null,
        ...dbOverrides,
      },
    }),
  };
}

function savedConfigResponse() {
  return makeConfigResponse({
    hasRow: true,
    hasSecretKey: true,
    hasWebhookSecret: true,
    publishableKey: "pk_test_existing123",
    secretKeyMasked: "••••••••1234",
    webhookSecretMasked: "••••••••abcd",
  });
}

function successResponse() {
  return { ok: true, json: async () => ({ success: true }) };
}

// ── helpers ───────────────────────────────────────────────────────────────────

async function renderAndLoad(fetchReturn = makeConfigResponse()) {
  mockFetch.mockResolvedValue(fetchReturn);
  const result = render(<StripeCredentialsForm />);
  await waitFor(() =>
    expect(screen.queryByText("Loading Stripe configuration…")).not.toBeInTheDocument()
  );
  return result;
}

function getInputById(id: string) {
  return document.getElementById(id) as HTMLInputElement;
}

beforeEach(() => {
  // resetAllMocks flushes queued mockResolvedValueOnce calls too,
  // preventing stale responses from leaking into the next test
  jest.resetAllMocks();
  jest.useRealTimers();
});

// ── required field validation ────────────────────────────────────────────────

describe("required field validation", () => {
  it("shows Required field on all three fields when Save is clicked with nothing filled", async () => {
    await renderAndLoad();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    const errors = await screen.findAllByText("Required field");
    expect(errors).toHaveLength(3);
  });

  it("clears the required field error on the field the user starts typing in", async () => {
    await renderAndLoad();
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await screen.findAllByText("Required field"); // all 3 visible

    fireEvent.change(getInputById("stripe-secret-key"), { target: { value: "sk_test_x" } });

    await waitFor(() =>
      expect(screen.queryAllByText("Required field")).toHaveLength(2)
    );
  });

  it("does not show required field errors when all fields are pre-populated from DB", async () => {
    mockFetch
      .mockResolvedValueOnce(savedConfigResponse()) // initial GET
      .mockResolvedValueOnce(successResponse())     // PUT (short-circuit on server)
      .mockResolvedValueOnce(savedConfigResponse()); // re-fetch after save

    render(<StripeCredentialsForm />);
    await waitFor(() =>
      expect(screen.queryByText("Loading Stripe configuration…")).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    // PUT is called (validation passed) and no required field errors appear
    await waitFor(() =>
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/admin/settings/stripe",
        expect.objectContaining({ method: "PUT" })
      )
    );
    expect(screen.queryByText("Required field")).not.toBeInTheDocument();
  });
});

// ── icon state ───────────────────────────────────────────────────────────────

describe("icon state", () => {
  it("does not render the green check icon on initial load even with DB-saved values", async () => {
    const { container } = await renderAndLoad(savedConfigResponse());
    // .text-emerald-500 is exclusive to the CheckCircle2 (green) icon
    expect(container.querySelectorAll(".text-emerald-500")).toHaveLength(0);
  });

  it("renders the muted circle icon when the user types in a field (dirty, not yet saved)", async () => {
    const { container } = await renderAndLoad();
    fireEvent.change(getInputById("stripe-secret-key"), { target: { value: "sk_test_x" } });
    expect(container.querySelector(".text-muted-foreground\\/30")).toBeInTheDocument();
  });

  it("shows green check icons on all fields after a successful save", async () => {
    const { container } = await renderAndLoad();

    fireEvent.change(getInputById("stripe-secret-key"), { target: { value: "sk_test_valid" } });
    fireEvent.change(getInputById("stripe-publishable-key"), { target: { value: "pk_test_valid" } });
    fireEvent.change(getInputById("stripe-webhook-secret"), { target: { value: "whsec_valid" } });

    mockFetch
      .mockResolvedValueOnce(successResponse())
      .mockResolvedValueOnce(savedConfigResponse());

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() =>
      expect(container.querySelectorAll(".text-emerald-500").length).toBeGreaterThan(0)
    );
  });

});

// ── dirty field tracking ──────────────────────────────────────────────────────

describe("dirty field tracking — PUT body contains only changed fields", () => {
  it("sends only the publishable key when that is the only changed field", async () => {
    mockFetch
      .mockResolvedValueOnce(savedConfigResponse()) // GET
      .mockResolvedValueOnce(successResponse())     // PUT
      .mockResolvedValueOnce(savedConfigResponse()); // re-fetch

    render(<StripeCredentialsForm />);
    await waitFor(() =>
      expect(screen.queryByText("Loading Stripe configuration…")).not.toBeInTheDocument()
    );

    // Change only pub key
    fireEvent.change(getInputById("stripe-publishable-key"), {
      target: { value: "pk_test_changed" },
    });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(
        (c: unknown[]) => (c[1] as RequestInit)?.method === "PUT"
      );
      expect(putCall).toBeDefined();
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body).toEqual({ publishableKey: "pk_test_changed" });
      expect(body).not.toHaveProperty("secretKey");
      expect(body).not.toHaveProperty("webhookSecret");
    });
  });

  it("sends an empty body when no fields were changed (server short-circuits)", async () => {
    mockFetch
      .mockResolvedValueOnce(savedConfigResponse())
      .mockResolvedValueOnce(successResponse())
      .mockResolvedValueOnce(savedConfigResponse());

    render(<StripeCredentialsForm />);
    await waitFor(() =>
      expect(screen.queryByText("Loading Stripe configuration…")).not.toBeInTheDocument()
    );

    // Click Save without changing anything
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(
        (c: unknown[]) => (c[1] as RequestInit)?.method === "PUT"
      );
      expect(putCall).toBeDefined();
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body).toEqual({});
    });
  });

  it("sends all three fields when all three are changed", async () => {
    const { container } = await renderAndLoad();

    fireEvent.change(container.querySelector("#stripe-secret-key")!, { target: { value: "sk_test_new" } });
    fireEvent.change(container.querySelector("#stripe-publishable-key")!, { target: { value: "pk_test_new" } });
    fireEvent.change(container.querySelector("#stripe-webhook-secret")!, { target: { value: "whsec_new" } });

    mockFetch
      .mockResolvedValueOnce(successResponse())
      .mockResolvedValueOnce(savedConfigResponse());

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(
        (c: unknown[]) => (c[1] as RequestInit)?.method === "PUT"
      );
      const body = JSON.parse((putCall![1] as RequestInit).body as string);
      expect(body).toEqual({
        secretKey: "sk_test_new",
        publishableKey: "pk_test_new",
        webhookSecret: "whsec_new",
      });
    });
  });
});
