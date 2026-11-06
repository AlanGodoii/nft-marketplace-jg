// Deterministic fictitious accounts. Passwords are PBKDF2-SHA256 hashes, never persisted as plaintext.
export const seededAccounts = [
  {
    "id": "alice",
    "name": "Alice",
    "email": "alice@kurio.test",
    "salt": "kurio-alice-fixture-v1",
    "passwordHash": "c356337f346f58b536db6748f430778555c2b73a7b65a5a9ba53182968cc2123"
  },
  {
    "id": "bob",
    "name": "Bob",
    "email": "bob@kurio.test",
    "salt": "kurio-bob-fixture-v1",
    "passwordHash": "5b6f052ac4d90d98907b1dbd9558d5cd7c64d100daca958c8a28d51ae096048e"
  }
]
