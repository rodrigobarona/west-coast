import { StructuredText } from "react-datocms";

import MuxPlayer from "@mux/mux-player-react/lazy";

import Image from "next/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { generateAltFallback } from "../lib/imageUtils";
import Comment from "./comment";
import Script from "next/script";

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
                    loader={({ src, width }) => `${src}&w=${record.image.width}&h=${record.image.height}`}
                    width={record.image.width}
                    height={record.image.height}
                    alt={
                      record.image.alt ||
                      generateAltFallback(
                        record.image.basename,
                        record.image.smartTags
                      )
                    }
                    quality={75}
                    placeholder="blur"
                    loading="lazy"
                    blurDataURL={record.image.blurUpThumb}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="lg:min-w-2xl"
                  />
                </div>
              );
            }

            if (record.__typename === "VideoBlockRecord") {
              const timeline = record.timeline; // or false, depending on your condition
              const startInSeconds = record.startVideo; // define your start time in seconds
              const endInSeconds = record.endVideo; // define your end time in seconds
              return (
                <>
                  {timeline && (
                    <Script
                      type="module"
                      src="/js/media-offset-attribute.js"
                      strategy="afterInteractive"
                    />
                  )}
                  <MuxPlayer
                    streamType="on-demand"
                    playbackId={record.video.video.muxPlaybackId}
                    placeholder={record.video.blurUpThumb}
                    style={{
                      margin: "1rem 0 0",
                      aspectRatio: ` ${record.video.width}/${record.video.height}`,
                    }}
                    metadata={{
                      video_id: record.video.video.muxAssetId,
                      video_title: record.video.title || record.video.basename,
                      viewer_user_id: record.video.id,
                    }}
                    {...(timeline
                      ? {
                          "data-offset": `${startInSeconds} ${endInSeconds}`,
                          "data-offset-shim": "",
                          "data-offset-media": "media",
                          playsinline: "",
                        }
                      : {})}
                  />
                </>
              );
            }

            if (record.__typename === "AudioBlockRecord") {
              return (
                <audio controls>
                  <source src={record.audio.url} type={record.audio.mimeType} />
                  <track
                    kind="captions"
                    src={record.audio.captionsUrl}
                    srcLang="en"
                    label="English"
                  />
                  Your browser does not support the audio element.
                </audio>
              );
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
              };

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
                      width: "700px",
                      heightRatio: 1,
                    }}
                    onMoved={(splide, newIndex) => {}}
                  >
                    {record.gallery.map((slide, index) => (
                      <SplideSlide key={slide.id}>
                        <div className="relative aspect-square overflow-hidden">
                          <Image
                            src={slide.url}
                            loader={({ src }) => `${src}&w=700&h=700`}
                            fit="cover"
                            width={slide.width}
                            height={slide.height}
                            alt={
                              slide.alt ||
                              generateAltFallback(
                                slide.basename,
                                slide.smartTags
                              )
                            }
                            quality={75}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            placeholder="blur"
                            loading="lazy"
                            blurDataURL={slide.blurUpThumb}
                          />
                        </div>
                      </SplideSlide>
                    ))}
                  </Splide>
                </div>
              );
            }
            return (
              <>
                <pre>{JSON.stringify(record, null, 2)}</pre>
              </>
            );
          }}
        />
      </div>
      <Comment />
    </div>
  );
}
