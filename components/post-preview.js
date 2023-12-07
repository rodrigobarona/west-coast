// Dynamic import for "../components/avatar"
const { default: Avatar } = await import("../components/avatar")
// Dynamic import for "../components/date"
const { default: Date } = await import("../components/date")
// Dynamic import for "./cover-image"
const { default: CoverImage } = await import("./cover-image")
// Dynamic import for "next/link"
const { Link } = await import("next/link")
// Dynamic import for "../lib/imageUtils"
const { generateAltFallback } = await import("../lib/imageUtils")

export default function PostPreview({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}) {
  return (
    <div>
      <div className="mb-5">
        <Link as={`/posts/${slug}`} href="/posts/[slug]">
          <CoverImage
            src={coverImage.url}
            width={coverImage.width}
            height={coverImage.height}
            alt={
              coverImage.alt ||
              generateAltFallback(coverImage.basename, coverImage.smartTags)
            }
            blurUpThumb={coverImage.blurUpThumb}
          />
        </Link>
      </div>
      <h3 className="text-3xl mb-3 leading-snug">
        <Link legacyBehavior as={`/posts/${slug}`} href="/posts/[slug]">
          <a className="hover:underline">{title}</a>
        </Link>
      </h3>
      <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
      <Avatar name={author.name} picture={author.picture} />
    </div>
  )
}
