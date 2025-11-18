/**
 * Custom fetch function that adds /api prefix to all API calls
 * This works with the Vite proxy configuration
 */
export const customFetch = async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  // Add /api prefix to the URL
  const apiUrl = `/api${url}`
  
  const response = await fetch(apiUrl, options)
  
  // Check if response is a PDF or binary file
  const contentType = (response.headers.get('content-type') || '').toLowerCase()

  if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
    // Handle PDF download
    const blob = await response.blob()
    const downloadUrl = window.URL.createObjectURL(blob)
    
    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get('content-disposition')
    let filename = 'documento.pdf'
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, '')
      }
    }
    
    // Trigger download
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    window.URL.revokeObjectURL(downloadUrl)
    
    return {
      data: null,
      status: response.status,
      headers: response.headers
    } as T
  }
  
  // For no-content responses, return empty data
  if ([204, 205, 304].includes(response.status)) {
    return {
      data: {},
      status: response.status,
      headers: response.headers
    } as T
  }

  // If server explicitly returns JSON, use response.json()
  if (contentType.includes('application/json')) {
    try {
      const json = await response.json()
      return {
        data: json,
        status: response.status,
        headers: response.headers
      } as T
    } catch (err) {
      // Fallthrough to text handling below if JSON.parse fails
      const textFallback = await response.text()
      return {
        data: textFallback as unknown as T,
        status: response.status,
        headers: response.headers
      } as T
    }
  }

  // For other content types (HTML error pages, plain text, etc.), try to parse JSON first,
  // but don't throw on parse errors — return raw text instead.
  const text = await response.text()
  try {
    const parsed = text ? JSON.parse(text) : {}
    return {
      data: parsed,
      status: response.status,
      headers: response.headers
    } as T
  } catch (_err) {
    return {
      data: (text as unknown) as T,
      status: response.status,
      headers: response.headers
    } as T
  }
}

export default customFetch
