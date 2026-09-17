# DatoCMS local backup

Offline export of the West Coast DatoCMS project: import-ready JSON, original media, and one markdown file per post per language.

## Re-run

From the repo root (requires `DATOCMS_API_TOKEN` in `.env.local`):

```bash
npm run backup
```

The script loads `.env.local`, dumps published records from the CMA, and downloads **original** files from the media area (not Imgix-optimized images and not Mux transcodes). Existing media files whose size matches the original upload are skipped.

If “Block serving URLs for raw video assets” is on, the script turns it off for the download, then turns it back on. If you already set Video + Image CDN options to raw / no optimization, downloads use those public original URLs directly.

## Layout

```
_backup/
  manifest.json
  json/
    site.json
    item-types.json
    fields.json
    records.json      # CMA-shaped, nested blocks, all locales
    uploads.json      # upload metadata + local_path
  media/
    {uploadId}-{filename}
  markdown/
    pt/{slug}.md
    es/{slug}.md
    en/{slug}.md
```

Media is stored once. Markdown files link to it with relative paths (`../../media/...`). A locale file is omitted when that translation has no published title, excerpt, or body.

## Restore later

Use `json/records.json`, `json/uploads.json`, `json/item-types.json`, `json/fields.json`, and `media/` as the source. There is no restore script in this pass; those files match the Content Management API shape so they can be imported later.
