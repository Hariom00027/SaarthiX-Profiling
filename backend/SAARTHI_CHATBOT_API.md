# Saarthi AI Interest Evaluation Chatbot - API Documentation

## Overview

Saarthi is an AI-powered career counseling chatbot that evaluates student interests through personalized questions and provides comprehensive career guidance.

## Base URL

```
http://localhost:8080/api
```

## API Endpoints

### 1. Generate Questions

**Endpoint:** `POST /generate-questions`

**Description:** Generates 12 personalized questions based on user profile (3 stages, 4 questions each).

**Request Body:**
```json
{
  "userProfile": {
    "name": "John Doe",
    "email": "john@example.com",
    "institute": "ABC University",
    "currentDegree": "Bachelor's",
    "branch": "Computer Science",
    "yearOfStudy": "Third Year",
    "technicalSkills": "Java, Python, React, Node.js",
    "softSkills": "Leadership, Communication, Teamwork",
    "certifications": "AWS Certified, Google Cloud",
    "achievements": "Won hackathon, Published research paper",
    "hobbies": "Reading, Coding, Photography",
    "goals": "Become a full-stack developer, Start a tech startup"
  }
}
```

**Response:**
```json
{
  "message": "Questions generated successfully",
  "data": {
    "questions": [
      "What technical skills are you most passionate about?",
      "How do you approach solving complex problems?",
      "What projects have you worked on that you're most proud of?",
      "What technologies or tools do you want to learn next?",
      "How do you express your creativity in your work or hobbies?",
      "What role does design thinking play in your projects?",
      "How do you handle feedback and iterate on your ideas?",
      "What innovative solutions have you come up with?",
      "Describe a time when you took on a leadership role.",
      "How do you manage team conflicts or disagreements?",
      "What are your thoughts on starting your own venture?",
      "What research areas interest you the most?"
    ],
    "totalQuestions": 12
  }
}
```

---

### 2. Chat

**Endpoint:** `POST /chat`

**Description:** Processes user messages and returns next question or follow-up WHY question. Tracks conversation state.

**Request Body:**
```json
{
  "userMessage": "I love working with React and building user interfaces. I enjoy creating beautiful and intuitive designs.",
  "conversationState": {
    "currentStage": 1,
    "currentQuestionIndex": 0,
    "questions": [
      "What technical skills are you most passionate about?",
      "How do you approach solving complex problems?",
      "What projects have you worked on that you're most proud of?",
      "What technologies or tools do you want to learn next?",
      "How do you express your creativity in your work or hobbies?",
      "What role does design thinking play in your projects?",
      "How do you handle feedback and iterate on your ideas?",
      "What innovative solutions have you come up with?",
      "Describe a time when you took on a leadership role.",
      "How do you manage team conflicts or disagreements?",
      "What are your thoughts on starting your own venture?",
      "What research areas interest you the most?"
    ],
    "answers": {},
    "pendingWhyQuestion": null,
    "complete": false
  }
}
```

**Response (Next Question):**
```json
{
  "message": "Question processed successfully",
  "data": {
    "nextQuestion": "Why do you think user interface design is important for your projects?",
    "conversationState": {
      "currentStage": 1,
      "currentQuestionIndex": 0,
      "questions": [...],
      "answers": {
        "What technical skills are you most passionate about?": "I love working with React and building user interfaces. I enjoy creating beautiful and intuitive designs."
      },
      "pendingWhyQuestion": "Why do you think user interface design is important for your projects?",
      "complete": false
    },
    "isComplete": false,
    "botName": "Saarthi"
  }
}
```

**Response (Conversation Complete):**
```json
{
  "message": "Conversation completed successfully",
  "data": {
    "nextQuestion": null,
    "conversationState": {
      "currentStage": 4,
      "currentQuestionIndex": 0,
      "questions": [...],
      "answers": {
        "Question 1": "Answer 1",
        "Question 2": "Answer 2",
        ...
      },
      "pendingWhyQuestion": null,
      "complete": true
    },
    "isComplete": true,
    "botName": "Saarthi"
  }
}
```

---

### 3. Evaluate

**Endpoint:** `POST /evaluate`

**Description:** Evaluates user profile and all collected answers to generate comprehensive interest evaluation.

**Request Body:**
```json
{
  "userProfile": {
    "name": "John Doe",
    "email": "john@example.com",
    "institute": "ABC University",
    "currentDegree": "Bachelor's",
    "branch": "Computer Science",
    "yearOfStudy": "Third Year",
    "technicalSkills": "Java, Python, React, Node.js",
    "softSkills": "Leadership, Communication, Teamwork",
    "certifications": "AWS Certified, Google Cloud",
    "achievements": "Won hackathon, Published research paper",
    "hobbies": "Reading, Coding, Photography",
    "goals": "Become a full-stack developer, Start a tech startup"
  },
  "answers": {
    "What technical skills are you most passionate about?": "I love working with React and building user interfaces.",
    "How do you approach solving complex problems?": "I break down problems into smaller parts and solve them systematically.",
    "What projects have you worked on that you're most proud of?": "I built a full-stack e-commerce application.",
    "How do you express your creativity in your work or hobbies?": "I design user interfaces and create art in my free time.",
    "Describe a time when you took on a leadership role.": "I led a team of 5 developers in a hackathon project.",
    "What are your thoughts on starting your own venture?": "I'm very interested in entrepreneurship and want to start my own tech company."
  }
}
```

**Response:**
```json
{
  "message": "Evaluation completed successfully",
  "data": {
    "interests": {
      "tech": 45.5,
      "design": 25.3,
      "management": 15.2,
      "entrepreneurship": 10.0,
      "research": 4.0
    },
    "pieChartLabels": ["Tech", "Design", "Management", "Entrepreneurship", "Research"],
    "pieChartValues": [45.5, 25.3, 15.2, 10.0, 4.0],
    "interestPersona": "You are a tech-savvy creative professional with strong design sensibilities and leadership potential. Your passion for technology combined with your creative abilities makes you well-suited for roles that bridge technical implementation and user experience.",
    "strengths": [
      "Strong technical skills in modern web technologies",
      "Creative problem-solving approach",
      "Leadership experience in team projects",
      "Entrepreneurial mindset"
    ],
    "weaknesses": [
      "Limited research experience",
      "Could benefit from deeper domain expertise"
    ],
    "dos": [
      "Continue building full-stack projects",
      "Focus on UI/UX design skills",
      "Take on leadership roles in team projects",
      "Network with entrepreneurs and startup founders"
    ],
    "donts": [
      "Don't spread yourself too thin across technologies",
      "Don't ignore the business side of technology",
      "Don't underestimate the importance of user research"
    ],
    "recommendedRoles": [
      "Full-Stack Developer",
      "UI/UX Designer",
      "Frontend Developer",
      "Product Manager"
    ],
    "roadmap90Days": "Week 1-4: Complete an advanced React course and build 2 portfolio projects. Week 5-8: Learn design principles and create a design portfolio. Week 9-12: Apply for internships, contribute to open-source projects, and network with industry professionals. Focus on building a strong portfolio that showcases both technical and design skills.",
    "suggestedCourses": [
      "Advanced React and Redux",
      "UI/UX Design Fundamentals",
      "Full-Stack Web Development",
      "Product Management Basics"
    ],
    "projectIdeas": [
      "Build a personal portfolio website with custom animations",
      "Create a SaaS product for a specific niche",
      "Develop a mobile app with React Native"
    ],
    "invalidAnswers": {
      "What technical skills are you most passionate about?": "df",
      "How do you approach solving complex problems?": "d"
    },
    "summary": "Based on your profile and responses, you show strong interest in technology and design, with emerging leadership and entrepreneurial traits. Your technical skills combined with creative abilities position you well for full-stack development or UI/UX design roles. Focus on building a strong portfolio and gaining practical experience through projects and internships."
  }
}
```

---

## Postman Collection Examples

### Generate Questions Request

```http
POST http://localhost:8080/api/generate-questions
Content-Type: application/json

{
  "userProfile": {
    "name": "John Doe",
    "institute": "ABC University",
    "branch": "Computer Science",
    "yearOfStudy": "Third Year",
    "technicalSkills": "Java, Python, React",
    "softSkills": "Leadership, Communication",
    "hobbies": "Coding, Reading",
    "goals": "Become a full-stack developer"
  }
}
```

**Note:** When Saarthi flags one or more answers as very short or placeholder-y, the `/evaluate` response now includes:
- `invalidAnswers`: a map of the question to the captured text so clients can highlight it.
- The `summary` field is automatically prefixed with a warning about relying on the other answers.

### Chat Request

```http
POST http://localhost:8080/api/chat
Content-Type: application/json

{
  "userMessage": "I enjoy building web applications and solving real-world problems.",
  "conversationState": {
    "currentStage": 1,
    "currentQuestionIndex": 0,
    "questions": ["What technical skills are you most passionate about?", ...],
    "answers": {},
    "pendingWhyQuestion": null,
    "complete": false
  }
}
```

### Evaluate Request

```http
POST http://localhost:8080/api/evaluate
Content-Type: application/json

{
  "userProfile": {
    "name": "John Doe",
    "branch": "Computer Science",
    "technicalSkills": "Java, Python, React"
  },
  "answers": {
    "Question 1": "Answer 1",
    "Question 2": "Answer 2"
  }
}
```

---

## Frontend Integration Guide

### Step 1: Initialize Chat State

```javascript
const [chatState, setChatState] = useState({
  currentStage: 1,
  currentQuestionIndex: 0,
  questions: [],
  answers: {},
  pendingWhyQuestion: null,
  complete: false
});
```

### Step 2: Generate Questions

```javascript
const generateQuestions = async (userProfile) => {
  try {
    const response = await fetch('http://localhost:8080/api/generate-questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userProfile }),
    });
    
    const data = await response.json();
    if (data.data && data.data.questions) {
      setChatState(prev => ({
        ...prev,
        questions: data.data.questions,
        currentQuestionIndex: 0,
        currentStage: 1
      }));
    }
  } catch (error) {
    console.error('Error generating questions:', error);
  }
};
```

### Step 3: Process Chat Messages

```javascript
const sendMessage = async (userMessage) => {
  try {
    const response = await fetch('http://localhost:8080/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userMessage,
        conversationState: chatState
      }),
    });
    
    const data = await response.json();
    if (data.data) {
      setChatState(data.data.conversationState);
      
      if (data.data.isComplete) {
        // All questions answered, proceed to evaluation
        proceedToEvaluation();
      } else {
        // Display next question
        displayQuestion(data.data.nextQuestion);
      }
    }
  } catch (error) {
    console.error('Error processing chat:', error);
  }
};
```

### Step 4: Evaluate Results

```javascript
const evaluateInterests = async (userProfile, answers) => {
  try {
    const response = await fetch('http://localhost:8080/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userProfile,
        answers
      }),
    });
    
    const data = await response.json();
    if (data.data) {
      // Display evaluation results
      displayEvaluationResults(data.data);
    }
  } catch (error) {
    console.error('Error evaluating interests:', error);
  }
};
```

---

## Database Storage (Generic Implementation)

### Option 1: Store Chat State in MongoDB

Create a `ChatSession` entity:

```java
@Document(collection = "chat_sessions")
public class ChatSession {
    @Id
    private String id;
    private String userId;
    private ChatState chatState;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // getters and setters
}
```

### Option 2: Store in Frontend (LocalStorage/SessionStorage)

```javascript
// Save chat state
localStorage.setItem('saarthi_chat_state', JSON.stringify(chatState));

// Load chat state
const savedState = JSON.parse(localStorage.getItem('saarthi_chat_state'));
```

### Option 3: Store Evaluation Results

```java
@Document(collection = "evaluations")
public class Evaluation {
    @Id
    private String id;
    private String userId;
    private EvaluationResult result;
    private LocalDateTime evaluatedAt;
    // getters and setters
}
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "message": "Error description",
  "data": null
}
```

**HTTP Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Invalid input
- `500 Internal Server Error`: Server error

---

## Notes

1. **Chatbot Name**: The chatbot is named "Saarthi" (meaning "guide" or "companion" in Hindi).

2. **Question Stages**:
   - Stage 1 (Questions 1-4): Technical skills and problem-solving
   - Stage 2 (Questions 5-8): Creativity and design thinking
   - Stage 3 (Questions 9-12): Leadership, management, entrepreneurship, research

3. **WHY Questions**: The chatbot may ask follow-up "WHY" questions for substantial answers (50+ characters) to dig deeper into user reasoning.

4. **Score Normalization**: Interest scores are automatically normalized to sum to 100%.

5. **JSON Mode**: The evaluation endpoint uses OpenAI's JSON mode to ensure valid JSON responses.

---

## Environment Variables

Ensure the following environment variable is set:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

Or in `application.properties`:

```properties
openai.api.key=your_openai_api_key_here
```

