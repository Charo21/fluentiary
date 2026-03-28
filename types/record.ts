export type RefineVersion = {
  id: string;
  blockId: string;
  parentVersionId: string | null;
  content: string;
  isEdited: boolean;
  versionNum: number;
  llmModel: string | null;
  promptTokens: number | null;
  createdAt: Date;
};

export type ContentBlock = {
  id: string;
  dayRecordId: string;
  rawText: string;
  sortOrder: number;
  createdAt: Date;
  versions: RefineVersion[];
};

export type DayRecord = {
  id: string;
  date: Date;
  userId: string | null;
  createdAt: Date;
  bulletPoints: string | null;
  blocks: ContentBlock[];
};
