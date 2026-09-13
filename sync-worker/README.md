# vgzv-sync

Ablage fuer verschluesselte Staende. Laeuft als Cloudflare Worker mit KV,
Konto "Mountainium". Deploy aus diesem Ordner:

    npx wrangler deploy

Der Worker kennt keine Nutzer: nur 64-stellige Kennungen und Bloecke im
Format `v1.<iv>.<ciphertext>`. Wer neue Ursprünge (Domains) erlauben will,
traegt sie in `ERLAUBTE_URSPRUENGE` in worker.js ein.
