# PowerShell script to test Frappe API with local file
# Save as: test-frappe-upload.ps1

$apiUrl = "https://sponge-balanced-cat.ngrok-free.app/api/method/upload_file"
$authToken = "token 0a3ac2415acc9a4:ee04f1881306858"
$filePath = "assets/icon.png"

# Create multipart form data
$boundary = [System.Guid]::NewGuid().ToString()
$contentType = "multipart/form-data; boundary=$boundary"

# Read file as bytes
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))

# Create form data
$formData = @"
--$boundary
Content-Disposition: form-data; name="is_private"

0
--$boundary
Content-Disposition: form-data; name="folder"

Home/Consumer Survey
--$boundary
Content-Disposition: form-data; name="file"; filename="$([System.IO.Path]::GetFileName($filePath))"
Content-Type: image/png

"@ + [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($fileBytes) + @"

--$boundary--
"@

Write-Host "🧪 Testing Frappe API with local file..."
Write-Host "📁 File: $filePath ($( $fileBytes.Length) bytes)"
Write-Host "🌐 URL: $apiUrl"
Write-Host ""

try {
    # Create headers as hashtable (PowerShell syntax)
    $headers = @{
        "Authorization" = $authToken
        "Content-Type" = $contentType
    }

    $response = Invoke-WebRequest -Uri $apiUrl `
        -Method POST `
        -Headers $headers `
        -Body $formData `
        -ContentType $contentType

    Write-Host "✅ Upload successful!"
    Write-Host "📥 Response Status: $($response.StatusCode)"
    Write-Host "📋 Response Body:"
    Write-Host $response.Content
} catch {
    Write-Host "❌ Upload failed!"
    Write-Host "💥 Error: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "📋 Error Response: $errorBody"
    }
}
