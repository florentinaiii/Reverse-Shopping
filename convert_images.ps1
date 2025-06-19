Add-Type -AssemblyName System.Drawing

$imagePath = ".\assets\images"
Get-ChildItem -Path $imagePath -Filter "*.jfif" | ForEach-Object {
    $image = [System.Drawing.Image]::FromFile($_.FullName)
    $newPath = $_.FullName -replace '\.jfif$', '.jpg'
    $image.Save($newPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $image.Dispose()
}
