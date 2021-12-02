const driveListFolder = async (query: string, pageSize?: number | string) => {
  // Request Params
  const params = {
    pageSize: pageSize?.toString() || "2",
    orderBy: "name",
    corpora: "drive",
    driveId: TEAMDRIVEID || "",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
    fields: "nextPageToken, files(id, name, mimeType, size)",
    q: query,
  }

  // Convert Params to Query String
  const paramsString = new URLSearchParams(params).toString()
  const requestURI = `https://www.googleapis.com/drive/v3/files?key=${GAPIKEY}&${paramsString}`
  // console.log(requestURI)

  // Fetch Drive file details
  const driveFileRes = await fetch(requestURI, {
    headers: {
      Referer: GAPIREFERER,
    },
  })

  return driveFileRes
}

export default driveListFolder
