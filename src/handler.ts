import driveFindByName from "./components/driveFindByName"
import appendContentHeaders from "./components/appendContentHeaders"

export async function handleRequest(event: FetchEvent): Promise<Response> {
  try {
    const request = event.request
    // Get params
    const reqURL = new URL(request.url)

    // Check Cache API
    // Construct the cache key from the cache URL
    const cacheKey = new Request(reqURL.toString(), request)
    const cache = caches.default

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from origin, and store it in the cache for future access
    const cacheResponse = await cache.match(cacheKey)

    if (cacheResponse) {
      console.log("Found in cache")
      // Return the cached response
      return cacheResponse
    }

    // Return greeting if no path specified
    if (reqURL.pathname === "/") {
      return new Response(
        JSON.stringify({
          msg: "Hello From DriveLight-Serverless",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "max-age=" + CACHEMAXAGE.toString(),
          },
        }
      )
    }

    // Check KV for resolved driveID
    let driveFileID = await driveFileIDKV.get(reqURL.pathname)

    // If not found in KV, find driveID by name
    if (driveFileID === null) {
      // console.log("Not Found in KV")
      // Split path by '/'
      const drivePath = reqURL.pathname.split("/")
      // Drop 1st element as it is always empty
      drivePath.shift()

      // Url Decode each element
      const drivePathDecoded = drivePath.map((path) => decodeURIComponent(path))
      // console.log(drivePathDecoded)

      // Find item in drive recursively
      driveFileID = ROOTFOLDERID
      for (const drivePathName of drivePathDecoded) {
        driveFileID = await driveFindByName(driveFileID, drivePathName)
      }

      // Store driveID in KV
      await driveFileIDKV.put(reqURL.pathname, driveFileID)
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

    // Append Cache Headers
    responseHeaders.append("Cache-Control", "max-age=" + CACHEMAXAGE.toString())

    // Create response
    const response = new Response(driveFile.body, {
      status: 200,
      headers: responseHeaders,
    })

    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on writing to cache
    console.log("Storing in cache")
    event.waitUntil(cache.put(cacheKey, response.clone()))

    // Return response
    return response

    // return new Response(`request method: ${request.method}`)
  } catch (error) {
    return new Response(
      JSON.stringify({
        msg: "oof, Something broke",
        error: (error as Error)?.message || error,
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json",
          "cache-control": "private, max-age=0, s-maxage=0",
        },
      }
    )
  }
}
