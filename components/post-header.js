// Dynamic import for "../components/avatar"
const { default: Avatar } = await import("../components/avatar")
// Dynamic import for "../components/date"
const { default: Date } = await import("../components/date")
// Dynamic import for "../components/cover-image"
const { default: CoverImage } = await import("../components/cover-image")
// Dynamic import for "../components/post-title"
const { default: PostTitle } = await import("../components/post-title")
// Dynamic import for "../lib/imageUtils"
const { generateAltFallback } = await import("../lib/imageUtils")

export default function PostHeader({ title, coverImage, date, author }) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      <div className="hidden md:block md:mb-12">
        <Avatar name={author.name} picture={author.picture} />
      </div>
      <div className="mb-8 md:mb-16 -mx-5 sm:mx-0">
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
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="block md:hidden mb-6">
          <Avatar name={author.name} picture={author.picture} />
        </div>
      </div>
    </>
  )
}
