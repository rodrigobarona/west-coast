import Avatar from "../components/avatar"
import Date from "../components/date"
import CoverImage from "../components/cover-image"
import PostTitle from "../components/post-title"
import { generateAltFallback } from "../lib/imageUtils"

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
