export function generateAltFallback(basename: string, smartTags: any[]) {
  const maxLength = 125
  const tagsString = smartTags.join(", ")

  // Clean the basename using regex
  const cleanedBasename = basename
    .replace(/[^\w\s]|[_-]/g, " ") // Replace special characters, underscores, and hyphens with spaces
    .replace(/\b\d{1,3}\b|\b(?!19\d{2}|2\d{3})\d{4}\b|\b\d{5,}\b/g, " ") // Remove all digits except 4-digit numbers between 1900 and 2999
    .replace(/\s{2,}/g, " ") // Replace more than one space with a single space
    .trim() // Remove leading and trailing spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()) // Uppercase the first letter of each word

  const combinedString = `${cleanedBasename}: ${tagsString}`

  // Check if the combined string exceeds the character limit
  if (combinedString.length > maxLength) {
    // Truncate the combined string to fit within the limit
    return combinedString.substring(0, maxLength)
  }

  return combinedString
}
