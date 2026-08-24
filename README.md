# Helm

A from-scratch redesign of FACE Prep's internal Authoring Portal — one command-center dashboard, a real hierarchical batch explorer, and delivery/attempt analytics, instead of six separate collection pages and a raw log.

Standalone design pitch. Grounded in the real product's schema; every record inside is simulated demo data — see `NOTES.md` for the full breakdown of what's deep vs. scaffolded.

```bash
npm run install:all   # root + client
npm run dev            # API :4001 + Vite :5173 (proxied)
npm run build           # client production build
```

Demo login: `admin@helm.demo` / `helm@demo123`
