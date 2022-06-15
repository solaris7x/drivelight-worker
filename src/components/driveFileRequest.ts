import appendContentHeaders from "./appendContentHeaders"

const driveFileRequest = async (driveFileID: string, range?: string | null) => {
  const isRangeRequest = range !== null && range !== undefined

  // Get drive file stream
  const driveFileRequestURI = `https://www.googleapis.com/drive/v3/files/${driveFileID}?key=${GAPIKEY}&supportsAllDrives=true&alt=media`
  const driveFileRequestHeaders = new Headers({
    Referer: GAPIREFERER,
  })
  // Append Range header if range request
  if (isRangeRequest) {
    driveFileRequestHeaders.append("Range", range)
  }
  // Send the fetch request
  const driveFile = await fetch(driveFileRequestURI, {
    headers: driveFileRequestHeaders,
  })

  // Return if drive response is not ok or null
  if (!driveFile.ok || driveFile.body === null) {
    return new Response(
      JSON.stringify({
        msg: "Failed to fetch file",
        statusText: driveFile.statusText,
        // error: ((await driveFile.json()) as any)?.error?.message,
        error: await driveFile.text(),
      }),
      {
        status: driveFile.status,
        statusText: driveFile.statusText,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  // Response Headers
  const responseHeaders = new Headers()

  // Append Content Headers to given header object
  appendContentHeaders(driveFile, responseHeaders)

  // Append Cache Headers
  responseHeaders.append("Cache-Control", "max-age=" + CACHEMAXAGE.toString())

  // Create response
  const response = new Response(driveFile.body, {
    status: driveFile.status,
    headers: responseHeaders,
  })

  return response
}

export default driveFileRequest
