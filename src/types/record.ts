export interface DailyRecord {
  id: string
  date: string // ISO date string (YYYY-MM-DD)
  keyPoints: string
  freeWrite: string
  refinedText: string | null
  isComplete: boolean
  createdAt: string
  updatedAt: string
}

export interface RecordUpdateInput {
  keyPoints?: string
  freeWrite?: string
  refinedText?: string
}

export interface RefineRequest {
  text: string
}

export interface RefineResponse {
  refinedText: string
}
