# Renders public/og-image.png (1200x630) for Open Graph / Twitter card previews.
# Usage from the project root:  powershell -NoProfile -File scripts/generate-og-image.ps1

Add-Type -AssemblyName System.Drawing

$outPath = Join-Path $PSScriptRoot '..\public\og-image.png'

$bitmap = [System.Drawing.Bitmap]::new(1200, 630)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$graphics.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(6, 31, 24)), 0, 0, 1200, 630)

$amber = [System.Drawing.Color]::FromArgb(252, 211, 77)
$white = [System.Drawing.Color]::White
$gray = [System.Drawing.Color]::FromArgb(156, 163, 175)
$emerald = [System.Drawing.Color]::FromArgb(110, 231, 183)

$format = [System.Drawing.StringFormat]::GenericTypographic
$point = [System.Drawing.PointF]::new(0, 0)

$eyebrowFont = [System.Drawing.Font]::new('Segoe UI', 22, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$wordmarkFont = [System.Drawing.Font]::new('Segoe UI', 86, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$taglineFont = [System.Drawing.Font]::new('Segoe UI', 31, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$metaFont = [System.Drawing.Font]::new('Segoe UI', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$badgeFont = [System.Drawing.Font]::new('Segoe UI', 44, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$graphics.DrawString('LIVE WOMEN''S FOOTBALL', $eyebrowFont, [System.Drawing.SolidBrush]::new($emerald), 96, 92, $format)

# Monogram badge
$graphics.DrawRectangle([System.Drawing.Pen]::new($amber, 3), 96, 152, 84, 84)
$badgeSize = $graphics.MeasureString('W', $badgeFont, $point, $format)
$graphics.DrawString('W', $badgeFont, [System.Drawing.SolidBrush]::new($amber), 96 + (84 - $badgeSize.Width) / 2, 152 + (84 - $badgeSize.Height) / 2, $format)

# Wordmark: white "Women", amber "Live", white "Scores", amber full stop
$whiteBrush = [System.Drawing.SolidBrush]::new($white)
$amberBrush = [System.Drawing.SolidBrush]::new($amber)
$x = 210
$graphics.DrawString('Women', $wordmarkFont, $whiteBrush, $x, 146, $format)
$x = $x + $graphics.MeasureString('Women', $wordmarkFont, $point, $format).Width
$graphics.DrawString('Live', $wordmarkFont, $amberBrush, $x, 146, $format)
$x = $x + $graphics.MeasureString('Live', $wordmarkFont, $point, $format).Width
$graphics.DrawString('Scores', $wordmarkFont, $whiteBrush, $x, 146, $format)
$x = $x + $graphics.MeasureString('Scores', $wordmarkFont, $point, $format).Width
$graphics.DrawString('.', $wordmarkFont, $amberBrush, $x, 146, $format)

$grayBrush = [System.Drawing.SolidBrush]::new($gray)
$graphics.DrawString('Live scores, fixtures, lineups & where to watch', $taglineFont, $grayBrush, 96, 292, $format)

$graphics.DrawLine([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(45, 110, 231, 183), 2), 96, 470, 1104, 470)
$graphics.DrawString('WSL  ·  NWSL  ·  UWCL  ·  Liga F  ·  Frauen-Bundesliga', $metaFont, $grayBrush, 96, 508, $format)

$domain = 'womenlivescores.com'
$domainWidth = $graphics.MeasureString($domain, $metaFont, $point, $format).Width
$graphics.DrawString($domain, $metaFont, $amberBrush, 1104 - $domainWidth, 508, $format)

$bitmap.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

Write-Output "Wrote $outPath"
