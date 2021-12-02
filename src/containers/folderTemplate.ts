const folderTemplate = (folderName: string, files: { name: string }[]) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>DriveLight - ${folderName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <h1 style="text-align: center">DriveLight</h1>
    <h2>Folder: ${folderName}</h2>
    <h2>File List:</h2>
    <ul style="font-size: large">
        ${files
          .map(
            (file) =>
              `<li><a href="${encodeURIComponent(file.name)}">${
                file.name
              }</a></li>`
          )
          .join("")}
    </ul>
  </body>
</html>
`

export default folderTemplate
