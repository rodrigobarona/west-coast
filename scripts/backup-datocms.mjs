import { buildClient } from "@datocms/cma-client-node";
import { render } from "datocms-structured-text-to-markdown";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOCALES = ["pt", "es", "en"];
const DOWNLOAD_CONCURRENCY = 5;
const GITHUB_WARN_BYTES = 90 * 1024 * 1024;
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BACKUP_DIR = join(ROOT, "_backup");
const JSON_DIR = join(BACKUP_DIR, "json");
const MEDIA_DIR = join(BACKUP_DIR, "media");
const MARKDOWN_DIR = join(BACKUP_DIR, "markdown");

function loadEnvFiles() {
  for (const name of [".env.local", ".env"]) {
    const filePath = join(ROOT, name);
    if (!existsSync(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

function isLocaleMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  if (value.schema === "dast" || value.document || value.upload_id) return false;
  return keys.every((key) => /^[a-z]{2}(?:-[A-Za-z]+)?$/.test(key));
}

function localized(value, locale) {
  if (value == null) return null;
  if (isLocaleMap(value)) {
    return value[locale] ?? null;
  }
  return value;
}

function flattenItem(item) {
  if (!item || typeof item !== "object") return item;
  if (item.attributes && (item.type === "item" || item.relationships)) {
    return {
      id: item.id,
      item_type: item.relationships?.item_type?.data || item.item_type,
      ...item.attributes,
    };
  }
  return item;
}

function itemTypeId(item) {
  const type = flattenItem(item)?.item_type;
  if (!type) return null;
  if (typeof type === "string") return type;
  return type.id || null;
}

function fieldValue(record, ...keys) {
  const item = flattenItem(record) || {};
  for (const key of keys) {
    if (item[key] != null) return item[key];
  }
  return undefined;
}

function uploadIdFromFile(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.upload_id || value.id || null;
}

function fileList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function yamlScalar(value) {
  if (value == null) return '""';
  const str = String(value);
  if (str === "") return '""';
  if (/[:#\n"'{}[\],&*?|<>=!%@`]/.test(str) || /^\s|\s$/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

function safeFileName(name) {
  return String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function mediaFileName(upload) {
  const fromPath = upload.path ? upload.path.split("/").pop() : "";
  const fallback = `${upload.basename || "file"}${
    upload.format ? `.${upload.format}` : ""
  }`;
  const original = safeFileName(fromPath || fallback);
  const prefix = `${upload.id}-`;
  const maxName = 200;
  if (prefix.length + original.length <= maxName) {
    return prefix + original;
  }
  const extMatch = original.match(/(\.[A-Za-z0-9]+)$/);
  const ext = extMatch ? extMatch[1] : "";
  const stemBudget = Math.max(1, maxName - prefix.length - ext.length);
  return `${prefix}${original.slice(0, stemBudget)}${ext}`;
}

function mediaRelPath(upload) {
  return `../../media/${mediaFileName(upload)}`;
}

function fileAlt(file, locale, upload) {
  if (file && typeof file === "object") {
    const alt = localized(file.alt, locale);
    if (typeof alt === "string" && alt.trim()) return alt;
    if (typeof file.alt === "string" && file.alt.trim()) return file.alt;
    const title = localized(file.title, locale);
    if (typeof title === "string" && title.trim()) return title;
  }
  const meta = upload?.default_field_metadata?.[locale];
  if (meta?.alt) return meta.alt;
  if (meta?.title) return meta.title;
  return upload?.basename || "";
}

function hasStructuredText(value) {
  return Boolean(value && (value.schema === "dast" || value.document));
}

function hasLocaleContent(record, locale) {
  const title = localized(fieldValue(record, "title"), locale);
  const excerpt = localized(fieldValue(record, "excerpt"), locale);
  const content = localized(fieldValue(record, "content"), locale);
  if (typeof title === "string" && title.trim()) return true;
  if (typeof excerpt === "string" && excerpt.trim()) return true;
  return hasStructuredText(content);
}

function slugForLocale(record, locale) {
  const slug = localized(fieldValue(record, "slug"), locale);
  if (typeof slug === "string" && slug.trim()) return slug.trim();
  return record.id;
}

function authorName(author, locale) {
  if (!author) return "";
  const item = flattenItem(author);
  if (typeof item === "string") return item;
  const name = localized(item.name, locale);
  if (typeof name === "string") return name;
  if (typeof item.name === "string") return item.name;
  return "";
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectStructuredTextParts(dast) {
  const blocks = [];
  const links = [];

  function takeItem(node, bucket) {
    if (!node?.item) return;
    if (typeof node.item === "object") {
      const flat = flattenItem(node.item);
      bucket.push(flat);
      node.item = flat.id;
    }
  }

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "block" || node.type === "inlineBlock") {
      takeItem(node, blocks);
    }
    if (node.type === "inlineItem" || node.type === "itemLink") {
      takeItem(node, links);
    }
    if (Array.isArray(node.children)) {
      for (const child of node.children) walk(child);
    }
  }

  const value = cloneJson(dast);
  if (value.document) walk(value.document);
  else walk(value);
  return { value, blocks, links };
}

function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function mapPool(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await mapper(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

function originalUploadUrl(site, upload) {
  if (typeof upload.url === "string" && upload.url.startsWith("http")) {
    return upload.url.split("?")[0];
  }
  const host = site.imgix_host || "www.datocms-assets.com";
  const path = upload.path.startsWith("/") ? upload.path : `/${upload.path}`;
  return `https://${host}${path}`;
}

function isVideoUpload(upload) {
  const mime = String(upload.mime_type || "");
  const format = String(upload.format || "").toLowerCase();
  return (
    mime.startsWith("video/") ||
    ["mp4", "mov", "m4v", "avi", "webm", "mkv", "mpeg", "mpg"].includes(format)
  );
}

function cdnSettingsForOriginals(site) {
  const current = site.assets_cdn_default_settings || {};
  return {
    assets_cdn_default_settings: {
      image: current.image || {},
      video: { disable_serving_raw_videos: false },
    },
  };
}

function cdnSettingsFromSite(site) {
  const current = site.assets_cdn_default_settings || {};
  return {
    assets_cdn_default_settings: {
      image: current.image || {},
      video: current.video || {},
    },
  };
}

async function withOriginalAssetAccess(client, site, work) {
  const previous = cdnSettingsFromSite(site);
  const needsRawVideos = Boolean(
    previous.assets_cdn_default_settings.video?.disable_serving_raw_videos,
  );

  if (needsRawVideos) {
    console.log(
      "Temporarily unblocking raw video URLs (image originals are already stored; settings will be restored)...",
    );
    await client.site.updateAssetsCdnDefaultSettings(cdnSettingsForOriginals(site));
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 5000));
  }

  try {
    return await work();
  } finally {
    if (needsRawVideos) {
      console.log("Restoring Asset CDN video block...");
      await client.site.updateAssetsCdnDefaultSettings(previous);
    }
  }
}

function blockApiKey(block, itemTypeById) {
  const typeId = itemTypeId(block);
  return itemTypeById.get(typeId)?.api_key || "";
}

function decorateBlock(block, itemTypeById) {
  const apiKey = blockApiKey(block, itemTypeById);
  const typename = apiKey
    ? `${apiKey
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join("")}Record`
    : "UnknownRecord";
  return { ...flattenItem(block), __typename: typename, api_key: apiKey };
}

function renderMediaBlock(block, locale, uploadsById) {
  const apiKey = block.api_key || "";

  if (apiKey === "image_block") {
    const file = fieldValue(block, "image");
    const upload = uploadsById.get(uploadIdFromFile(file));
    if (!upload) return "";
    const alt = fileAlt(file, locale, upload);
    return `\n![${alt}](${mediaRelPath(upload)})\n`;
  }

  if (apiKey === "gallery_block") {
    const files = fileList(fieldValue(block, "gallery"));
    const lines = files
      .map((file) => {
        const upload = uploadsById.get(uploadIdFromFile(file));
        if (!upload) return "";
        const alt = fileAlt(file, locale, upload);
        return `![${alt}](${mediaRelPath(upload)})`;
      })
      .filter(Boolean);
    return lines.length ? `\n${lines.join("\n\n")}\n` : "";
  }

  if (apiKey === "video_block") {
    const file = fieldValue(block, "video");
    const upload = uploadsById.get(uploadIdFromFile(file));
    if (!upload) return "";
    const timeline = fieldValue(block, "timeline");
    const start = fieldValue(block, "start_video", "startVideo");
    const end = fieldValue(block, "end_video", "endVideo");
    const clip =
      timeline && (start != null || end != null)
        ? `\n\n<!-- clip: ${start ?? "start"}s–${end ?? "end"}s -->`
        : "";
    return `\n<video controls src="${mediaRelPath(upload)}"></video>${clip}\n`;
  }

  if (apiKey === "audio_block") {
    const file = fieldValue(block, "audio");
    const upload = uploadsById.get(uploadIdFromFile(file));
    if (!upload) return "";
    return `\n<audio controls src="${mediaRelPath(upload)}"></audio>\n`;
  }

  return `\n<!-- unsupported block ${apiKey || block.id} -->\n`;
}

function renderPostBody(content, locale, itemTypeById, uploadsById) {
  if (!hasStructuredText(content)) return "";
  const { value, blocks, links } = collectStructuredTextParts(content);
  const decoratedBlocks = blocks.map((block) =>
    decorateBlock(block, itemTypeById),
  );
  const decoratedLinks = links.map((link) =>
    decorateBlock(link, itemTypeById),
  );

  const markdown = render(
    { value, blocks: decoratedBlocks, links: decoratedLinks },
    {
      renderBlock: ({ record }) =>
        renderMediaBlock(record, locale, uploadsById),
      renderInlineBlock: ({ record }) =>
        renderMediaBlock(record, locale, uploadsById),
      renderInlineRecord: ({ record }) => {
        const slug = slugForLocale(record, locale);
        const title =
          localized(fieldValue(record, "title"), locale) || slug;
        return `[${title}](./${slug}.md)`;
      },
      renderLinkToRecord: ({ record, children }) => {
        const slug = slugForLocale(record, locale);
        return `[${children}](./${slug}.md)`;
      },
    },
  );

  return (markdown || "").trim();
}

function findPostModel(itemTypes, fieldsByTypeId) {
  const byKey = itemTypes.find(
    (itemType) => itemType.api_key === "post" && !itemType.modular_block,
  );
  if (byKey) return byKey;

  return itemTypes.find((itemType) => {
    if (itemType.modular_block) return false;
    const fields = fieldsByTypeId.get(itemType.id) || [];
    const keys = new Set(fields.map((field) => field.api_key));
    return keys.has("slug") && keys.has("content") && keys.has("title");
  });
}

async function downloadUpload(site, upload, attempts = 4) {
  const fileName = mediaFileName(upload);
  const dest = join(MEDIA_DIR, fileName);
  const expectedSize = Number(upload.size) || 0;

  if (existsSync(dest)) {
    const currentSize = statSync(dest).size;
    if (expectedSize && currentSize === expectedSize) {
      return { fileName, bytes: currentSize, skipped: true };
    }
  }

  let lastError = new Error(`Failed to download ${fileName}`);
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const url = originalUploadUrl(site, upload);
      const response = await fetch(url, {
        headers: { Accept: "application/octet-stream,*/*" },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${fileName}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(dest, buffer);
      if (expectedSize && buffer.length !== expectedSize) {
        console.warn(
          `  warning: ${fileName} size ${buffer.length} != original ${expectedSize}`,
        );
      }
      return { fileName, bytes: buffer.length, skipped: false };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < attempts) {
        const waitMs = 1500 * attempt;
        console.warn(
          `  retry ${attempt}/${attempts} ${fileName} — ${lastError.message}`,
        );
        await new Promise((resolveDelay) => setTimeout(resolveDelay, waitMs));
      }
    }
  }
  throw lastError;
}

async function retryFailedFromManifest(site) {
  const manifestPath = join(BACKUP_DIR, "manifest.json");
  const uploadsPath = join(JSON_DIR, "uploads.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const uploads = JSON.parse(readFileSync(uploadsPath, "utf8"));
  const uploadsById = new Map(uploads.map((upload) => [upload.id, upload]));
  const failed = manifest.failedDownloads || [];

  console.log(`Retrying ${failed.length} failed media downloads...`);
  const results = [];

  for (const item of failed) {
    const upload = uploadsById.get(item.id);
    if (!upload) {
      console.error(`  error: ${item.id} not found in uploads.json`);
      results.push({ id: item.id, fileName: item.fileName, ok: false, error: "missing upload" });
      continue;
    }
    try {
      const result = await downloadUpload(site, upload);
      console.log(`  [${result.skipped ? "skip" : "save"}] ${result.fileName}`);
      upload.local_path = `media/${result.fileName}`;
      results.push({ id: upload.id, fileName: result.fileName, ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  error: ${mediaFileName(upload)} — ${message}`);
      results.push({
        id: upload.id,
        fileName: mediaFileName(upload),
        ok: false,
        error: message,
      });
    }
  }

  writeJson(uploadsPath, uploads);
  manifest.failedDownloads = results
    .filter((result) => !result.ok)
    .map((result) => ({
      id: result.id,
      fileName: result.fileName,
      error: result.error,
    }));
  writeJson(manifestPath, manifest);

  const recovered = results.filter((result) => result.ok).length;
  console.log(`Retry complete: ${recovered}/${failed.length} recovered`);
  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

function writePostMarkdown({
  record,
  locale,
  uploadsById,
  itemTypeById,
}) {
  const title = localized(fieldValue(record, "title"), locale) || "";
  const excerpt = localized(fieldValue(record, "excerpt"), locale) || "";
  const date = fieldValue(record, "date") || "";
  const slug = slugForLocale(record, locale);
  const author = flattenItem(fieldValue(record, "author"));
  const coverFile = localized(fieldValue(record, "cover_image", "coverImage"), locale);
  const coverUpload = uploadsById.get(uploadIdFromFile(coverFile));
  const content = localized(fieldValue(record, "content"), locale);
  const body = renderPostBody(content, locale, itemTypeById, uploadsById);
  const coverRel = coverUpload ? mediaRelPath(coverUpload) : "";

  const frontmatter = [
    "---",
    `id: ${yamlScalar(record.id)}`,
    `locale: ${yamlScalar(locale)}`,
    `title: ${yamlScalar(title)}`,
    `slug: ${yamlScalar(slug)}`,
    `date: ${yamlScalar(date)}`,
    `excerpt: ${yamlScalar(excerpt)}`,
    `author: ${yamlScalar(authorName(author, locale))}`,
    `cover: ${yamlScalar(coverRel)}`,
    `cover_url: ${yamlScalar(coverUpload?.url || "")}`,
    "---",
    "",
  ].join("\n");

  const heading = title ? `# ${title}\n\n` : "";
  const excerptBlock = excerpt ? `${excerpt}\n\n` : "";
  const coverBlock = coverRel ? `![${fileAlt(coverFile, locale, coverUpload)}](${coverRel})\n\n` : "";

  return `${frontmatter}${heading}${coverBlock}${excerptBlock}${body}\n`;
}

async function main() {
  loadEnvFiles();

  if (process.argv.includes("--retry-failed")) {
    const site = JSON.parse(readFileSync(join(JSON_DIR, "site.json"), "utf8"));
    await retryFailedFromManifest(site);
    return;
  }

  const apiToken =
    process.env.DATOCMS_API_TOKEN ||
    process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN;
  if (!apiToken) {
    throw new Error("Missing DATOCMS_API_TOKEN in .env.local");
  }

  const environment = process.env.NEXT_DATOCMS_ENVIRONMENT || undefined;
  const client = buildClient({
    apiToken,
    ...(environment ? { environment } : {}),
  });

  console.log("Fetching site, models, and fields...");
  const site = await client.site.find();
  const itemTypes = await client.itemTypes.list();
  const fields = [];
  const fieldsByTypeId = new Map();

  for (const itemType of itemTypes) {
    const typeFields = await client.fields.list(itemType.id);
    fields.push(...typeFields);
    fieldsByTypeId.set(itemType.id, typeFields);
  }

  const itemTypeById = new Map(itemTypes.map((itemType) => [itemType.id, itemType]));
  const models = itemTypes.filter((itemType) => !itemType.modular_block);
  const modelIds = models.map((model) => model.id);

  console.log("Fetching published records...");
  const records = [];
  for await (const record of client.items.listPagedIterator({
    nested: true,
    version: "published",
    filter: { type: modelIds.join(",") },
  })) {
    records.push(record);
  }

  console.log("Fetching uploads...");
  const uploads = [];
  for await (const upload of client.uploads.listPagedIterator()) {
    uploads.push(upload);
  }

  ensureDir(JSON_DIR);
  ensureDir(MEDIA_DIR);
  for (const locale of LOCALES) {
    ensureDir(join(MARKDOWN_DIR, locale));
  }

  const uploadsWithLocal = uploads.map((upload) => ({
    ...upload,
    local_path: `media/${mediaFileName(upload)}`,
  }));

  writeJson(join(JSON_DIR, "site.json"), site);
  writeJson(join(JSON_DIR, "item-types.json"), itemTypes);
  writeJson(join(JSON_DIR, "fields.json"), fields);
  writeJson(join(JSON_DIR, "records.json"), records);
  writeJson(join(JSON_DIR, "uploads.json"), uploadsWithLocal);

  const uploadsById = new Map(uploads.map((upload) => [upload.id, upload]));

  console.log(`Downloading ${uploads.length} original media files...`);
  const downloadResults = await withOriginalAssetAccess(client, site, () =>
    mapPool(uploads, DOWNLOAD_CONCURRENCY, async (upload) => {
      try {
        const result = await downloadUpload(site, upload);
        const label = result.skipped ? "skip" : "save";
        const kind = isVideoUpload(upload) ? "video" : "file";
        console.log(`  [${label}] ${kind} ${result.fileName}`);
        if (result.bytes >= GITHUB_WARN_BYTES) {
          console.warn(
            `  warning: ${result.fileName} is ${(result.bytes / (1024 * 1024)).toFixed(1)}MB (GitHub limit is 100MB)`,
          );
        }
        return { id: upload.id, ...result, ok: true };
      } catch (error) {
        console.error(`  error: ${mediaFileName(upload)} — ${error.message}`);
        return {
          id: upload.id,
          fileName: mediaFileName(upload),
          ok: false,
          error: error.message,
        };
      }
    }),
  );

  const postModel = findPostModel(itemTypes, fieldsByTypeId);
  if (!postModel) {
    throw new Error("Could not find a post model (api_key 'post' or title/slug/content fields)");
  }

  const posts = records.filter((record) => itemTypeId(record) === postModel.id);
  let markdownCount = 0;

  for (const post of posts) {
    for (const locale of LOCALES) {
      if (!hasLocaleContent(post, locale)) continue;
      const slug = slugForLocale(post, locale);
      const markdown = writePostMarkdown({
        record: post,
        locale,
        uploadsById,
        itemTypeById,
      });
      writeFileSync(join(MARKDOWN_DIR, locale, `${safeFileName(slug)}.md`), markdown, "utf8");
      markdownCount += 1;
    }
  }

  const failedDownloads = downloadResults.filter((result) => !result.ok);
  const largeFiles = downloadResults.filter(
    (result) => result.ok && result.bytes >= GITHUB_WARN_BYTES,
  );

  const manifest = {
    exportedAt: new Date().toISOString(),
    environment: environment || "primary",
    locales: LOCALES,
    recordCount: records.length,
    uploadCount: uploads.length,
    downloadedCount: downloadResults.filter((result) => result.ok && !result.skipped).length,
    skippedExistingCount: downloadResults.filter((result) => result.ok && result.skipped).length,
    failedDownloads: failedDownloads.map((result) => ({
      id: result.id,
      fileName: result.fileName,
      error: result.error,
    })),
    markdownCount,
    postCount: posts.length,
    largeFiles: largeFiles.map((result) => ({
      fileName: result.fileName,
      bytes: result.bytes,
    })),
  };

  writeJson(join(BACKUP_DIR, "manifest.json"), manifest);

  console.log(
    `Backup complete: ${records.length} records, ${uploads.length} uploads, ${markdownCount} markdown files`,
  );
  if (failedDownloads.length) {
    console.error(`${failedDownloads.length} media downloads failed`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
