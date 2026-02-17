
import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  userId: mongoose.Types.ObjectId;
  meetingId: string;
  title: string;
  transcript: string;
  tags: string[];
  summary: {
    overview: string;
    keyPoints: string[];
    decisions: string[];
  };
  actionItems: Array<{
    task: string;
    assignee: string;
    deadline: string;
  }>;
  analytics: {
    talkTime: Map<string, number>;
    sentiment: string;
    productivityScore: number;
    topics: string[];
  };
  isActive: boolean;
  createdAt: Date;
}

const MeetingSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  meetingId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  transcript: { type: String, default: '' },
  tags: { type: [String], default: [] },
  summary: {
    overview: String,
    keyPoints: [String],
    decisions: [String],
  },
  actionItems: [{
    task: String,
    assignee: String,
    deadline: String,
  }],
  analytics: {
    talkTime: { type: Map, of: Number },
    sentiment: String,
    productivityScore: Number,
    topics: [String],
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
