import { encrypt, decrypt, isEncryptionKeySet } from "../encryption";

const VALID_KEY = "a".repeat(64); // 64 hex chars = 32 bytes

function withKey(key: string | undefined, fn: () => void) {
  const original = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  if (key === undefined) {
    delete process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  } else {
    process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY = key;
  }
  try {
    fn();
  } finally {
    if (original === undefined) {
      delete process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
    } else {
      process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY = original;
    }
  }
}

describe("encrypt / decrypt", () => {
  it("round-trips a plaintext string", () => {
    withKey(VALID_KEY, () => {
      const plaintext = "sk_test_abc123";
      const envelope = encrypt(plaintext);
      expect(decrypt(envelope)).toBe(plaintext);
    });
  });

  it("produces a versioned v1 envelope", () => {
    withKey(VALID_KEY, () => {
      const envelope = encrypt("hello");
      expect(envelope).toMatch(/^v1:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+:[A-Za-z0-9+/=]+$/);
    });
  });

  it("generates unique ciphertext each call (random IV)", () => {
    withKey(VALID_KEY, () => {
      const a = encrypt("same");
      const b = encrypt("same");
      expect(a).not.toBe(b);
      expect(decrypt(a)).toBe("same");
      expect(decrypt(b)).toBe("same");
    });
  });

  it("throws on tampered ciphertext", () => {
    withKey(VALID_KEY, () => {
      const envelope = encrypt("secret");
      const parts = envelope.split(":");
      // Corrupt the ciphertext segment
      parts[3] = Buffer.from("tampered").toString("base64");
      expect(() => decrypt(parts.join(":"))).toThrow();
    });
  });

  it("throws on tampered auth tag", () => {
    withKey(VALID_KEY, () => {
      const envelope = encrypt("secret");
      const parts = envelope.split(":");
      parts[2] = Buffer.from("badtag000000000000").toString("base64");
      expect(() => decrypt(parts.join(":"))).toThrow();
    });
  });

  it("throws when decrypting with the wrong key", () => {
    withKey(VALID_KEY, () => {
      const envelope = encrypt("secret");
      withKey("b".repeat(64), () => {
        expect(() => decrypt(envelope)).toThrow();
      });
    });
  });

  it("throws on malformed envelope (missing parts)", () => {
    withKey(VALID_KEY, () => {
      expect(() => decrypt("v1:onlytwoparts")).toThrow(
        "Invalid encryption envelope"
      );
    });
  });

  it("throws on unknown version prefix", () => {
    withKey(VALID_KEY, () => {
      const envelope = encrypt("x").replace(/^v1:/, "v2:");
      expect(() => decrypt(envelope)).toThrow("Unsupported encryption version");
    });
  });

  it("throws when encryption key is not set", () => {
    withKey(undefined, () => {
      expect(() => encrypt("test")).toThrow("PAYMENT_CREDENTIALS_ENCRYPTION_KEY");
      expect(() => decrypt("v1:a:b:c")).toThrow("PAYMENT_CREDENTIALS_ENCRYPTION_KEY");
    });
  });

  it("throws when encryption key has wrong length", () => {
    withKey("tooshort", () => {
      expect(() => encrypt("test")).toThrow("32 bytes");
    });
  });
});

describe("isEncryptionKeySet", () => {
  it("returns true when key is set", () => {
    withKey(VALID_KEY, () => {
      expect(isEncryptionKeySet()).toBe(true);
    });
  });

  it("returns false when key is absent", () => {
    withKey(undefined, () => {
      expect(isEncryptionKeySet()).toBe(false);
    });
  });
});
