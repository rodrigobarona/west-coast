import "@/styles/globals.css"
import type { AppProps } from "next/app"
import type { Comment } from '../interfaces'
import { Analytics } from "@vercel/analytics/react"
import { Auth0Provider } from "@auth0/auth0-react"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Auth0Provider
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID}
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN}
    >
      <Component {...pageProps} />
      <Analytics />
    </Auth0Provider>
  )
}
