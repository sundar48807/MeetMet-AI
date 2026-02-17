
export interface Meeting {
  id: string;
  meetingId: string; // Public UUID for sharing
  title: string;
  date: string;
  duration: string;
  participants: string[];
  transcript: string;
  tags: string[];
  summary?: Summary;
  actionItems: ActionItem[];
  analytics: Analytics;
  category: 'Internal' | 'Client' | 'Product' | 'General';
  followUpEmail?: string;
  kbEntry?: string;
  isLive?: boolean;
  isActive?: boolean;
  hostId?: string;
}

export interface Summary {
  overview: string;
  keyPoints: string[];
  decisions: string[];
}

export interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
}

export interface Analytics {
  talkTime: { [key: string]: number };
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  productivityScore: number;
  topics: string[];
  emotions: { label: string; score: number }[];
  engagementScore?: number;
  stressLevel?: 'Low' | 'Medium' | 'High';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  sender?: string;
}

export interface LiveEvent {
  type: 'decision' | 'action_item' | 'off_topic' | 'highlight';
  content: string;
  timestamp: Date;
}

export interface PeerConnection {
  peerId: string;
  stream: MediaStream;
  connection: RTCPeerConnection;
  name: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
}
