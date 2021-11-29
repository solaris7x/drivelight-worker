import driveFindByName from "./components/driveFindByName"
import appendContentHeaders from "./components/appendContentHeaders"

export async function handleRequest(request: Request): Promise<Response> {
  try {
    // Get params
    const reqURL = new URL(request.url)

    // Return greeting if no path specified
    if (reqURL.pathname === "/") {
      return new Response(
        JSON.stringify({
          msg: "Hello From DriveLight-Serverless",
        })
      )
    }

    // Split path by '/'
    const drivePath = reqURL.pathname.split("/")
    // Drop 1st element as it is always empty
    drivePath.shift()

    // Url Decode each element
    const drivePathDecoded = drivePath.map((path) => decodeURIComponent(path))
    // console.log(drivePathDecoded)

    // Find item in drive recursively
    let driveFileID = ROOTFOLDERID
    for (const drivePathName of drivePathDecoded) {
      driveFileID = await driveFindByName(driveFileID, drivePathName)
    }

    // Get drive file stream
    const requestURI = `https://www.googleapis.com/drive/v3/files/${driveFileID}?key=${GAPIKEY}&supportsAllDrives=true&alt=media`
    // console.log(requestURI)
    const driveFile = await fetch(requestURI, {
      headers: {
        Referer: GAPIREFERER,
      },
    })

    // Return if drive response is not ok or null
    if (!driveFile.ok || driveFile.body === null) {
      return new Response(
        JSON.stringify({
          msg: "Failed to fetch file",
          statusText: driveFile.statusText,
          error: await driveFile.text(),
        }),
        {
          status: driveFile.status,
          statusText: driveFile.statusText,
        }
      )
    }

    // Response Headers
    const responseHeaders = new Headers()

    // Append Content Headers to given header object
    appendContentHeaders(driveFile, responseHeaders)

    // Return file as response
    return new Response(driveFile.body, {
      status: 200,
      headers: responseHeaders,
    })

    // return new Response(`request method: ${request.method}`)
  } catch (error) {
    return new Response(
      JSON.stringify({
        msg: "oof, Something broke",
        error: (error as Error)?.message || error,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    )
  }
}
