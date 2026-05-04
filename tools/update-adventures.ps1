param(
  [string]$GpxRoot = "adventures/gpx",
  [string]$OutputPath = "data/adventures.json"
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
  $relativePath = $File.FullName.Replace((Get-Location).Path + [IO.Path]::DirectorySeparatorChar, "").Replace("\", "/")

  return [pscustomobject]@{
    ActivityId = $activityId
    Type = if ($type -eq "run") { "hike" } else { $type }
    Title = Get-TitleFromGpxName -Type $type -ActivityId $activityId
    Date = if ($firstTime) { Format-ActivityDate -Date $firstTime } else { Format-ActivityDate -Date $File.LastWriteTime }
    Distance = "{0:N1} km" -f $distanceKm
    Elevation = "{0:N0} m" -f $elevationGain
    Time = Format-ActivityTime -TotalMinutes $durationMinutes
    Gpx = $relativePath
  }
}

$existingData = if (Test-Path -LiteralPath $OutputPath) {
  Get-Content -LiteralPath $OutputPath -Raw | ConvertFrom-Json
} else {
  [pscustomobject]@{ adventures = @() }
}

$existingByGpx = @{}
foreach ($item in @($existingData.adventures)) {
  if ($item.gpx) {
    $existingByGpx[$item.gpx] = $item
  }
}

$adventures = @()
Get-ChildItem -LiteralPath $GpxRoot -File -Filter "*.gpx" | Sort-Object Name | ForEach-Object {
  $summary = Get-GpxSummary -File $_
  if (-not $summary) {
    return
  }

  $existing = $existingByGpx[$summary.Gpx]
  $adventures += [ordered]@{
    title = if ($existing.title) { $existing.title } else { $summary.Title }
    type = if ($existing.type) { $existing.type } else { $summary.Type }
    date = $summary.Date
    distance = $summary.Distance
    elevation = $summary.Elevation
    time = $summary.Time
    image = if ($existing.image) { $existing.image } else { "assets/hero-bike-road.svg" }
    chart = if ($existing.chart) { $existing.chart } else { "assets/chart-green.svg" }
    gpx = $summary.Gpx
    youtube = if ($existing.youtube) { $existing.youtube } else { "" }
    story = if ($existing.story) {
      @($existing.story)
    } else {
      @(
        "This is an auto-generated starter story for activity_$($summary.ActivityId). It was created from the GPX file so the card and detail page can exist before the real photos, videos, and written notes are ready.",
        "Replace this text later with the real story of the route: where it started, how the ride or hike felt, what the weather was like, what surprised you, and what another visitor should know before trying it.",
        "The map, chart, distance, elevation, and moving time already come from the GPX file. This story section is where the human part of the adventure will live."
      )
    }
    description = if ($existing.description) {
      $existing.description
    } else {
      "Auto-generated from $($summary.Gpx). Replace this with a short summary when the real story is ready."
    }
  }
}

$manifest = [ordered]@{
  _comment = "Generated from adventures/gpx by tools/update-adventures.ps1. Static browsers cannot scan GPX folders directly, so the site loads adventure cards from this file."
  adventures = $adventures
}

$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Host "Updated $OutputPath with $($adventures.Count) adventure(s)."
