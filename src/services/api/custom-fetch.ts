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
  const contentType = response.headers.get('content-type')
  
  if (contentType?.includes('application/pdf')) {
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
  
  // Handle JSON responses
  const body = [204, 205, 304].includes(response.status) 
    ? null 
    : await response.text()
  
  const data = body ? JSON.parse(body) : {}
  
  return {
    data,
    status: response.status,
    headers: response.headers
  } as T
}

export default customFetch
