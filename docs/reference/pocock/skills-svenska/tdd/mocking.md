# När du ska mocka

Mocka bara vid **systemgränser**:

- Externa API:er (betalning, e-post och liknande).
- Databaser (ibland — föredra testdatabas).
- Tid och slump.
- Filsystem (ibland).

Mocka inte:

- Dina egna klasser eller moduler.
- Interna samarbetspartner.
- Något du kontrollerar.

## Utforma för mockbarhet

Utforma gränssnitt som är enkla att mocka vid systemgränser.

**1. Använd beroendeinjektion**

Skicka in externa beroenden i stället för att skapa dem internt:

```typescript
// Enkel att mocka
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Svår att mocka
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**2. Föredra SDK-liknande gränssnitt framför generella hämtare**

Skapa specifika funktioner för varje extern operation i stället för en generell funktion med villkorslogik:

```typescript
// BRA: varje funktion kan mockas oberoende
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// DÅLIGT: mockningen kräver villkorslogik inuti mocken
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK-angreppssättet innebär:

- Varje mock returnerar en specifik form.
- Ingen villkorslogik behövs i testuppsättningen.
- Det blir enklare att se vilka endpoints ett test kör.
- Typsäkerhet per endpoint.
