import { StructuredText } from "react-datocms";
import Image from "next/image";
import { Splide, SplideSlide } from "@splidejs/react-splide";
import "@splidejs/react-splide/css";
import { useRef, useEffect, useState } from "react";
import { generateAltFallback } from "../lib/imageUtils";
import Comment from "./comment";

import videojs from "video.js";
import "video.js/dist/video-js.css";

// Image Block Component
function ImageBlock({ record }) {
  return (
    <div className="not-prose">
      <Image
        src={record.image.url}
        width={record.image.width}
        height={record.image.height}
        alt={
          record.image.alt ||
          generateAltFallback(record.image.basename, record.image.smartTags)
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

// Video Block Component
function VideoBlock({ record }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  const timeline = record.timeline;
  const startInSeconds = record.startVideo;
  const endInSeconds = record.endVideo;
  const videoUrl = record.video.url;

  useEffect(() => {
    // Ensure video.js is only initialized after the component is mounted
    if (
      typeof window !== "undefined" &&
      isMounted &&
      videoRef.current &&
      !playerRef.current
    ) {
      const player = videojs(videoRef.current, {
        controls: true,
        preload: "auto",
        fluid: true,
        aspectRatio: `${record.video.width}:${record.video.height}`,
        sources: [{ src: videoUrl, type: "video/mp4" }],
      });

      playerRef.current = player;
    }

    // Cleanup the player on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [isMounted, videoUrl, record.video.width, record.video.height]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="not-prose mb-4">
      <video
        ref={videoRef}
        className="video-js vjs-default-skin"
        controls
        preload="metadata"
        data-offset={timeline ? `${startInSeconds} ${endInSeconds}` : undefined}
        playsInline
      />
    </div>
  );
}

// Audio Block Component
function AudioBlock({ record }) {
  return (
    <audio controls className="w-full">
      <source src={record.audio.url} type={record.audio.mimeType} />
      Your browser does not support the audio element.
    </audio>
  );
}

// Gallery Block Component
function GalleryBlock({ record }) {
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
      >
        {record.gallery.map((slide, index) => (
          <SplideSlide key={index}>
            <Image
              src={slide.url}
              width={700}
              height={700}
              alt={
                slide.alt ||
                generateAltFallback(slide.basename, slide.smartTags)
              }
              quality={75}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              placeholder="blur"
              loading="lazy"
              blurDataURL={slide.blurUpThumb}
            />
          </SplideSlide>
        ))}
      </Splide>
    </div>
  );
}

export default function PostBody({ content }) {
  return (
    <div className="max-w-2xl mx-auto bg-white">
      <div className="prose prose-lg prose-blue">
        <StructuredText
          data={content}
          renderBlock={({ record }) => {
            switch (record.__typename) {
              case "ImageBlockRecord":
                return <ImageBlock record={record} />;
              case "VideoBlockRecord":
                return <VideoBlock record={record} />;
              case "AudioBlockRecord":
                return <AudioBlock record={record} />;
              case "GalleryBlockRecord":
                return <GalleryBlock record={record} />;
              default:
                return <pre>{JSON.stringify(record, null, 2)}</pre>;
            }
          }}
        />
      </div>
      <Comment />
    </div>
  );
}
