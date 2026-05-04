param(
  [string]$AdventureRoot = "adventures",
  [string]$OutputPath = "data/activity-images.json"
)

$activities = [ordered]@{}
$imageExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")

Get-ChildItem -Path $AdventureRoot -Directory -Filter "activity_*" | ForEach-Object {
  $activityId = $_.Name -replace "^activity_", ""
  $imageDirectory = Join-Path $_.FullName "images"

  if (-not (Test-Path -LiteralPath $imageDirectory)) {
    return
  }

  $images = Get-ChildItem -LiteralPath $imageDirectory -File |
    Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object {
      $relativePath = $_.FullName.Replace((Get-Location).Path + [IO.Path]::DirectorySeparatorChar, "")
      $relativePath.Replace("\", "/")
    }

  $activities[$activityId] = @($images)
}

$manifest = [ordered]@{
  _comment = "Image manifest generated from adventures/activity_<number>/images folders. Static browsers cannot scan folders directly, so detail pages load galleries from this file."
  activities = $activities
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Updated $OutputPath with $($activities.Count) activity image set(s)."
