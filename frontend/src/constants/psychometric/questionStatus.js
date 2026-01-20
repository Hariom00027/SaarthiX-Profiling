export const QuestionStatus = {
  NOT_VISITED: 'NOT_VISITED',
  VISITED_NOT_ANSWERED: 'VISITED_NOT_ANSWERED',
  ANSWERED: 'ANSWERED',
  MARKED_FOR_REVIEW: 'MARKED_FOR_REVIEW',
  ANSWERED_AND_MARKED_FOR_REVIEW: 'ANSWERED_AND_MARKED_FOR_REVIEW',
}

export const QuestionStatusColors = {
  [QuestionStatus.NOT_VISITED]: '#ffffff',
  [QuestionStatus.VISITED_NOT_ANSWERED]: '#fb923c',
  [QuestionStatus.ANSWERED]: '#10b981',
  [QuestionStatus.MARKED_FOR_REVIEW]: '#8b5cf6',
  [QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW]: '#8b5cf6',
}

export const QuestionStatusLabels = {
  [QuestionStatus.NOT_VISITED]: 'Not Visited',
  [QuestionStatus.VISITED_NOT_ANSWERED]: 'Seen but Not Answered',
  [QuestionStatus.ANSWERED]: 'Answered',
  [QuestionStatus.MARKED_FOR_REVIEW]: 'Marked for Review',
  [QuestionStatus.ANSWERED_AND_MARKED_FOR_REVIEW]: 'Answered & Marked for Review',
}


