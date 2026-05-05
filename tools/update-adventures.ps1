param(
  [string]$GpxRoot = "adventures/gpx",
  [string]$AdventureRoot = "adventures",
  [string]$IndexPath = "data/adventures-index.json"
)

function Get-HaversineDistanceKm {
  param(
    [double]$Lat1,
    [double]$Lon1,
    [double]$Lat2,
    [double]$Lon2
  )

  $earthRadiusKm = 6371
  $toRadians = [Math]::PI / 180
  $dLat = ($Lat2 - $Lat1) * $toRadians
  $dLon = ($Lon2 - $Lon1) * $toRadians
  $rLat1 = $Lat1 * $toRadians
  $rLat2 = $Lat2 * $toRadians
  $a = [Math]::Pow([Math]::Sin($dLat / 2), 2) + [Math]::Cos($rLat1) * [Math]::Cos($rLat2) * [Math]::Pow([Math]::Sin($dLon / 2), 2)

  return $earthRadiusKm * 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
}

function Format-ActivityDate {
  param([datetime]$Date)
  return $Date.ToString("MMM d, yyyy", [Globalization.CultureInfo]::InvariantCulture)
}

function Format-ActivityTime {
  param([double]$TotalMinutes)

  $roundedMinutes = [Math]::Max(0, [Math]::Round($TotalMinutes))
  $hours = [Math]::Floor($roundedMinutes / 60)
  $minutes = $roundedMinutes % 60

  if ($hours -gt 0) {
    return "${hours}h ${minutes}m"
  }

  return "${minutes}m"
}

function Get-TitleFromGpxName {
  param(
    [string]$Type,
    [string]$ActivityId
  )

  $label = if ($Type -eq "hike") { "Hike" } elseif ($Type -eq "run") { "Run" } else { "Ride" }
  return "$label $ActivityId"
}

function Get-RelativePath {
  param([string]$Path)
  return $Path.Replace((Get-Location).Path + [IO.Path]::DirectorySeparatorChar, "").Replace("\", "/")
}

function Get-ActivityImages {
  param([string]$ActivityDirectory)

  $imageDirectory = Join-Path $ActivityDirectory "images"
  $imageExtensions = @(".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")

  if (-not (Test-Path -LiteralPath $imageDirectory)) {
    return @()
  }

  $images = @(Get-ChildItem -LiteralPath $imageDirectory -File |
    Where-Object { $imageExtensions -contains $_.Extension.ToLowerInvariant() } |
    Sort-Object Name |
    ForEach-Object { Get-RelativePath -Path $_.FullName })

  return [object[]]$images
}

function Get-PreparedWith {
  param(
    [object]$ExistingDetail,
    [object[]]$Essentials
  )

  if ($ExistingDetail.preparedWith) {
    return @($ExistingDetail.preparedWith)
  }

  return @($Essentials | Select-Object -First 6)
}

function Write-JsonFile {
  param(
    [string]$Path,
    [object]$Value,
    [int]$Depth = 8
  )

  $json = $Value | ConvertTo-Json -Depth $Depth
  $json = $json -replace '("images"\s*:\s*)null', '$1[]'
  $json = $json -replace '("preparedWith"\s*:\s*)null', '$1[]'
  $encoding = New-Object System.Text.UTF8Encoding $false
  [IO.File]::WriteAllText((Resolve-Path -LiteralPath (Split-Path -Parent $Path) | Join-Path -ChildPath (Split-Path -Leaf $Path)), $json, $encoding)
}

function Get-GpxSummary {
  param([IO.FileInfo]$File)

  [xml]$xml = Get-Content -LiteralPath $File.FullName -Raw
  $points = @($xml.SelectNodes("//*[local-name()='trkpt']"))
  $fileName = $File.Name
  $match = [regex]::Match($fileName, "^(ride|hike|run)_(\d+)\.gpx$", [Text.RegularExpressions.RegexOptions]::IgnoreCase)

  if (-not $match.Success -or $points.Count -eq 0) {
    return $null
  }

  $type = $match.Groups[1].Value.ToLowerInvariant()
  $activityId = $match.Groups[2].Value
  $distanceKm = 0
  $elevationGain = 0
  $previous = $null
  $firstTime = $null
  $lastTime = $null

  foreach ($point in $points) {
    $lat = [double]::Parse($point.GetAttribute("lat"), [Globalization.CultureInfo]::InvariantCulture)
    $lon = [double]::Parse($point.GetAttribute("lon"), [Globalization.CultureInfo]::InvariantCulture)
    $eleNode = $point.SelectSingleNode("*[local-name()='ele']")
    $timeNode = $point.SelectSingleNode("*[local-name()='time']")
    $ele = if ($eleNode) { [double]::Parse($eleNode.InnerText, [Globalization.CultureInfo]::InvariantCulture) } else { 0 }
    $time = if ($timeNode) { [datetime]::Parse($timeNode.InnerText, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) } else { $null }
    $current = [pscustomobject]@{
      Lat = $lat
      Lon = $lon
      Ele = $ele
      Time = $time
    }

    if ($previous) {
      $distanceKm += Get-HaversineDistanceKm -Lat1 $previous.Lat -Lon1 $previous.Lon -Lat2 $current.Lat -Lon2 $current.Lon
      $eleGain = $current.Ele - $previous.Ele
      if ($eleGain -gt 0) {
        $elevationGain += $eleGain
      }
    }

    if (-not $firstTime -and $time) {
      $firstTime = $time
    }
    if ($time) {
      $lastTime = $time
    }

    $previous = $current
  }

  $durationMinutes = if ($firstTime -and $lastTime) { ($lastTime - $firstTime).TotalMinutes } else { 0 }

  return [pscustomobject]@{
    ActivityId = $activityId
    Type = if ($type -eq "run") { "hike" } else { $type }
    Title = Get-TitleFromGpxName -Type $type -ActivityId $activityId
    Date = if ($firstTime) { Format-ActivityDate -Date $firstTime } else { Format-ActivityDate -Date $File.LastWriteTime }
    Distance = "{0:N1} km" -f $distanceKm
    Elevation = "{0:N0} m" -f $elevationGain
    Time = Format-ActivityTime -TotalMinutes $durationMinutes
    Gpx = Get-RelativePath -Path $File.FullName
  }
}

$existingIndex = if (Test-Path -LiteralPath $IndexPath) {
  Get-Content -LiteralPath $IndexPath -Raw | ConvertFrom-Json
} else {
  [pscustomobject]@{ adventures = @() }
}

$existingById = @{}
foreach ($item in @($existingIndex.adventures)) {
  if ($item.activityId) {
    $existingById[$item.activityId] = $item
  }
}

$essentialsPath = "data/trip-essentials.json"
$planningEssentials = if (Test-Path -LiteralPath $essentialsPath) {
  @((Get-Content -LiteralPath $essentialsPath -Raw | ConvertFrom-Json).essentials)
} else {
  @()
}

$adventures = @()
Get-ChildItem -LiteralPath $GpxRoot -File -Filter "*.gpx" | Sort-Object Name | ForEach-Object {
  $summary = Get-GpxSummary -File $_
  if (-not $summary) {
    return
  }

  $activityDirectory = Join-Path $AdventureRoot "activity_$($summary.ActivityId)"
  $activityPath = Join-Path $activityDirectory "activity.json"
  $detailPath = (Get-RelativePath -Path $activityPath)
  $existingIndexItem = $existingById[$summary.ActivityId]
  $existingDetail = if (Test-Path -LiteralPath $activityPath) {
    Get-Content -LiteralPath $activityPath -Raw | ConvertFrom-Json
  } else {
    $null
  }

  if (-not (Test-Path -LiteralPath $activityDirectory)) {
    New-Item -ItemType Directory -Path $activityDirectory | Out-Null
  }

  $activity = [ordered]@{
    activityId = $summary.ActivityId
    title = if ($existingDetail.title) { $existingDetail.title } elseif ($existingIndexItem.title) { $existingIndexItem.title } else { $summary.Title }
    type = if ($existingDetail.type) { $existingDetail.type } elseif ($existingIndexItem.type) { $existingIndexItem.type } else { $summary.Type }
    date = $summary.Date
    distance = $summary.Distance
    elevation = $summary.Elevation
    time = $summary.Time
    image = if ($existingDetail.image) { $existingDetail.image } elseif ($existingIndexItem.image) { $existingIndexItem.image } else { "assets/hero-bike-road.svg" }
    chart = if ($existingDetail.chart) { $existingDetail.chart } elseif ($existingIndexItem.chart) { $existingIndexItem.chart } else { "assets/chart-green.svg" }
    gpx = $summary.Gpx
    youtube = if ($existingDetail.youtube) { $existingDetail.youtube } else { "" }
    description = if ($existingDetail.description) {
      $existingDetail.description
    } elseif ($existingIndexItem.description) {
      $existingIndexItem.description
    } else {
      "Auto-generated from $($summary.Gpx). Replace this with a short summary when the real story is ready."
    }
    images = [object[]](Get-ActivityImages -ActivityDirectory $activityDirectory)
    preparedWith = Get-PreparedWith -ExistingDetail $existingDetail -Essentials $planningEssentials
    story = if ($existingDetail.story) {
      @($existingDetail.story)
    } else {
      @(
        "This is an auto-generated starter story for activity_$($summary.ActivityId). It was created from the GPX file so the card and detail page can exist before the real photos, videos, and written notes are ready.",
        "Replace this text later with the real story of the route: where it started, how the ride or hike felt, what the weather was like, what surprised you, and what another visitor should know before trying it.",
        "The map, chart, distance, elevation, and moving time already come from the GPX file. This story section is where the human part of the adventure will live."
      )
    }
  }

  $indexItem = [ordered]@{
    activityId = $activity.activityId
    title = $activity.title
    type = $activity.type
    date = $activity.date
    distance = $activity.distance
    elevation = $activity.elevation
    time = $activity.time
    image = $activity.image
    chart = $activity.chart
    gpx = $activity.gpx
    detail = $detailPath
    description = $activity.description
  }

  Write-JsonFile -Path $activityPath -Value $activity
  $adventures += $indexItem
}

$manifest = [ordered]@{
  _comment = "Lightweight adventure index for homepage cards and stats. Full stories live in adventures/activity_<id>/activity.json."
  adventures = $adventures
}

Write-JsonFile -Path $IndexPath -Value $manifest
Write-Host "Updated $IndexPath and $($adventures.Count) activity detail file(s)."
