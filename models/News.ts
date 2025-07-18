import mongoose, { Schema, models } from 'mongoose';

const NewsSchema = new Schema({
  headline: String,
  author: String,
  time: String,
  description: String,
  image: String,
  category: String,
  source: String,
  url: String,
  published: { type: Boolean, default: false },
});

const News = models.News || mongoose.model('News', NewsSchema);
export default News; 