import driveFileRequest from "./components/driveFileRequest"
import driveFindByName from "./components/driveFindByName"

export async function handleRequest(event: FetchEvent): Promise<Response> {
  try {
    const request = event.request

    // Check for Range header
    const range = request.headers.get("Range")

    // Get params
    const reqURL = new URL(request.url)

    // Check Cache API
    // Construct the cache key from the cache URL
    const cacheKey = new Request(reqURL.toString(), request)
    const cache = caches.default

    // Check whether the value is already available in the cache
    // if not, you will need to fetch it from origin, and store it in the cache for future access
    const cacheResponse = await cache.match(cacheKey)

    // Automatically handles range requests and returns a 206 Partial Content response
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

    const response = await driveFileRequest(driveFileID, range)

    // Store the fetched response as cacheKey
    // Use waitUntil so you can return the response without blocking on writing to cache
    console.log("Storing in cache")
    // If range request, make another request to get the full response
    if (range !== null) {
      // Make another request to get the full response
      const responseFull = await driveFileRequest(driveFileID)

      // Store the full response in the cache
      // No need to clone the response as it is only used to populate cache
      event.waitUntil(cache.put(cacheKey, responseFull))
    } else {
      // Store original response in the cache
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }

    console.log("End of request")

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
