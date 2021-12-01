const appendContentHeaders = (
  driveFile: Response,
  responseHeaders: Headers
) => {
  // Content-Type
  const DriveFileContentType = driveFile.headers.get("Content-Type")
  if (DriveFileContentType) {
    responseHeaders.append("Content-Type", DriveFileContentType)
  }

  // Content-Disposition
  const DriveFileContentDisposition = driveFile.headers.get(
    "Content-Disposition"
  )
  if (DriveFileContentDisposition) {
    responseHeaders.append("Content-Disposition", DriveFileContentDisposition)
  }

  // Content-Encoding
  const DriveFileContentEncoding = driveFile.headers.get("Content-Encoding")
  if (DriveFileContentEncoding) {
    responseHeaders.append("Content-Encoding", DriveFileContentEncoding)
  }

  // Content-Length
  const DriveFileContentLength = driveFile.headers.get("Content-Length")
  if (DriveFileContentLength) {
    responseHeaders.append("Content-Length", DriveFileContentLength)
  }

  // Content-Range
  const DriveFileContentRange = driveFile.headers.get("Content-Range")
  if (DriveFileContentRange) {
    responseHeaders.append("Content-Range", DriveFileContentRange)
  }
}

export default appendContentHeaders
