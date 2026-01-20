import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getPsychometricSession, generateReport } from '../../api/psychometric'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

function PsychometricResult() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [results, setResults] = useState(location.state?.results || null)
  const [session, setSession] = useState(null)
  const [isLoading, setIsLoading] = useState(!results)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    if (sessionId) {
      loadSession()
    }
  }, [sessionId])

  const loadSession = async () => {
    try {
      const sessionData = await getPsychometricSession(sessionId)
      setSession(sessionData)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load session:', error)
      setIsLoading(false)
    }
  }

  // Calculate section-wise breakdown if session data is available
  // Excludes Behavioral section (section 2) - only shows Aptitude (1) and Domain (3)
  const getSectionStats = () => {
    if (!session?.questions || !session?.answers) {
      return null
    }

    const sectionStats = {
      1: { name: 'Aptitude', attempted: 0, correct: 0, wrong: 0, total: 0 },
      3: { name: 'Domain', attempted: 0, correct: 0, wrong: 0, total: 0 },
    }

    // Filter out Behavioral section (section 2) questions
    const scoringQuestions = session.questions.filter((q) => q.sectionNumber !== 2)

    scoringQuestions.forEach((question) => {
      const sectionNum = question.sectionNumber
      if (!sectionStats[sectionNum]) return

      sectionStats[sectionNum].total++

      const answer = session.answers.find((a) => a.questionId === question.id)
      if (answer && answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined) {
        sectionStats[sectionNum].attempted++
        
        // Aptitude and Domain: Use correctOptionIndex
        const correctAnswer = question.correctOptionIndex
        if (correctAnswer !== null && correctAnswer !== undefined) {
          if (answer.selectedOptionIndex == correctAnswer) {
            sectionStats[sectionNum].correct++
          } else {
            sectionStats[sectionNum].wrong++
          }
        } else {
          // If correctOptionIndex missing, count as wrong (consistent with calculateResults)
          sectionStats[sectionNum].wrong++
        }
      }
    })

    return sectionStats
  }

  const sectionStats = getSectionStats()

  // Function to map category to trait name
  const getTraitFromCategory = (category) => {
    if (!category) return 'Other'
    const categoryLower = category.toLowerCase()
    
    if (categoryLower.includes('openness')) return 'Openness'
    if (categoryLower.includes('conscientiousness')) return 'Conscientiousness'
    if (categoryLower.includes('extraversion')) return 'Extraversion'
    if (categoryLower.includes('agreeableness')) return 'Agreeableness'
    if (categoryLower.includes('neuroticism')) return 'Neuroticism'
    if (categoryLower.includes('conflict_resolution') || categoryLower.includes('conflict resolution')) return 'Conflict Resolution'
    if (categoryLower.includes('attention_to_detail') || categoryLower.includes('attention to detail')) return 'Attention to Detail'
    if (categoryLower.includes('leadership')) return 'Leadership'
    if (categoryLower.includes('adaptability')) return 'Adaptability'
    if (categoryLower.includes('communication')) return 'Communication'
    
    // Return formatted category name
    return category.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // Function to get trait color
  const getTraitColor = (trait) => {
    const colorMap = {
      'Openness': '#3b82f6',
      'Conscientiousness': '#10b981',
      'Extraversion': '#f59e0b',
      'Agreeableness': '#8b5cf6',
      'Neuroticism': '#ef4444',
      'Conflict Resolution': '#06b6d4',
      'Attention to Detail': '#14b8a6',
      'Leadership': '#f97316',
      'Adaptability': '#84cc16',
      'Communication': '#6366f1',
    }
    return colorMap[trait] || '#64748b'
  }

  // Function to prepare graph data for behavior questions
  const getBehaviorQuestionGraphs = () => {
    if (!session?.questions || !session?.answers) return []

    // Get all behavior section questions (section 2)
    const behaviorQuestions = session.questions
      .filter(q => q.sectionNumber === 2)
      .map((q, index) => {
        // Find user's answer for this question
        const answer = session.answers.find(a => a.questionId === q.id)
        const selectedOptionIndex = answer?.selectedOptionIndex
        
        // Get trait impact score for the selected option
        let traitImpactScore = 0
        let selectedOption = null
        
        if (selectedOptionIndex !== null && selectedOptionIndex !== undefined) {
          selectedOption = ['A', 'B', 'C', 'D'][selectedOptionIndex] || null
          
          // Get the trait impact score for the selected option
          if (q.traitImpactScores && 
              selectedOptionIndex >= 0 && 
              selectedOptionIndex < q.traitImpactScores.length) {
            traitImpactScore = q.traitImpactScores[selectedOptionIndex]
          } else {
            // Fallback: if no traitImpactScores, use 0
            traitImpactScore = 0
          }
        }

        return {
          question: q,
          questionNumber: index + 1,
          trait: getTraitFromCategory(q.category),
          category: q.category,
          selectedOptionIndex: selectedOptionIndex,
          selectedOption: selectedOption,
          traitImpactScore: traitImpactScore,
          isAnswered: selectedOptionIndex !== null && selectedOptionIndex !== undefined
        }
      })

    // Split into 4 groups of 10
    const graphs = []
    for (let i = 0; i < 4; i++) {
      const startIdx = i * 10
      const endIdx = startIdx + 10
      const questionsForGraph = behaviorQuestions.slice(startIdx, endIdx)
      
      if (questionsForGraph.length === 0) continue
      
      const graphData = questionsForGraph.map((item, idx) => ({
        questionNum: startIdx + idx + 1,
        questionLabel: `Q${startIdx + idx + 1}`,
        trait: item.trait,
        category: item.category,
        selectedOption: item.selectedOption,
        traitImpactScore: item.traitImpactScore,
        isAnswered: item.isAnswered
      }))

      graphs.push({
        title: `Questions ${startIdx + 1}-${Math.min(endIdx, behaviorQuestions.length)}`,
        data: graphData,
        startQuestion: startIdx + 1,
        endQuestion: Math.min(endIdx, behaviorQuestions.length)
      })
    }

    return graphs
  }

  const behaviorGraphs = getBehaviorQuestionGraphs()

  if (isLoading && !results) {
    return (
      <div className="page">
        <div className="card">
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="page">
        <div className="card">
          <p className="error">No results found</p>
          <button onClick={() => navigate('/psychometric/start')}>Go Back</button>
        </div>
      </div>
    )
  }

  const accuracy = results.attempted > 0 
    ? ((results.correct / results.attempted) * 100).toFixed(1) 
    : 0

  const submittedDate = results.submittedAt 
    ? new Date(results.submittedAt).toLocaleString() 
    : 'N/A'

  const handleViewReport = async () => {
    setIsGeneratingReport(true)
    try {
      await generateReport(sessionId)
      navigate(`/psychometric/report/${sessionId}`)
    } catch (error) {
      console.error('Failed to generate report:', error)
      alert('Failed to generate report. Please ensure the test is completed and try again.')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="page">
      <header className="page__header">
        <div>
          <p className="eyebrow">Test Results</p>
          <h1>Assessment Complete</h1>
          <p className="muted">
            Session ID: <strong>{sessionId}</strong>
          </p>
          {session?.userInfo && (
            <p className="muted">
              Candidate: <strong>{session.userInfo.name}</strong>
            </p>
          )}
        </div>
      </header>

      <main className="card">
        <div className="results-container">
          <div className="results-header">
            <h2>Test Summary</h2>
            <p className="muted">Submitted on: {submittedDate}</p>
          </div>

          <div className="results-grid">
            <div className="result-card">
              <div className="result-label">Total Questions</div>
              <div className="result-value">{results.totalQuestions}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Attempted</div>
              <div className="result-value success">{results.attempted}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Not Attempted</div>
              <div className="result-value warning">{results.notAttempted}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Correct Answers</div>
              <div className="result-value success">{results.correct}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Wrong Answers</div>
              <div className="result-value error">{results.wrong}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Accuracy</div>
              <div className="result-value">{accuracy}%</div>
            </div>

            <div className="result-card">
              <div className="result-label">Marked for Review</div>
              <div className="result-value info">{results.markedForReview}</div>
            </div>

            <div className="result-card">
              <div className="result-label">Answered & Marked</div>
              <div className="result-value info">{results.answeredAndMarkedForReview}</div>
            </div>
          </div>

          {/* Section-wise Breakdown */}
          {sectionStats && (
            <div className="section-breakdown">
              <h3 style={{ marginTop: '32px', marginBottom: '16px', fontSize: '20px', fontWeight: 700, color: '#0b132b' }}>
                Section-wise Performance
              </h3>
              <div className="results-grid">
                {Object.values(sectionStats).map((stats) => {
                  const sectionAccuracy = stats.attempted > 0 
                    ? ((stats.correct / stats.attempted) * 100).toFixed(1) 
                    : 0
                  return (
                    <div key={stats.name} className="result-card" style={{ gridColumn: 'span 1' }}>
                      <div className="result-label">{stats.name}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        <div style={{ fontSize: '14px', color: '#52606d' }}>
                          Total: <strong>{stats.total}</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#52606d' }}>
                          Attempted: <strong style={{ color: '#059669' }}>{stats.attempted}</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#52606d' }}>
                          Correct: <strong style={{ color: '#059669' }}>{stats.correct}</strong>
                        </div>
                        <div style={{ fontSize: '14px', color: '#52606d' }}>
                          Wrong: <strong style={{ color: '#dc2626' }}>{stats.wrong}</strong>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0b132b', marginTop: '4px' }}>
                          Accuracy: {sectionAccuracy}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Behavior Section Trait Classification Graphs */}
          {behaviorGraphs.length > 0 && (
            <div className="behavior-graphs-section" style={{ marginTop: '32px', marginBottom: '32px' }}>
              <h3 style={{ 
                marginBottom: '24px', 
                fontSize: '20px', 
                fontWeight: 700, 
                color: '#0b132b' 
              }}>
                Behavior Section - Trait Classification
              </h3>
              <div className="behavior-graphs-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
                marginBottom: '24px'
              }}>
                {behaviorGraphs.map((graph, graphIndex) => {
                  // Get unique traits for legend
                  const uniqueTraits = [...new Set(graph.data.map(d => d.trait))]
                  
                  // Create legend data
                  const legendData = uniqueTraits.map(trait => ({
                    value: trait,
                    type: 'square',
                    color: getTraitColor(trait)
                  }))

                  return (
                    <div 
                      key={graphIndex} 
                      className="behavior-graph-card"
                      style={{
                        background: '#ffffff',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#0b132b',
                        marginBottom: '16px',
                        textAlign: 'center'
                      }}>
                        {graph.title}
                      </h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={graph.data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="questionLabel" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            label={{ 
                              value: 'Questions', 
                              position: 'insideBottom',
                              offset: -5,
                              style: { fill: '#64748b', fontSize: 12 }
                            }}
                          />
                          <YAxis 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            domain={[0, 100]}
                            label={{ 
                              value: 'Trait Impact Score (0-100)', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#64748b', fontSize: 12 }
                            }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value, name, props) => {
                              if (props.payload.isAnswered) {
                                return [
                                  `${value} points (Option ${props.payload.selectedOption || 'N/A'})`,
                                  'Trait Impact Score'
                                ]
                              } else {
                                return ['Not Answered', 'Status']
                              }
                            }}
                            labelFormatter={(label) => {
                              const questionData = graph.data.find(d => d.questionLabel === label)
                              return `Question ${label} - ${questionData?.trait || 'Unknown Trait'}`
                            }}
                          />
                          <Bar 
                            dataKey="traitImpactScore" 
                            name="Trait Impact Score"
                            radius={[8, 8, 0, 0]}
                          >
                            {graph.data.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.isAnswered ? getTraitColor(entry.trait) : '#e2e8f0'} 
                                opacity={entry.isAnswered ? 1 : 0.5}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      {/* Custom Legend */}
                      <div style={{
                        marginTop: '16px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        justifyContent: 'center',
                        fontSize: '11px'
                      }}>
                        {legendData.map((item, idx) => (
                          <div key={idx} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <div style={{
                              width: '12px',
                              height: '12px',
                              backgroundColor: item.color,
                              borderRadius: '2px'
                            }}></div>
                            <span style={{ color: '#64748b' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#94a3b8',
                        textAlign: 'center',
                        fontStyle: 'italic'
                      }}>
                        Bar height shows trait impact score (0-100) for selected answer
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="results-actions">
            <button 
              onClick={() => navigate('/psychometric/start')}
              className="btn-primary"
            >
              Start New Assessment
            </button>
            <button
              onClick={handleViewReport}
              className="btn-secondary"
              disabled={isGeneratingReport}
            >
              {isGeneratingReport ? 'Preparing Report...' : 'View Detailed Report'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default PsychometricResult
