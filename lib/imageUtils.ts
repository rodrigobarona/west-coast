export function generateAltFallback(basename: any, smartTags: any[]) {
  const maxLength = 125
  const tagsString = smartTags.join(", ")
  const combinedString = `${basename}: ${tagsString}`

  // Check if the combined string exceeds the character limit
  if (combinedString.length > maxLength) {
    // Truncate the combined string to fit within the limit
    return combinedString.substring(0, maxLength)
  }

  return combinedString
}
