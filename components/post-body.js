import { StructuredText } from "react-datocms"
import MuxPlayer from "@mux/mux-player-react"
import Image from "next/image"
import { Splide, SplideSlide } from "@splidejs/react-splide"
import "@splidejs/react-splide/css"

export default function PostBody({ content }) {
  return (
    <div className="max-w-2xl mx-auto bg-white">
      <div className="prose prose-lg prose-blue">
        <StructuredText
          data={content}
          renderBlock={({ record }) => {
            if (record.__typename === "ImageBlockRecord") {
              return (
                <div className="not-prose">
                  <Image
                    src={record.image.url}
                    width={record.image.width}
                    height={record.image.height}
                    alt={record.image.alt}
                    quality={100}
                    placeholder="blur"
                    loading="lazy"
                    className="lg:min-w-2xl"
                    blurDataURL={record.image.blurUpThumb}
                  />
                </div>
              )
            }
            if (record.__typename === "VideoBlockRecord") {
              return (
                <MuxPlayer
                  streamType="on-demand"
                  playbackId={record.video.video.muxPlaybackId}
                  style={{
                    aspectRatio: `${record.video.width} / ${record.video.height}`,
                  }}
                  metadata={{
                    video_id: record.video.video.muxAssetId,
                    video_title: record.video.basename,
                    viewer_user_id: record.video.thumbhash,
                  }}
                />
              )
            }
            if (record.__typename === "AudioBlockRecord") {
              return (
                <audio controls className="w-full">
                  <source src={record.audio.url} type={record.audio.mimeType} />
                  Your browser does not support the audio element.
                </audio>
              )
            }
            if (record.__typename === "GalleryBlockRecord") {
              const responsive = {
                desktop: {
                  breakpoint: { max: 3000, min: 1024 },
                  items: 1,
                  slidesToSlide: 1, // optional, default to 1.
                },
                tablet: {
                  breakpoint: { max: 1024, min: 464 },
                  items: 1,
                  slidesToSlide: 1, // optional, default to 1.
                },
                mobile: {
                  breakpoint: { max: 464, min: 0 },
                  items: 1,
                  slidesToSlide: 1, // optional, default to 1.
                },
              }

              return (
                <div className="not-prose">
                  <Splide
                    options={{
                      perPage: 1,
                      rewind: true,
                      gap: "1px",
                      padding: 0,
                      paginationKeyboard: true,
                      drag: true,
                      lazyLoad: "nearby",
                      preloadPages: "3",
                    }}
                    onMoved={(splide, newIndex) => {}}
                  >
                    {record.gallery.map((slide, index) => (
                      <SplideSlide key={index}>
                        <Image
                          data-splide-lazy={slide.url}
                          width={1000}
                          height={1000}
                          alt={slide.alt}
                          quality={100}
                          src={slide.blurUpThumb}
                        />
                      </SplideSlide>
                    ))}
                  </Splide>
                </div>
              )
            }
            return (
              <>
                <pre>{JSON.stringify(record, null, 2)}</pre>
              </>
            )
          }}
        />
      </div>
    </div>
  )
}
