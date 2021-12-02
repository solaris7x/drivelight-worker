import driveFileRequest from "./components/driveFileRequest"
import driveFindByName, { driveFileType } from "./components/driveFindByName"
import driveListFolder from "./components/driveListFolder"
import folderTemplate from "./containers/folderTemplate"
import { hasAllProperties, isArrayOf } from "./utils"

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
      // Return only if cache respected range request
      console.log("Found in cache")
      if (
        cacheKey.headers.has("Range") ===
        cacheResponse.headers.has("Content-Range")
      ) {
        // Return the cached response
        console.log("Returning cached response")
        // console.log(cacheKey.headers.get("Range"))
        // console.log(cacheResponse.headers.get("Content-Range"))
        return cacheResponse
      }
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

    // Trimmed reqest Path
    const reqPathTrimmed = reqURL.pathname.replace(/^\/+|\/+$/g, "")

    // Check KV for resolved driveID
    // Temporary store KV value
    const driveFileTemp = await driveFileIDKV.get(reqPathTrimmed, "json")

    // Only assign if all properties are present
    let driveFile = hasAllProperties<driveFileType>(driveFileTemp, [
      "id",
      "name",
      "mimeType",
    ])
      ? driveFileTemp
      : null

    // If not found in KV, find driveID by name
    if (!driveFile) {
      // console.log("Not Found in KV")
      // Split path by '/'
      const drivePath = reqPathTrimmed.split("/")

      // Url Decode each element
      const drivePathDecoded = drivePath.map((path) => decodeURIComponent(path))
      // console.log(drivePathDecoded)

      // Find item in drive recursively
      let driveFileID = ROOTFOLDERID
      for (const drivePathName of drivePathDecoded) {
        driveFile = await driveFindByName(driveFileID, drivePathName)
        driveFileID = driveFile.id
      }

      // Make sure driveFile is not null
      if (!driveFile) {
        throw new Error("Failed to fetch file details")
      }

      // Store driveID in KV
      await driveFileIDKV.put(reqPathTrimmed, JSON.stringify(driveFile))
    }

    // If end item is folder, return folder template
    if (driveFile.mimeType === "application/vnd.google-apps.folder") {
      // Get folder content
      const driveFolderRes = await driveListFolder(
        `'${driveFile.id}' in parents and trashed = false`,
        50
      )

      // Parse response
      const folderContent = ((await driveFolderRes.json()) as any)
        ?.files as unknown // as driveFileType[]

      // Check if array and all properties are present
      if (
        !isArrayOf<driveFileType>(folderContent, ["id", "name", "mimeType"])
      ) {
        throw new Error("Failed to fetch folder content")
      }

      // Return folder template
      console.log(reqURL.host + reqURL.pathname)
      return new Response(
        folderTemplate(driveFile.name, folderContent, reqURL.pathname),
        {
          status: 200,
          headers: { "content-type": "text/html" },
        }
      )
    }

    const response = await driveFileRequest(driveFile.id, range)

    // Skip cache if already present or content-length is bigger than CACHEMAXSIZE
    const responseSize = parseInt(
      response.headers.get("content-length") || "-1"
    )
    if (!cacheResponse && responseSize !== -1 && responseSize < CACHEMAXSIZE) {
      // Store the fetched response as cacheKey
      // Use waitUntil so you can return the response without blocking on writing to cache
      console.log("Storing in cache")
      // If range request, make another request to get the full response
      if (range !== null) {
        // Make another request to get the full response
        const responseFull = await driveFileRequest(driveFile.id)

        // Store the full response in the cache
        // No need to clone the response as it is only used to populate cache
        event.waitUntil(cache.put(cacheKey, responseFull))
      } else {
        // Store original response in the cache
        event.waitUntil(cache.put(cacheKey, response.clone()))
      }
    }

    console.log("End of request")

    // Return response
    return response

    // return new Response(`request method: ${request.method}`)
  } catch (err) {
    console.log(err)
    return new Response(
      JSON.stringify({
        msg: "oof, Something broke",
        error: (err as Error)?.message || err,
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
