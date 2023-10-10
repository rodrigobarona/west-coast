const clearUrl = (url: any) => {
  const { origin, pathname } = new URL(url)
  return `${origin}${pathname}`
}

export default clearUrl
