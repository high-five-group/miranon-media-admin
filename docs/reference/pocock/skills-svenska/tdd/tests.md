# Bra och dåliga tester

## Bra tester

**Integrationsliknande:** testa genom verkliga gränssnitt, inte mockar av interna delar.

```typescript
// BRA: testar observerbart beteende
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe("confirmed");
});
```

Egenskaper:

- Testar beteende som användare och anropare bryr sig om.
- Använder bara publikt API.
- Överlever interna refaktoreringar.
- Beskriver **VAD**, inte **HUR**.
- En logisk assertion per test.

## Dåliga tester

**Tester av implementationsdetaljer:** kopplade till intern struktur.

```typescript
// DÅLIGT: testar implementationsdetaljer
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Varningssignaler:

- Mockning av interna samarbetspartner.
- Testning av privata metoder.
- Assertions om antal eller ordning på anrop.
- Testet fallerar när du refaktorerar utan att beteendet ändras.
- Testnamnet beskriver **HUR**, inte **VAD**.
- Verifiering via externa vägar i stället för via gränssnittet.

```typescript
// DÅLIGT: kringgår gränssnittet vid verifiering
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// BRA: verifierar genom gränssnittet
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```
