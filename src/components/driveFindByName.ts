import { hasAllProperties } from "../utils"
import driveListFolder from "./driveListFolder"

export interface driveFileType {
  id: string
  name: string
  mimeType: string
}

const driveFindByName = async (
  parentId: string,
  name: string
): Promise<driveFileType> => {
  // Request Params
  const params = {
    pageSize: "2",
    q: `'${parentId}' in parents and trashed = false and name = '${name}'`,
  }

  // Fetch Drive file details
  const driveFileRes = await driveListFolder(params.q, params.pageSize)

  // Pick first occurrence of file
  const driveFile = ((await driveFileRes.json()) as any)?.files[0]

  // Check if response is valid and file exists
  if (!driveFileRes.ok || !driveFile?.id) {
    throw new Error(`Unable to find file ${name}`)
  }

  // Check file metadata against expected properties
  if (!hasAllProperties(driveFile, ["id", "name", "mimeType"])) {
    throw new Error(`Invalid metadata ${name} - ${driveFileRes.text()}`)
  }

  // Return file ID
  return driveFile
}

export default driveFindByName

// // FIXME: Resolve if shortcut
// if (driveFile.mimeType === "application/vnd.google-apps.shortcut") {
//   const paramsString = new URLSearchParams({
//     fileId: `${driveFile.id}`,
//     supportsTeamDrives: "true",
//     fields: "name , shortcutDetails",
//   })
//   const requestURI = `https://www.googleapis.com/drive/v3/files?key=${GAPIKEY}&${paramsString}`

//   const shortcutRes = await fetch(requestURI, {
//     headers: {
//       Referer: GAPIREFERER,
//     },
//   })

//   const shortcutResJSON = (await shortcutRes.json()) as any
//   // console.log(JSON.stringify(shortcutResJSON))

//   driveFile.id = shortcutResJSON?.shortcutDetails?.targetId

//   if (!shortcutRes.ok || !driveFile?.id) {
//     throw new Error(
//       `Unable to resolve shortcut ${name} : ${
//         (JSON.stringify(shortcutResJSON) as any)?.message
//       }`
//     )
//   }
// }
// // End of Resolve if shortcut
