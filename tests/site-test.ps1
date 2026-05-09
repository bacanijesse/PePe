param(
    [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$ErrorActionPreference = "Stop"
$failures = New-Object System.Collections.Generic.List[string]

function Add-Failure {
    param([string]$Message)
    $script:failures.Add($Message)
}

function Assert-True {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        Add-Failure $Message
    }
}

function Get-RepoPath {
    param([string]$RelativePath)
    return Join-Path $Root ($RelativePath -replace "/", [IO.Path]::DirectorySeparatorChar)
}

function Read-Json {
    param([string]$RelativePath)
    return Get-Content -Raw -Path (Get-RepoPath $RelativePath) | ConvertFrom-Json
}

function Test-LocalReference {
    param([string]$Reference)

    return $Reference `
        -and -not $Reference.StartsWith("#") `
        -and -not $Reference.StartsWith("mailto:") `
        -and -not $Reference.StartsWith("tel:") `
        -and -not $Reference.StartsWith("data:") `
        -and $Reference -notmatch "^(?:https?:)?//"
}

function Remove-UrlSuffix {
    param([string]$Reference)
    return ($Reference -split "[?#]")[0]
}

function Get-DistanceKm {
    param(
        [double]$StartLat,
        [double]$StartLon,
        [double]$EndLat,
        [double]$EndLon
    )

    $earthRadiusKm = 6371
    $toRad = [Math]::PI / 180
    $dLat = ($EndLat - $StartLat) * $toRad
    $dLon = ($EndLon - $StartLon) * $toRad
    $lat1 = $StartLat * $toRad
    $lat2 = $EndLat * $toRad
    $a = [Math]::Pow([Math]::Sin($dLat / 2), 2) + [Math]::Cos($lat1) * [Math]::Cos($lat2) * [Math]::Pow([Math]::Sin($dLon / 2), 2)
    return $earthRadiusKm * 2 * [Math]::Atan2([Math]::Sqrt($a), [Math]::Sqrt(1 - $a))
}

function Get-GpxTrack {
    param([string]$RelativePath)

    [xml]$xml = Get-Content -Raw -Path (Get-RepoPath $RelativePath)
    $points = @()
    $distance = 0.0
    $previous = $null

    foreach ($point in $xml.GetElementsByTagName("trkpt")) {
        $current = [pscustomobject]@{
            Lat = [double]$point.lat
            Lon = [double]$point.lon
            Ele = [double]$point.ele
            Time = [datetime]$point.time
            Distance = 0.0
        }

        if ($previous) {
            $distance += Get-DistanceKm $previous.Lat $previous.Lon $current.Lat $current.Lon
        }

        $current.Distance = $distance
        $points += $current
        $previous = $current
    }

    return $points
}

function Get-DurationLabel {
    param([double]$Minutes)

    $roundedMinutes = [Math]::Max(0, [Math]::Round($Minutes))
    $hours = [Math]::Floor($roundedMinutes / 60)
    $remainingMinutes = $roundedMinutes % 60
    $parts = @()

    if ($hours) {
        $parts += "${hours}h"
    }

    if ($remainingMinutes -or -not $parts.Count) {
        $parts += "${remainingMinutes}m"
    }

    return ($parts -join " ")
}

function Get-GpxSummary {
    param([array]$Track)

    $firstTimedPoint = $Track | Where-Object { $_.Time } | Select-Object -First 1
    $lastTimedPoint = $Track | Where-Object { $_.Time } | Select-Object -Last 1
    $elevationGain = 0.0

    for ($i = 1; $i -lt $Track.Count; $i++) {
        $gain = $Track[$i].Ele - $Track[$i - 1].Ele
        if ($gain -gt 0) {
            $elevationGain += $gain
        }
    }

    return [pscustomobject]@{
        Date = $firstTimedPoint.Time.ToUniversalTime().ToString("MMM d, yyyy", [Globalization.CultureInfo]::InvariantCulture)
        Distance = "{0:N1} km" -f $Track[-1].Distance
        Elevation = "{0:N0} m" -f [Math]::Round($elevationGain)
        Time = Get-DurationLabel (($lastTimedPoint.Time - $firstTimedPoint.Time).TotalMinutes)
    }
}

function Add-ReferencesFromJson {
    param(
        [string]$JsonText,
        [System.Collections.Generic.HashSet[string]]$References
    )

    foreach ($match in [regex]::Matches($JsonText, '"(assets/[^"]+|adventures/[^"]+)"')) {
        $reference = Remove-UrlSuffix $match.Groups[1].Value
        if (Test-LocalReference $reference) {
            [void]$References.Add($reference)
        }
    }
}

Write-Host "Running static site tests..."

$adventureIndex = Read-Json "data/adventures-index.json"
$quotes = Read-Json "data/quotes.json"
$testimonials = Read-Json "data/testimonials.json"
$essentials = Read-Json "data/trip-essentials.json"

Assert-True (($adventureIndex.adventures | Measure-Object).Count -gt 0) "data/adventures-index.json should contain adventures."
Assert-True (($quotes.quotes | Measure-Object).Count -gt 0) "data/quotes.json should contain quotes."
Assert-True (($testimonials.testimonials | Measure-Object).Count -gt 0) "data/testimonials.json should contain testimonials."
Assert-True (($essentials.essentials | Measure-Object).Count -gt 0) "data/trip-essentials.json should contain essentials."

$seenIds = @{}
foreach ($adventure in $adventureIndex.adventures) {
    Assert-True ([string]$adventure.activityId -match "^\d+$") "$($adventure.title) should have a numeric activityId."
    Assert-True (-not $seenIds.ContainsKey($adventure.activityId)) "Duplicate activityId $($adventure.activityId)."
    $seenIds[$adventure.activityId] = $true
    Assert-True (@("ride", "hike") -contains $adventure.type) "$($adventure.title) should have type ride or hike."
    Assert-True (-not [string]::IsNullOrWhiteSpace($adventure.location)) "$($adventure.title) should include a location."
    Assert-True (-not [string]::IsNullOrWhiteSpace($adventure.difficulty)) "$($adventure.title) should include a difficulty."
    Assert-True (-not [string]::IsNullOrWhiteSpace($adventure.terrain)) "$($adventure.title) should include terrain notes."
    Assert-True (-not [string]::IsNullOrWhiteSpace($adventure.routeType)) "$($adventure.title) should include a route type."
    Assert-True ($null -ne $adventure.tags -and ($adventure.tags | Measure-Object).Count -gt 0) "$($adventure.title) should include tags."
    Assert-True (Test-Path (Get-RepoPath $adventure.detail)) "$($adventure.detail) should exist."
    Assert-True (Test-Path (Get-RepoPath $adventure.gpx)) "$($adventure.gpx) should exist."

    if ((Test-Path (Get-RepoPath $adventure.detail)) -and (Test-Path (Get-RepoPath $adventure.gpx))) {
        $detail = Read-Json $adventure.detail
        Assert-True ($detail.activityId -eq $adventure.activityId) "$($adventure.detail) activityId should match the index."
        Assert-True ($detail.type -eq $adventure.type) "$($adventure.detail) type should match the index."
        Assert-True ($detail.gpx -eq $adventure.gpx) "$($adventure.detail) GPX path should match the index."
        Assert-True ($detail.location -eq $adventure.location) "$($adventure.detail) location should match the index."
        Assert-True ($detail.difficulty -eq $adventure.difficulty) "$($adventure.detail) difficulty should match the index."
        Assert-True ($detail.routeType -eq $adventure.routeType) "$($adventure.detail) route type should match the index."
        Assert-True ($null -ne $detail.story -and ($detail.story | Measure-Object).Count -gt 0) "$($adventure.detail) should include story paragraphs."
        Assert-True ($null -ne $detail.images) "$($adventure.detail) should include an images array."

        $track = Get-GpxTrack $adventure.gpx
        Assert-True (($track | Measure-Object).Count -gt 1) "$($adventure.gpx) should include track points."

        if (($track | Measure-Object).Count -gt 1) {
            $summary = Get-GpxSummary $track
            Assert-True ($summary.Date -eq $adventure.date) "$($adventure.title) date should match GPX metrics. Expected $($summary.Date), found $($adventure.date)."
            Assert-True ($summary.Distance -eq $adventure.distance) "$($adventure.title) distance should match GPX metrics. Expected $($summary.Distance), found $($adventure.distance)."
            Assert-True ($summary.Elevation -eq $adventure.elevation) "$($adventure.title) elevation should match GPX metrics. Expected $($summary.Elevation), found $($adventure.elevation)."
            Assert-True ($summary.Time -eq $adventure.time) "$($adventure.title) time should match GPX metrics. Expected $($summary.Time), found $($adventure.time)."
        }
    }
}

$references = [System.Collections.Generic.HashSet[string]]::new()
$htmlFiles = Get-ChildItem -Path $Root -Filter "*.html" -File
foreach ($file in $htmlFiles) {
    $html = Get-Content -Raw -Path $file.FullName
    foreach ($match in [regex]::Matches($html, '\b(?:src|href|data-bg)="([^"]*)"')) {
        $reference = Remove-UrlSuffix $match.Groups[1].Value
        if (Test-LocalReference $reference) {
            [void]$references.Add($reference)
        }
    }
}

$css = Get-Content -Raw -Path (Get-RepoPath "style.css")
foreach ($match in [regex]::Matches($css, 'url\(["'']?([^"'')]+)["'']?\)')) {
    $reference = Remove-UrlSuffix $match.Groups[1].Value
    if (Test-LocalReference $reference) {
        [void]$references.Add($reference)
    }
}

Get-ChildItem -Path (Get-RepoPath "data") -Filter "*.json" -File | ForEach-Object {
    Add-ReferencesFromJson (Get-Content -Raw -Path $_.FullName) $references
}

Get-ChildItem -Path (Get-RepoPath "adventures") -Filter "*.json" -Recurse -File | ForEach-Object {
    Add-ReferencesFromJson (Get-Content -Raw -Path $_.FullName) $references
}

[void]$references.Add("assets/hero-bike-road.svg")
[void]$references.Add("assets/chart-green.svg")

foreach ($reference in ($references | Sort-Object)) {
    Assert-True (Test-Path (Get-RepoPath $reference)) "$reference should exist."
}

$scriptText = Get-Content -Raw -Path (Get-RepoPath "script.js")
Assert-True ($scriptText -notmatch "<<<<<<<|=======|>>>>>>>") "script.js should not contain merge conflict markers."

Assert-True (Test-Path (Get-RepoPath "robots.txt")) "robots.txt should exist."
Assert-True (Test-Path (Get-RepoPath "sitemap.xml")) "sitemap.xml should exist."

$sitemap = Get-Content -Raw -Path (Get-RepoPath "sitemap.xml")
foreach ($path in @("/", "/rides.html", "/hikes.html", "/about.html", "/privacy.html")) {
    Assert-True ($sitemap.Contains("https://bacanijesse.github.io/PePe$path")) "sitemap.xml should include $path."
}

if ($failures.Count) {
    Write-Host ""
    Write-Host "FAILED $($failures.Count) check(s):"
    foreach ($failure in $failures) {
        Write-Host "- $failure"
    }
    exit 1
}

Write-Host "All static site tests passed."
