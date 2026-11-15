# Regenerates the geometric sunrise / route mark used at launch (Windows).
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$size = 512
$canvas = [System.Drawing.Bitmap]::new($size, $size)
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$gold = [System.Drawing.ColorTranslator]::FromHtml('#F3A84E')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#3C8FDC')
$sun = [System.Drawing.SolidBrush]::new($gold)
$stroke = [System.Drawing.Pen]::new($gold, 16)
$route = [System.Drawing.Pen]::new($blue, 20)
try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $stroke.StartCap = $stroke.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $route.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    $graphics.FillPie($sun, 174, 180, 164, 164, 180, 180)
    $graphics.DrawLine($stroke, 256, 111, 256, 148)
    $graphics.DrawLine($stroke, 149, 154, 174, 179)
    $graphics.DrawLine($stroke, 363, 154, 338, 179)
    [System.Drawing.Point[]]$points = @(
        [System.Drawing.Point]::new(132, 289),
        [System.Drawing.Point]::new(238, 289),
        [System.Drawing.Point]::new(297, 352),
        [System.Drawing.Point]::new(380, 352)
    )
    $graphics.DrawLines($route, $points)
    $graphics.DrawEllipse($route, 89, 269, 40, 40)
    $graphics.DrawEllipse($route, 383, 332, 40, 40)
    $output = Join-Path $PSScriptRoot '../assets/images/startup-mark.png'
    $canvas.Save($output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally {
    $route.Dispose()
    $stroke.Dispose()
    $sun.Dispose()
    $graphics.Dispose()
    $canvas.Dispose()
}
