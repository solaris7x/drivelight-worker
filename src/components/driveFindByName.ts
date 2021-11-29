const driveFindByName = async (parentId: string, name: string) => {
  // Request Params
  const params = {
    pageSize: "2",
    orderBy: "name",
    corpora: "drive",
    driveId: TEAMDRIVEID || "",
    includeItemsFromAllDrives: "true",
    supportsAllDrives: "true",
    fields: "nextPageToken, files(id, name, mimeType, size)",
    q: `'${parentId}' in parents and trashed = false and name = '${name}'`,
  }

  // Convert Params to Query String
  const paramsString = new URLSearchParams(params).toString()
  const requestURI = `https://www.googleapis.com/drive/v3/files?key=${GAPIKEY}&${paramsString}`

  // Fetch Drive file details
  const driveFileRes = await fetch(requestURI, {
    headers: {
      Referer: GAPIREFERER,
    },
  })

  // Pick first occurrence of file
  const driveFile = ((await driveFileRes.json()) as any)?.files[0]

  // Check if response is valid and file exists
  if (!driveFileRes.ok || !driveFile?.id) {
    throw new Error(`Unable to find file ${name}`)
  }

  // FIXME: Resolve if shortcut
  if (driveFile.mimeType === "application/vnd.google-apps.shortcut") {
    const paramsString = new URLSearchParams({
      fileId: `${driveFile.id}`,
      supportsTeamDrives: "true",
      fields: "name , shortcutDetails",
    })
    const requestURI = `https://www.googleapis.com/drive/v3/files?key=${GAPIKEY}&${paramsString}`

    const shortcutRes = await fetch(requestURI, {
      headers: {
        Referer: GAPIREFERER,
      },
    })

    const shortcutResJSON = (await shortcutRes.json()) as any
    // console.log(JSON.stringify(shortcutResJSON))

    driveFile.id = shortcutResJSON?.shortcutDetails?.targetId

    if (!shortcutRes.ok || !driveFile?.id) {
      throw new Error(
        `Unable to resolve shortcut ${name} : ${
          (JSON.stringify(shortcutResJSON) as any)?.message
        }`
      )
    }
  }
  // End of Resolve if shortcut

  // Return file ID
  return driveFile.id as string
}

export default driveFindByName
