# lawsuits

## Seed first admin

```bash
npm run seed:admin -- --email admin@example.com --password "TempPass123!" --name "Main Admin"
```

This command creates (or promotes) the Firebase Auth user and upserts `/users/{uid}` with:

- `role: "ADMIN"`
- `isActive: true`
- `dailyLimit: 200` (or pass `--dailyLimit 20`)
