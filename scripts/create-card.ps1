Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630
$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

$paper = [System.Drawing.ColorTranslator]::FromHtml('#f7f2e8')
$ink = [System.Drawing.ColorTranslator]::FromHtml('#14213d')
$coral = [System.Drawing.ColorTranslator]::FromHtml('#ff5f56')
$lime = [System.Drawing.ColorTranslator]::FromHtml('#d8f04e')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#39bff0')
$violet = [System.Drawing.ColorTranslator]::FromHtml('#7458e8')

$graphics.Clear($paper)
$graphics.FillEllipse((New-Object System.Drawing.SolidBrush($blue)), 820, -100, 430, 430)
$graphics.FillEllipse((New-Object System.Drawing.SolidBrush($lime)), 760, 350, 360, 360)
$graphics.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(70, $coral))), -120, 390, 360, 360)

$titleFont = New-Object System.Drawing.Font('Arial', 116, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$italicFont = New-Object System.Drawing.Font('Georgia', 120, [System.Drawing.FontStyle]::Italic, [System.Drawing.GraphicsUnit]::Pixel)
$monoFont = New-Object System.Drawing.Font('Consolas', 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$smallFont = New-Object System.Drawing.Font('Consolas', 17, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$graphics.DrawString('A THREE-MINUTE SURVIVOR', $monoFont, (New-Object System.Drawing.SolidBrush($ink)), 76, 78)
$graphics.DrawString('BLOOM', $titleFont, (New-Object System.Drawing.SolidBrush($ink)), 65, 145)
$graphics.FillRectangle((New-Object System.Drawing.SolidBrush($coral)), 67, 298, 495, 12)
$graphics.DrawString('SHIFT', $italicFont, (New-Object System.Drawing.SolidBrush($coral)), 62, 288)
$graphics.DrawString('MOVE. EVOLVE. SURVIVE THE FINAL BLOOM.', $monoFont, (New-Object System.Drawing.SolidBrush($ink)), 76, 493)
$graphics.DrawString('FIELD TEST 001', $smallFont, (New-Object System.Drawing.SolidBrush($ink)), 930, 574)

$flowerBrush = New-Object System.Drawing.SolidBrush($violet)
$flowerOutline = New-Object System.Drawing.Pen($ink, 8)
$points = New-Object 'System.Collections.Generic.List[System.Drawing.PointF]'
for ($i = 0; $i -lt 16; $i++) {
  $angle = -[Math]::PI / 2 + $i * [Math]::PI / 8
  $radius = if ($i % 2 -eq 0) { 92 } else { 46 }
  $points.Add((New-Object System.Drawing.PointF((1015 + [Math]::Cos($angle) * $radius), (260 + [Math]::Sin($angle) * $radius))))
}
$graphics.FillPolygon($flowerBrush, $points.ToArray())
$graphics.DrawPolygon($flowerOutline, $points.ToArray())
$graphics.FillEllipse((New-Object System.Drawing.SolidBrush($paper)), 980, 225, 70, 70)
$graphics.DrawEllipse($flowerOutline, 980, 225, 70, 70)

$outputPath = Join-Path $PSScriptRoot '..\public\card.png'
$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()
