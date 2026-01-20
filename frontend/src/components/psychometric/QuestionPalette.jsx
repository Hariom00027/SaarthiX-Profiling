import QuestionBox from './QuestionBox'
import LegendItem from './LegendItem'
import { QuestionStatus } from '../../constants/psychometric/questionStatus'

function QuestionPalette({ questions, questionStatuses, currentQuestionId, onQuestionClick }) {
  const getQuestionStatus = (questionId) => {
    return questionStatuses[questionId]?.status || QuestionStatus.NOT_VISITED
  }

  const getQuestionNumber = (question, index) => {
    return index + 1
  }

  return (
    <div className="question-palette">
      <div className="palette-header">
        <h3>Question Palette</h3>
      </div>

      <div className="palette-legend">
        <LegendItem status={QuestionStatus.NOT_VISITED} />
        <LegendItem status={QuestionStatus.VISITED_NOT_ANSWERED} />
        <LegendItem status={QuestionStatus.ANSWERED} />
        <LegendItem status={QuestionStatus.MARKED_FOR_REVIEW} />
      </div>

      <div className="palette-grid">
        {questions.map((question, index) => {
          const questionNumber = getQuestionNumber(question, index)
          const status = getQuestionStatus(question.id)
          const isCurrent = question.id === currentQuestionId

          return (
            <QuestionBox
              key={question.id}
              questionNumber={questionNumber}
              status={status}
              isCurrent={isCurrent}
              onClick={() => onQuestionClick(question.id, index)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default QuestionPalette


