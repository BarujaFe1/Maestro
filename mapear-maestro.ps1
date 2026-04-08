param(
  [string]$Root = "D:\Dev\Projetos VibeCoding\Maestro",
  [string]$OutTxt = "D:\Dev\Projetos VibeCoding\Maestro\maestro-supermap.txt",
  [string]$OutJson = "D:\Dev\Projetos VibeCoding\Maestro\maestro-supermap.json",
  [int]$MaxPreviewLines = 40
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $Root)) {
  Write-Error ("Pasta nao encontrada: {0}" -f $Root)
  exit 1
}

$excludeDirs = @(
  ".git",
  "node_modules",
  ".expo",
  ".idea",
  ".vscode",
  "dist",
  "build",
  "coverage",
  ".gradle",
  ".next",
  ".turbo",
  "tmp",
  "temp",
  "bin",
  "obj"
)

$excludeFiles = @(
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "README.md",
  "LICENSE",
  ".gitignore",
  ".gitattributes",
  ".DS_Store",
  "Thumbs.db"
)

$excludeExtensions = @(
  ".log",
  ".tmp",
  ".bak",
  ".swp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".bmp",
  ".ico",
  ".mp4",
  ".mov",
  ".avi",
  ".zip",
  ".rar",
  ".7z",
  ".keystore",
  ".jks",
  ".apk",
  ".aab",
  ".pdf",
  ".mp3",
  ".wav"
)

$interestingExtensions = @(
  ".js", ".jsx", ".ts", ".tsx",
  ".json",
  ".sql",
  ".xml",
  ".kt",
  ".gradle",
  ".properties",
  ".env"
)

function Is-ExcludedPath {
  param([string]$FullName)

  foreach ($dir in $excludeDirs) {
    if ($FullName -match ('(^|[\\/])' + [regex]::Escape($dir) + '([\\/]|$)')) {
      return $true
    }
  }

  return $false
}

function Is-ExcludedFile {
  param([System.IO.FileInfo]$File)

  if ($excludeFiles -contains $File.Name) {
    return $true
  }

  if ($excludeExtensions -contains $File.Extension.ToLower()) {
    return $true
  }

  return $false
}

function Normalize-RelPath {
  param([string]$FullName, [string]$BasePath)

  $baseResolved = (Resolve-Path -LiteralPath $BasePath).Path
  $fileResolved = (Resolve-Path -LiteralPath $FullName).Path

  if ($fileResolved.StartsWith($baseResolved, [System.StringComparison]::OrdinalIgnoreCase)) {
    $rel = $fileResolved.Substring($baseResolved.Length).TrimStart('\')
    return ('./' + ($rel -replace '\\', '/'))
  }

  return $FullName
}

function Read-TextFile {
  param([string]$Path)

  try {
    return Get-Content -LiteralPath $Path -Raw -Encoding UTF8
  }
  catch {
    try {
      return Get-Content -LiteralPath $Path -Raw
    }
    catch {
      return ''
    }
  }
}

function Mask-Secrets {
  param([string]$Text)

  if ([string]::IsNullOrWhiteSpace($Text)) {
    return ''
  }

  $t = $Text

  $t = [regex]::Replace($t, 'EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*.*', 'EXPO_PUBLIC_SUPABASE_ANON_KEY=<redacted>')
  $t = [regex]::Replace($t, 'EXPO_PUBLIC_SUPABASE_URL\s*=\s*.*', 'EXPO_PUBLIC_SUPABASE_URL=<redacted>')
  $t = [regex]::Replace($t, '(?im)(password|secret|token|apikey|api_key)\s*[:=]\s*.+$', '$1=<redacted>')

  return $t
}

function Get-PreviewText {
  param(
    [string]$Path,
    [int]$LineLimit = 30
  )

  try {
    $lines = Get-Content -LiteralPath $Path -Encoding UTF8
  }
  catch {
    try {
      $lines = Get-Content -LiteralPath $Path
    }
    catch {
      return ''
    }
  }

  $take = $lines | Select-Object -First $LineLimit
  $joined = ($take -join [Environment]::NewLine)
  return (Mask-Secrets $joined)
}

function Get-Imports {
  param([string]$Text)

  $result = New-Object System.Collections.Generic.List[string]
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return @()
  }

  $pattern = 'import\s+.*?\s+from\s+[''"]([^''"]+)[''"]|require\(\s*[''"]([^''"]+)[''"]\s*\)'
  $matches = [regex]::Matches($Text, $pattern)

  foreach ($m in $matches) {
    if ($m.Groups[1].Success -and $m.Groups[1].Value) {
      $result.Add($m.Groups[1].Value)
    }
    elseif ($m.Groups[2].Success -and $m.Groups[2].Value) {
      $result.Add($m.Groups[2].Value)
    }
  }

  return $result | Sort-Object -Unique
}

function Get-Exports {
  param([string]$Text)

  $result = New-Object System.Collections.Generic.List[string]
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return @()
  }

  $pattern = 'export\s+(default\s+)?(async\s+)?(function|const|class)\s+([A-Za-z0-9_]+)'
  $matches = [regex]::Matches($Text, $pattern)

  foreach ($m in $matches) {
    if ($m.Groups[4].Success -and $m.Groups[4].Value) {
      $result.Add($m.Groups[4].Value)
    }
  }

  return $result | Sort-Object -Unique
}

function Get-TopLevelSymbols {
  param([string]$Text)

  $result = New-Object System.Collections.Generic.List[string]
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return @()
  }

  $pattern = '(?m)^(async\s+function|function|const)\s+([A-Za-z0-9_]+)'
  $matches = [regex]::Matches($Text, $pattern)

  foreach ($m in $matches) {
    if ($m.Groups[2].Success -and $m.Groups[2].Value) {
      $result.Add($m.Groups[2].Value)
    }
  }

  return $result | Sort-Object -Unique
}

function Get-EnvKeys {
  param([string]$Text)

  $result = New-Object System.Collections.Generic.List[string]
  if ([string]::IsNullOrWhiteSpace($Text)) {
    return @()
  }

  $matches1 = [regex]::Matches($Text, 'EXPO_PUBLIC_[A-Z0-9_]+')
  foreach ($m in $matches1) {
    if ($m.Value) {
      $result.Add($m.Value)
    }
  }

  $matches2 = [regex]::Matches($Text, 'process\.env\.([A-Z0-9_]+)')
  foreach ($m in $matches2) {
    if ($m.Groups[1].Success -and $m.Groups[1].Value) {
      $result.Add($m.Groups[1].Value)
    }
  }

  return $result | Sort-Object -Unique
}

function Get-Category {
  param([string]$RelPath)

  switch -Regex ($RelPath) {
    '^./src/screens/'     { return 'screen' }
    '^./src/components/'  { return 'component' }
    '^./src/navigation/'  { return 'navigation' }
    '^./src/context/'     { return 'context' }
    '^./src/services/'    { return 'service' }
    '^./src/utils/'       { return 'utility' }
    '^./src/lib/'         { return 'lib' }
    '^./src/theme/'       { return 'theme' }
    '^./src/data/'        { return 'data' }
    '^./supabase/'        { return 'supabase' }
    '^./android/'         { return 'android' }
    '^./assets/'          { return 'asset-config' }
    '^./App\.js$'         { return 'entrypoint' }
    '^./app\.json$'       { return 'expo-config' }
    '^./eas\.json$'       { return 'build-config' }
    '^./package\.json$'   { return 'package-config' }
    default               { return 'other' }
  }
}

function Add-Line {
  param(
    [System.Text.StringBuilder]$Builder,
    [string]$Text = ''
  )
  [void]$Builder.AppendLine($Text)
}

$allFiles = Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
  -not (Is-ExcludedPath $_.FullName) -and -not (Is-ExcludedFile $_)
}

$selectedFiles = $allFiles | Where-Object {
  ($interestingExtensions -contains $_.Extension.ToLower()) -or
  ($_.Name -in @('App.js', 'app.json', 'eas.json', 'package.json', '.env', '.env.example', 'AndroidManifest.xml', 'build.gradle', 'settings.gradle', 'gradle.properties'))
} | Sort-Object FullName

$report = [ordered]@{
  generated_at        = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
  root                = $Root
  total_files_scanned = $selectedFiles.Count
  excluded_dirs       = $excludeDirs
  excluded_files      = $excludeFiles
  excluded_extensions = $excludeExtensions
  package             = $null
  expo                = $null
  eas                 = $null
  env_keys            = @()
  files               = @()
}

$allEnvKeys = New-Object System.Collections.Generic.List[string]

foreach ($file in $selectedFiles) {
  $rel = Normalize-RelPath -FullName $file.FullName -BasePath $Root
  $text = Read-TextFile -Path $file.FullName

  $imports = @()
  $exports = @()
  $symbols = @()

  if ($file.Extension.ToLower() -in @('.js', '.jsx', '.ts', '.tsx')) {
    $imports = Get-Imports -Text $text
    $exports = Get-Exports -Text $text
    $symbols = Get-TopLevelSymbols -Text $text
  }

  $preview = Get-PreviewText -Path $file.FullName -LineLimit $MaxPreviewLines

  foreach ($k in (Get-EnvKeys -Text $text)) {
    $allEnvKeys.Add($k)
  }

  if ($file.Name -eq 'package.json') {
    try {
      $pkg = $text | ConvertFrom-Json
      $report.package = [ordered]@{
        name         = $pkg.name
        version      = $pkg.version
        scripts      = $pkg.scripts
        dependencies = $pkg.dependencies
      }
    } catch {}
  }

  if ($file.Name -eq 'app.json') {
    try {
      $app = $text | ConvertFrom-Json
      $report.expo = $app.expo
    } catch {}
  }

  if ($file.Name -eq 'eas.json') {
    try {
      $eas = $text | ConvertFrom-Json
      $report.eas = $eas
    } catch {}
  }

  $report.files += [ordered]@{
    path              = $rel
    category          = (Get-Category -RelPath $rel)
    size_bytes        = $file.Length
    imports           = $imports
    exports           = $exports
    top_level_symbols = $symbols
    preview           = $preview
  }
}

$report.env_keys = $allEnvKeys | Sort-Object -Unique

$builder = New-Object System.Text.StringBuilder

Add-Line $builder 'MAESTRO - SUPERMAPEAMENTO TECNICO'
Add-Line $builder '================================'
Add-Line $builder
Add-Line $builder ('Gerado em: ' + $report.generated_at)
Add-Line $builder ('Raiz: ' + $report.root)
Add-Line $builder ('Arquivos incluidos: ' + $report.total_files_scanned)
Add-Line $builder

Add-Line $builder 'CRITERIO DE FILTRAGEM'
Add-Line $builder '---------------------'
Add-Line $builder 'O foco e mostrar apenas o que afeta funcionamento, build, navegacao, backend e dados.'
Add-Line $builder

Add-Line $builder 'Pastas excluidas:'
foreach ($x in $excludeDirs) {
  Add-Line $builder ('- ' + $x)
}
Add-Line $builder

Add-Line $builder 'Arquivos excluidos:'
foreach ($x in $excludeFiles) {
  Add-Line $builder ('- ' + $x)
}
Add-Line $builder

Add-Line $builder 'Extensoes excluidas:'
foreach ($x in $excludeExtensions) {
  Add-Line $builder ('- ' + $x)
}
Add-Line $builder

if ($report.package) {
  Add-Line $builder 'PACKAGE.JSON'
  Add-Line $builder '------------'
  Add-Line $builder ('name: ' + $report.package.name)
  Add-Line $builder ('version: ' + $report.package.version)
  Add-Line $builder

  Add-Line $builder 'scripts:'
  if ($report.package.scripts) {
    foreach ($p in $report.package.scripts.PSObject.Properties) {
      Add-Line $builder ('- ' + $p.Name + ': ' + [string]$p.Value)
    }
  }
  Add-Line $builder

  Add-Line $builder 'dependencies:'
  if ($report.package.dependencies) {
    foreach ($p in ($report.package.dependencies.PSObject.Properties | Sort-Object Name)) {
      Add-Line $builder ('- ' + $p.Name + ': ' + [string]$p.Value)
    }
  }
  Add-Line $builder
}

if ($report.expo) {
  Add-Line $builder 'APP.JSON'
  Add-Line $builder '--------'
  Add-Line $builder ('name: ' + [string]$report.expo.name)
  Add-Line $builder ('slug: ' + [string]$report.expo.slug)
  Add-Line $builder ('version: ' + [string]$report.expo.version)
  if ($report.expo.android -and $report.expo.android.package) {
    Add-Line $builder ('android.package: ' + [string]$report.expo.android.package)
  }
  Add-Line $builder
}

if ($report.eas) {
  Add-Line $builder 'EAS.JSON'
  Add-Line $builder '--------'
  if ($report.eas.build) {
    foreach ($p in $report.eas.build.PSObject.Properties) {
      $v = $p.Value | ConvertTo-Json -Depth 10 -Compress
      Add-Line $builder ('- ' + $p.Name + ': ' + $v)
    }
  }
  Add-Line $builder
}

Add-Line $builder 'VARIAVEIS DE AMBIENTE ENCONTRADAS'
Add-Line $builder '---------------------------------'
foreach ($k in $report.env_keys) {
  Add-Line $builder ('- ' + $k)
}
Add-Line $builder

Add-Line $builder 'RESUMO POR CATEGORIA'
Add-Line $builder '--------------------'
$grouped = $report.files | Group-Object category | Sort-Object Name
foreach ($g in $grouped) {
  Add-Line $builder ('- ' + $g.Name + ': ' + $g.Count)
}
Add-Line $builder

$orderedSections = @(
  'entrypoint',
  'package-config',
  'expo-config',
  'build-config',
  'navigation',
  'context',
  'lib',
  'service',
  'utility',
  'theme',
  'data',
  'screen',
  'component',
  'supabase',
  'android',
  'other'
)

foreach ($section in $orderedSections) {
  $items = $report.files | Where-Object { $_.category -eq $section } | Sort-Object path
  if (-not $items -or $items.Count -eq 0) {
    continue
  }

  Add-Line $builder ($section.ToUpper())
  Add-Line $builder ([string]('-' * $section.Length))
  Add-Line $builder

  foreach ($item in $items) {
    Add-Line $builder ('ARQUIVO: ' + $item.path)
    Add-Line $builder ('categoria: ' + $item.category)
    Add-Line $builder ('tamanho_bytes: ' + [string]$item.size_bytes)

    if ($item.imports -and $item.imports.Count -gt 0) {
      Add-Line $builder ('imports: ' + ($item.imports -join ', '))
    }

    if ($item.exports -and $item.exports.Count -gt 0) {
      Add-Line $builder ('exports: ' + ($item.exports -join ', '))
    }

    if ($item.top_level_symbols -and $item.top_level_symbols.Count -gt 0) {
      Add-Line $builder ('simbolos: ' + ($item.top_level_symbols -join ', '))
    }

    Add-Line $builder 'preview_inicio'
    if ($item.preview) {
      $previewLines = $item.preview -split "\r?\n"
      foreach ($line in $previewLines) {
        Add-Line $builder ('    ' + $line)
      }
    }
    Add-Line $builder 'preview_fim'
    Add-Line $builder
  }
}

Add-Line $builder 'MAPA COMPACTO DE ARQUIVOS'
Add-Line $builder '-------------------------'
foreach ($item in ($report.files | Sort-Object path)) {
  Add-Line $builder ('- [' + $item.category + '] ' + $item.path)
}
Add-Line $builder

Add-Line $builder 'OBSERVACOES'
Add-Line $builder '-----------'
Add-Line $builder '- Secrets encontrados no preview foram mascarados.'
Add-Line $builder '- Arquivos genericos e binarios foram excluidos.'
Add-Line $builder '- Se o TXT ficar grande demais, rode de novo com -MaxPreviewLines 20.'
Add-Line $builder

$builder.ToString() | Out-File -LiteralPath $OutTxt -Encoding utf8
($report | ConvertTo-Json -Depth 20) | Out-File -LiteralPath $OutJson -Encoding utf8

Write-Host ''
Write-Host 'Supermapeamento gerado com sucesso.'
Write-Host ('TXT  : ' + $OutTxt)
Write-Host ('JSON : ' + $OutJson)
Write-Host ''
Write-Host 'Dica: anexe primeiro o TXT no chat.'