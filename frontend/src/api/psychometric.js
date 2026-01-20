const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090'

export async function createPsychometricSession(userInfo) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userInfo }),
    })

    if (!response.ok) {
      let message = 'Unable to start session'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function getPsychometricSession(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to fetch session'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function getSessionStatus(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to fetch session status'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function getSessionQuestions(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to fetch questions'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function submitTest(sessionId, submissionData) {
  try {
    const response = await fetch(`${baseUrl}/api/test/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        ...submissionData,
      }),
    })

    if (!response.ok) {
      let message = 'Unable to submit test'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function generateReport(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to generate report'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

export async function getReport(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/report`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to fetch report'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}

/**
 * Download PDF report using the new backend PDF generation endpoint
 * Sends JSON data to backend for server-side PDF generation
 */
export async function downloadReportPdf(sessionId, reportData) {
  try {
    // If reportData is not provided, fetch it first
    if (!reportData) {
      reportData = await getReport(sessionId)
    }

    // Prepare JSON payload for backend PDF generation
    const jsonPayload = {
      userInfo: reportData.userInfo || {},
      scores: {
        correct: reportData.correct || 0,
        totalQuestions: reportData.totalQuestions || 0,
        candidatePercentile: reportData.candidatePercentile || 0,
        aptitudeScore: reportData.aptitudeScore || 0,
        behavioralScore: reportData.behavioralScore || 0,
        domainScore: reportData.domainScore || 0,
        overallScore: reportData.overallScore || 0,
      },
      swot: {
        strengths: reportData.strengths || [],
        weaknesses: reportData.weaknesses || [],
        opportunities: reportData.opportunities || [],
        threats: reportData.threats || [],
        swotAnalysis: reportData.swotAnalysis || '',
      },
      analysis: {
        summaryBio: reportData.summaryBio || '',
        interviewSummary: reportData.interviewSummary || '',
        fitAnalysis: reportData.fitAnalysis || '',
        behavioralInsights: reportData.behavioralInsights || '',
        domainInsights: reportData.domainInsights || '',
        narrativeSummary: reportData.narrativeSummary || '',
      },
      education: {
        university: reportData.university || '',
        yearOfGraduation: reportData.yearOfGraduation || null,
        degree: reportData.userInfo?.degree || reportData.degree || '',
      },
      personality: {
        openness: reportData.openness || 0,
        conscientiousness: reportData.conscientiousness || 0,
        extraversion: reportData.extraversion || 0,
        agreeableness: reportData.agreeableness || 0,
        neuroticism: reportData.neuroticism || 0,
      },
      chartsData: reportData.chartsData || {},
      reportGeneratedAt: reportData.reportGeneratedAt || new Date().toISOString(),
    }

    // Call the new POST endpoint for PDF generation
    const response = await fetch(`${baseUrl}/api/report/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonPayload),
    })

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`)
    }

    // Get the PDF blob from response
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `psychometric-report-${sessionId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw error
  }
}

/**
 * Download PDF with all psychometric test questions and user's answers
 */
export async function downloadAnswersPdf(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/answers/pdf`, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
      },
    })

    if (!response.ok) {
      if (response.status === 400) {
        throw new Error('Test must be completed before downloading answers.')
      }
      throw new Error(`Failed to download answers PDF: ${response.status} ${response.statusText}`)
    }

    // Get the PDF blob from response
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `psychometric-answers-${sessionId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Error downloading answers PDF:', error)
    throw error
  }
}

/**
 * Save a psychometric report for the current user
 */
export async function saveReport(sessionId, reportTitle = null) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Authentication required to save report')
    }

    const response = await fetch(`${baseUrl}/api/psychometric/saved-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        sessionId,
        reportTitle,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to save reports')
      }
      if (response.status === 409) {
        throw new Error('Report already saved')
      }
      throw new Error(`Failed to save report: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error saving report:', error)
    throw error
  }
}

/**
 * Get all saved reports for the current user
 */
export async function getSavedReports() {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Authentication required to view saved reports')
    }

    const response = await fetch(`${baseUrl}/api/psychometric/saved-reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to view saved reports')
      }
      throw new Error(`Failed to fetch saved reports: ${response.status} ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('Error fetching saved reports:', error)
    throw error
  }
}

/**
 * Check if a report is already saved
 */
export async function checkReportSaved(sessionId) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    const response = await fetch(`${baseUrl}/api/psychometric/saved-reports/check/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return false
    }

    return response.json()
  } catch (error) {
    console.error('Error checking if report is saved:', error)
    return false
  }
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(sessionId) {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('Authentication required to delete reports')
    }

    const response = await fetch(`${baseUrl}/api/psychometric/saved-reports/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please log in to delete reports')
      }
      throw new Error(`Failed to delete saved report: ${response.status} ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting saved report:', error)
    throw error
  }
}

/**
 * Generate a concise profile from psychometric report
 */
export async function generateProfileFromReport(sessionId) {
  try {
    const response = await fetch(`${baseUrl}/api/psychometric/sessions/${sessionId}/generate-profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      let message = 'Unable to generate profile from report'
      try {
        const errorBody = await response.json()
        message =
          typeof errorBody === 'string'
            ? errorBody
            : JSON.stringify(errorBody)
      } catch (err) {
        message = `Server error: ${response.status} ${response.statusText}`
      }
      throw new Error(message)
    }

    return response.text()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        `Failed to connect to backend at ${baseUrl}. Please ensure the backend is running and accessible.`
      )
    }
    throw error
  }
}


