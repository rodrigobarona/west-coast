import Image from 'next/image'
import { Inter } from 'next/font/google'
import { Splide, SplideSlide } from '@splidejs/react-splide';
import '@splidejs/react-splide/css';

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between p-24 ${inter.className}`}
    >
      <div>
        <Splide aria-label="My Favorite Images">
          <SplideSlide>
            <img src="https://placehold.co/600x400" alt="Image 1" />
          </SplideSlide>
          <SplideSlide>
            <img src="https://placehold.co/600x400" alt="Image 2" />
          </SplideSlide>
        </Splide>
      </div>

    </main>
  )
}
