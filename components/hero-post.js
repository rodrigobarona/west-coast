// Dynamic import for "../components/avatar"
const { default: Avatar } = await import("../components/avatar")
// Dynamic import for "../components/date"
const { default: Date } = await import("../components/date")
// Dynamic import for "../components/cover-image"
const { default: CoverImage } = await import("../components/cover-image")
// Dynamic import for "next/link"
const { Link } = await import("next/link")
// Dynamic import for "../lib/imageUtils"
const { generateAltFallback } = await import("../lib/imageUtils")

export default function HeroPost({
  title,
  coverImage,
  date,
  excerpt,
  author,
  slug,
}) {
  return (
    <section>
      <div className="mb-8 md:mb-16">
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
            priority="true"
          />
        </Link>
      </div>
      <div className="md:grid md:grid-cols-2 md:gap-x-16 lg:gap-x-8 mb-20 md:mb-28">
        <div>
          <h3 className="mb-4 text-4xl lg:text-6xl leading-tight">
            <Link legacyBehavior as={`/posts/${slug}`} href="/posts/[slug]">
              <a className="hover:underline">{title}</a>
            </Link>
          </h3>
        </div>
        <div>
          <p className="text-lg leading-relaxed mb-4">{excerpt}</p>
          <Avatar name={author.name} picture={author.picture} />
        </div>
      </div>
    </section>
  )
}
