export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture: string | null;
}

export interface Option {
  id: string;
  text: string;
  voteCount: number;
  pollId: string;
}

export interface PollParticipant {
  id: string;
  name: string;
  optionId: string;
  optionText: string;
  createdAt: string;
}

export interface Poll {
  id: string;
  question: string;
  isPublic: boolean;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  options: Option[];
  creator?: {
    id: string;
    name: string;
    profilePicture: string | null;
  };
  _count?: { votes: number };
  participants?: PollParticipant[];
}

export interface VoteStatus {
  hasVoted: boolean;
  canVote: boolean;
  reason?: "rate_limit" | "anonymous_used" | "already_voted";
  votedOptionId?: string;
  message?: string;
  retryAfterSeconds?: number;
}

export interface PollUpdate {
  pollId: string;
  options: Option[];
  totalVotes: number;
}